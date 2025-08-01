import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { 
  User, 
  Calendar, 
  Clock, 
  XCircle, 
  CheckCircle,
  DollarSign,
  Calculator,
  FileText,
  Settings,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { format, startOfMonth, endOfMonth, differenceInDays, differenceInHours } from 'date-fns';
import { fr } from 'date-fns/locale';

const AdminEmployeeStatsTab = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeStats, setEmployeeStats] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [loading, setLoading] = useState(false);
  const [salarySettings, setSalarySettings] = useState({
    salaryType: 'daily', // 'daily' or 'hourly'
    dailyRate: 400,
    hourlyRate: 50,
    absencePenalty: 50,
    absencePenaltyType: 'fixed', // 'fixed' or 'percentage'
    leavesPaid: true,
    workingHoursPerDay: 8,
    workingDaysPerMonth: 22
  });

  const loadEmployees = async () => {
    try {
      if (!supabase) {
        // Mode démo
        setEmployees([
          { id: '1', full_name: 'Ahmed Benali', username: 'ahmed', department: 'Commercial' },
          { id: '2', full_name: 'Fatima Zahra', username: 'fatima', department: 'Marketing' },
          { id: '3', full_name: 'Mohammed Alami', username: 'mohammed', department: 'IT' }
        ]);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, department')
        .eq('role', 'employee')
        .order('full_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.warn('Error loading employees:', error);
      toast({
        title: "Mode démo",
        description: "Affichage des données de démonstration.",
        variant: "default"
      });
    }
  };

  const calculateEmployeeStats = async (employeeId) => {
    if (!employeeId) return;

    try {
      setLoading(true);
      const startDate = startOfMonth(new Date(selectedMonth));
      const endDate = endOfMonth(new Date(selectedMonth));
      const workingDaysInMonth = salarySettings.workingDaysPerMonth;

      if (!supabase) {
        // Données de démo
        const demoStats = {
          workedDays: 20,
          workedHours: 160,
          unjustifiedAbsences: 2,
          leaveDays: 2,
          unpunchedDays: 0,
          presentDays: 20,
          totalSalary: 8000,
          penaltyAmount: 100,
          finalSalary: 7900
        };
        setEmployeeStats(demoStats);
        setLoading(false);
        return;
      }

      // Récupérer les pointages de l'employé pour le mois
      const { data: timeRecords, error: timeError } = await supabase
        .from('time_records')
        .select('*')
        .eq('user_id', employeeId)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date');

      if (timeError) throw timeError;

      // Récupérer les congés de l'employé
      const { data: leaves, error: leaveError } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', employeeId)
        .eq('status', 'approved')
        .or(`start_date.lte.${format(endDate, 'yyyy-MM-dd')},end_date.gte.${format(startDate, 'yyyy-MM-dd')}`);

      if (leaveError) throw leaveError;

      // Calculer les statistiques
      let workedDays = 0;
      let workedHours = 0;
      const presentDays = new Set();

      timeRecords?.forEach(record => {
        if (record.clock_in) {
          presentDays.add(record.date);
          if (record.clock_out) {
            const clockIn = new Date(record.clock_in);
            const clockOut = new Date(record.clock_out);
            const hours = differenceInHours(clockOut, clockIn);
            workedHours += hours;
            workedDays++;
          } else {
            // Si pas de clock_out, estimer les heures de travail par défaut
            workedHours += salarySettings.workingHoursPerDay;
            workedDays++;
          }
        }
      });

      // Calculer les jours de congé dans le mois
      let leaveDays = 0;
      leaves?.forEach(leave => {
        const leaveStart = new Date(Math.max(new Date(leave.start_date), startDate));
        const leaveEnd = new Date(Math.min(new Date(leave.end_date), endDate));
        if (leaveStart <= leaveEnd) {
          leaveDays += differenceInDays(leaveEnd, leaveStart) + 1;
        }
      });

      const unpunchedDays = Math.max(0, workingDaysInMonth - workedDays - leaveDays);
      const unjustifiedAbsences = unpunchedDays; // Considérer les jours non pointés comme absences injustifiées

      // Calculer le salaire
      let baseSalary = 0;
      if (salarySettings.salaryType === 'daily') {
        baseSalary = workedDays * salarySettings.dailyRate;
        if (salarySettings.leavesPaid) {
          baseSalary += leaveDays * salarySettings.dailyRate;
        }
      } else {
        baseSalary = workedHours * salarySettings.hourlyRate;
        if (salarySettings.leavesPaid) {
          baseSalary += leaveDays * salarySettings.workingHoursPerDay * salarySettings.hourlyRate;
        }
      }

      // Calculer les pénalités d'absence
      let penaltyAmount = 0;
      if (salarySettings.absencePenaltyType === 'fixed') {
        penaltyAmount = unjustifiedAbsences * salarySettings.absencePenalty;
      } else {
        penaltyAmount = baseSalary * (salarySettings.absencePenalty / 100);
      }

      const finalSalary = Math.max(0, baseSalary - penaltyAmount);

      setEmployeeStats({
        workedDays,
        workedHours: Math.round(workedHours * 10) / 10,
        unjustifiedAbsences,
        leaveDays,
        unpunchedDays,
        presentDays: presentDays.size,
        totalSalary: Math.round(baseSalary),
        penaltyAmount: Math.round(penaltyAmount),
        finalSalary: Math.round(finalSalary)
      });

    } catch (error) {
      console.error('Error calculating employee stats:', error);
      toast({
        title: "Erreur de calcul",
        description: "Impossible de calculer les statistiques.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSalarySettings = () => {
    localStorage.setItem('employeeSalarySettings', JSON.stringify(salarySettings));
    toast({
      title: "Paramètres sauvegardés",
      description: "Les paramètres de salaire ont été mis à jour."
    });
  };

  const generateReport = () => {
    if (!selectedEmployee || !employeeStats) {
      toast({
        title: "Aucune donnée",
        description: "Veuillez sélectionner un employé et calculer ses statistiques.",
        variant: "destructive"
      });
      return;
    }

    const report = {
      employee: selectedEmployee,
      month: selectedMonth,
      stats: employeeStats,
      settings: salarySettings,
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-${selectedEmployee.full_name || selectedEmployee.username}-${selectedMonth}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Rapport généré",
      description: "Le rapport individuel a été téléchargé."
    });
  };

  useEffect(() => {
    loadEmployees();
    
    // Charger les paramètres sauvegardés
    const saved = localStorage.getItem('employeeSalarySettings');
    if (saved) {
      setSalarySettings(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      calculateEmployeeStats(selectedEmployee.id);
    }
  }, [selectedEmployee, selectedMonth, salarySettings]);

  return (
    <TabsContent value="employee-stats" className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Statistiques Individuelles des Employés</h2>
          <p className="text-muted-foreground">Suivi détaillé et calcul de salaire personnalisé par employé</p>
        </div>
      </div>

      {/* Paramètres de calcul */}
      <Card className="glass-effect border-gradient">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5 text-blue-400" />
            Paramètres de Calcul
          </CardTitle>
          <CardDescription>Configurez les règles de calcul du salaire</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Type de calcul</Label>
            <Select value={salarySettings.salaryType} onValueChange={(value) => 
              setSalarySettings(prev => ({ ...prev, salaryType: value }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Journalier</SelectItem>
                <SelectItem value="hourly">Horaire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Taux journalier (MAD)</Label>
            <Input
              type="number"
              value={salarySettings.dailyRate}
              onChange={(e) => setSalarySettings(prev => ({ ...prev, dailyRate: Number(e.target.value) }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Taux horaire (MAD)</Label>
            <Input
              type="number"
              value={salarySettings.hourlyRate}
              onChange={(e) => setSalarySettings(prev => ({ ...prev, hourlyRate: Number(e.target.value) }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Pénalité absence</Label>
            <Input
              type="number"
              value={salarySettings.absencePenalty}
              onChange={(e) => setSalarySettings(prev => ({ ...prev, absencePenalty: Number(e.target.value) }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Type de pénalité</Label>
            <Select value={salarySettings.absencePenaltyType} onValueChange={(value) => 
              setSalarySettings(prev => ({ ...prev, absencePenaltyType: value }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Montant fixe</SelectItem>
                <SelectItem value="percentage">Pourcentage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Congés payés</Label>
            <Select value={salarySettings.leavesPaid.toString()} onValueChange={(value) => 
              setSalarySettings(prev => ({ ...prev, leavesPaid: value === 'true' }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Oui</SelectItem>
                <SelectItem value="false">Non</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-full">
            <Button onClick={saveSalarySettings} className="gradient-blue">
              <DollarSign className="mr-2 h-4 w-4" />
              Sauvegarder les paramètres
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sélection employé et mois */}
      <Card className="glass-effect border-gradient">
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCheck className="mr-2 h-5 w-5 text-green-400" />
            Sélection Employé
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Employé</Label>
            <Select value={selectedEmployee?.id || ''} onValueChange={(value) => {
              const employee = employees.find(emp => emp.id === value);
              setSelectedEmployee(employee);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un employé" />
              </SelectTrigger>
              <SelectContent>
                {employees.map(employee => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.full_name || employee.username} - {employee.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Mois</Label>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistiques de l'employé */}
      {selectedEmployee && employeeStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass-effect border-gradient hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Jours Travaillés</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{employeeStats.workedDays}</div>
                <p className="text-xs text-muted-foreground">jours ce mois-ci</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass-effect border-gradient hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Heures de Présence</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500">{employeeStats.workedHours}h</div>
                <p className="text-xs text-muted-foreground">heures travaillées</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-effect border-gradient hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Absences Injustifiées</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{employeeStats.unjustifiedAbsences}</div>
                <p className="text-xs text-muted-foreground">jours d'absence</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="glass-effect border-gradient hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Jours de Congé</CardTitle>
                <Calendar className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">{employeeStats.leaveDays}</div>
                <p className="text-xs text-muted-foreground">jours en congé</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="glass-effect border-gradient hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Jours Non Pointés</CardTitle>
                <XCircle className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-500">{employeeStats.unpunchedDays}</div>
                <p className="text-xs text-muted-foreground">jours sans pointage</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="glass-effect border-gradient hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Salaire Final</CardTitle>
                <DollarSign className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-500">{employeeStats.finalSalary.toLocaleString()} MAD</div>
                <p className="text-xs text-muted-foreground">salaire net</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Détail du calcul */}
      {selectedEmployee && employeeStats && (
        <Card className="glass-effect border-gradient">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calculator className="mr-2 h-5 w-5 text-purple-400" />
              Détail du Calcul de Salaire - {selectedEmployee.full_name || selectedEmployee.username}
            </CardTitle>
            <CardDescription>
              {format(new Date(selectedMonth), 'MMMM yyyy', { locale: fr })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-green-500/10 border-green-500/20">
                <CardContent className="p-4">
                  <div className="text-xl font-bold text-green-400">{employeeStats.totalSalary.toLocaleString()} MAD</div>
                  <p className="text-sm text-muted-foreground">Salaire de base</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {salarySettings.salaryType === 'daily' 
                      ? `${employeeStats.workedDays} jours × ${salarySettings.dailyRate} MAD`
                      : `${employeeStats.workedHours}h × ${salarySettings.hourlyRate} MAD`
                    }
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-red-500/10 border-red-500/20">
                <CardContent className="p-4">
                  <div className="text-xl font-bold text-red-400">-{employeeStats.penaltyAmount.toLocaleString()} MAD</div>
                  <p className="text-sm text-muted-foreground">Pénalités</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {employeeStats.unjustifiedAbsences} absences × {salarySettings.absencePenalty} 
                    {salarySettings.absencePenaltyType === 'percentage' ? '%' : ' MAD'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-blue-500/10 border-blue-500/20">
                <CardContent className="p-4">
                  <div className="text-xl font-bold text-blue-400">{employeeStats.finalSalary.toLocaleString()} MAD</div>
                  <p className="text-sm text-muted-foreground">Salaire net</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Après déductions
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button onClick={generateReport} className="gradient-purple">
                <FileText className="mr-2 h-4 w-4" />
                Générer Rapport
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedEmployee && (
        <Card className="glass-effect border-gradient">
          <CardContent className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun employé sélectionné</h3>
            <p className="text-muted-foreground">
              Sélectionnez un employé pour voir ses statistiques détaillées et calculer son salaire.
            </p>
          </CardContent>
        </Card>
      )}
    </TabsContent>
  );
};

export default AdminEmployeeStatsTab;
