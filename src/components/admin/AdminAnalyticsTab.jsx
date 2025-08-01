import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { TrendingUp, AlertTriangle, CheckCircle, Loader2, Sparkles, BrainCircuit, FileText, ShieldCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

const COLORS = ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899'];

const AdminAnalyticsTab = () => {
  const [departmentData, setDepartmentData] = useState([]);
  const [absenceData, setAbsenceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState(null);

  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: employees, error: employeesError } = await supabase
        .from('profiles')
        .select('department')
        .eq('role', 'employee');
      if (employeesError) throw employeesError;

      const { data: leaves, error: leavesError } = await supabase
        .from('leave_requests')
        .select('leave_type');
      if (leavesError) throw leavesError;

      const departments = {};
      employees.forEach(emp => {
        departments[emp.department || 'Non spécifié'] = (departments[emp.department || 'Non spécifié'] || 0) + 1;
      });
      setDepartmentData(Object.entries(departments).map(([name, value]) => ({ name, value })));

      const absenceReasons = {};
      leaves.forEach(leave => {
        const reason = leave.leave_type === 'sick' ? 'Maladie' : 
                      leave.leave_type === 'vacation' ? 'Vacances' : 
                      leave.leave_type === 'personal' ? 'Personnel' : 'Autre';
        absenceReasons[reason] = (absenceReasons[reason] || 0) + 1;
      });
      setAbsenceData(Object.entries(absenceReasons).map(([name, value]) => ({ name, value })));

    } catch (err) {
      console.error("Error fetching analytics data:", err);
      setError("Impossible de charger les données d'analyse.");
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const handleRunAiAnalysis = async () => {
    setLoadingAi(true);
    setAiError(null);
    setAiInsights(null);
    try {
      const { data: timeRecords, error: timeError } = await supabase.from('time_records').select('*');
      if (timeError) throw timeError;
      
      const { data: leaveRequests, error: leaveError } = await supabase.from('leave_requests').select('*');
      if (leaveError) throw leaveError;

      const { data: employees, error: empError } = await supabase.from('profiles').select('id, department, role');
      if (empError) throw empError;

      const { data, error: functionError } = await supabase.functions.invoke('analyze-trends', {
        body: { timeRecords, leaveRequests, employees },
      });

      if (functionError) throw functionError;
      
      if (data.error) throw new Error(data.error);
      
      setAiInsights(data);
      toast({ title: "Analyse IA terminée", description: "Les insights ont été générés avec succès." });

    } catch (err) {
      console.error("Error running AI analysis:", err);
      setAiError("Une erreur est survenue lors de l'analyse IA. " + err.message);
      toast({ title: "Erreur d'analyse IA", description: err.message, variant: "destructive" });
    } finally {
      setLoadingAi(false);
    }
  };

  if (loading) {
    return (
      <TabsContent value="analytics" className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </TabsContent>
    );
  }

  if (error) {
    return (
      <TabsContent value="analytics" className="text-center text-destructive">
        <p>{error}</p>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="analytics" className="space-y-6">
      <h2 className="text-2xl font-bold">Analyses et Statistiques</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-effect border-gradient">
          <CardHeader>
            <CardTitle>Répartition par Département</CardTitle>
            <CardDescription>Distribution des employés par département</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="chart-container h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={departmentData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                    {departmentData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-gradient">
          <CardHeader>
            <CardTitle>Analyse des Absences</CardTitle>
            <CardDescription>Types de congés les plus fréquents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="chart-container h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={absenceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.7)" />
                  <YAxis stroke="rgba(255,255,255,0.7)" />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px' }} />
                  <Bar dataKey="value" fill="url(#gradientBarAnalytics)" radius={[4, 4, 0, 0]} />
                  <defs><linearGradient id="gradientBarAnalytics" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#d97706" /></linearGradient></defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-effect border-gradient">
        <CardHeader>
          <CardTitle className="flex items-center"><BrainCircuit className="mr-2 h-6 w-6 text-primary" />Analyse IA des Tendances</CardTitle>
          <CardDescription>Générez des insights automatiques avec l'IA de Deepseek.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!aiInsights && !loadingAi && !aiError && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Prêt à découvrir des tendances cachées dans vos données ?</p>
              <Button onClick={handleRunAiAnalysis} className="gradient-button">
                <Sparkles className="mr-2 h-4 w-4" />
                Lancer l'analyse IA
              </Button>
            </div>
          )}
          {loadingAi && (
            <div className="flex flex-col items-center justify-center py-8 space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">L'IA analyse vos données... Veuillez patienter.</p>
            </div>
          )}
          {aiError && (
            <div className="text-center py-8 text-destructive">
              <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
              <p className="font-semibold">Erreur d'analyse</p>
              <p className="text-sm">{aiError}</p>
              <Button onClick={handleRunAiAnalysis} variant="secondary" className="mt-4">Réessayer</Button>
            </div>
          )}
          {aiInsights && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg flex items-center mb-2"><FileText className="mr-2 h-5 w-5 text-green-400"/>Synthèse des tendances</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {aiInsights.synthesis.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-lg flex items-center mb-2"><TrendingUp className="mr-2 h-5 w-5 text-blue-400"/>Recommandations</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {aiInsights.recommendations.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-background/50 rounded-lg">
                  <h4 className="font-semibold flex items-center mb-1"><ShieldCheck className="mr-2 h-4 w-4 text-purple-400"/>Niveau de confiance</h4>
                  <p className="text-muted-foreground">{aiInsights.confidence}</p>
                </div>
                <div className="p-3 bg-background/50 rounded-lg">
                  <h4 className="font-semibold flex items-center mb-1"><AlertTriangle className="mr-2 h-4 w-4 text-yellow-400"/>Limitations</h4>
                  <p className="text-muted-foreground">{aiInsights.limitations}</p>
                </div>
              </div>
              <div className="text-center pt-4">
                <Button onClick={handleRunAiAnalysis} variant="outline">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Relancer l'analyse
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
};

export default AdminAnalyticsTab;