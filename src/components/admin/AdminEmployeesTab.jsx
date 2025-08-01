import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { UserPlus, Edit, Trash2, Loader2, AlertTriangle, QrCode } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '@/hooks/useAuth.jsx';
import QRCode from 'qrcode.react';

const AdminEmployeesTab = () => {
  const [employees, setEmployees] = useState([]);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isEditEmployeeOpen, setIsEditEmployeeOpen] = useState(false);
  const [isQrCodeOpen, setIsQrCodeOpen] = useState(false);
  const [selectedEmployeeForQr, setSelectedEmployeeForQr] = useState(null);
  const [newEmployee, setNewEmployee] = useState({ full_name: '', email: '', department: '', role: 'employee', password: '' });
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { userProfile } = useAuth();

  const loadEmployees = useCallback(async () => {
    if (!supabase) {
      setError("Client Supabase non initialisé.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: supabaseError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'employee')
        .order('full_name', { ascending: true });

      if (supabaseError) throw supabaseError;
      setEmployees(data || []);
    } catch (err) {
      console.error("Error loading employees:", err);
      setError("Impossible de charger la liste des employés.");
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const handleAddEmployee = async () => {
    if (!supabase) {
      toast({ title: "Erreur", description: "Client Supabase non configuré.", variant: "destructive" });
      return;
    }
    setLoading(true);
    
    // Note: L'email est stocké dans la table auth, pas dans profiles
    // La vérification d'unicité sera gérée par Supabase Auth lors du signUp



    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: newEmployee.email,
      password: newEmployee.password,
      options: {
        data: { 
          full_name: newEmployee.full_name,
          department: newEmployee.department,
          username: newEmployee.email,
        },
        app_metadata: { role: 'employee' }
      }
    });

    if (signUpError) {
      toast({ title: "Erreur d'inscription", description: signUpError.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    
    if (signUpData.user) {
      setNewEmployee({ full_name: '', email: '', department: '', role: 'employee', password: '' });
      setIsAddEmployeeOpen(false);
      await loadEmployees();
      toast({ title: "Employé ajouté", description: "L'employé a été ajouté avec succès. Un email de confirmation a été envoyé." });
    } else {
      toast({ title: "Erreur", description: "Aucun utilisateur retourné après l'inscription.", variant: "destructive" });
    }
    setLoading(false);
  };
  
  const handleEditEmployee = async () => {
    if (!editingEmployee || !supabase) return;
    setLoading(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        full_name: editingEmployee.full_name, 
        department: editingEmployee.department,
      })
      .eq('id', editingEmployee.id);

    if (error) {
      toast({ title: "Erreur de mise à jour", description: error.message, variant: "destructive" });
    } else {
      setEditingEmployee(null);
      setIsEditEmployeeOpen(false);
      await loadEmployees();
      toast({ title: "Employé modifié", description: "Les informations de l'employé ont été mises à jour." });
    }
    setLoading(false);
  };
  
  const openEditModal = (employee) => {
    setEditingEmployee({...employee});
    setIsEditEmployeeOpen(true);
  };

  const openQrCodeModal = (employee) => {
    setSelectedEmployeeForQr(employee);
    setIsQrCodeOpen(true);
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (!supabase || userProfile?.role !== 'admin') {
      toast({ title: "Action non autorisée", description: "Vous n'avez pas les droits pour supprimer un employé.", variant: "destructive" });
      return;
    }
    
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet employé ? Cette action est IRREVERSIBLE et supprimera l'utilisateur ainsi que toutes ses données associées (pointages, congés, etc.).")) {
        return;
    }

    setLoading(true);
    
    try {
      const { error: functionError } = await supabase.functions.invoke('delete-user', {
        body: { userId: employeeId },
      });

      if (functionError) throw functionError;

      toast({ title: "Employé supprimé", description: "L'employé a été supprimé avec succès." });
      await loadEmployees();

    } catch (err) {
      console.error("Error deleting employee:", err);
      toast({ title: "Erreur de suppression", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (error && employees.length === 0) {
    return (
      <TabsContent value="employees" className="space-y-6">
        <Card className="glass-effect border-destructive">
          <CardHeader><CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2 h-5 w-5" />Erreur de chargement</CardTitle></CardHeader>
          <CardContent><p>{error}</p><Button onClick={loadEmployees} className="mt-4">Réessayer</Button></CardContent>
        </Card>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="employees" className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h2 className="text-3xl font-bold text-gradient mb-4 sm:mb-0">Gestion des Employés</h2>
        <Dialog open={isAddEmployeeOpen} onOpenChange={setIsAddEmployeeOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-button hover:shadow-primary-glow">
              <UserPlus className="mr-2 h-5 w-5" />
              Ajouter un Employé
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-dialog sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="text-2xl">Ajouter un Nouvel Employé</DialogTitle>
              <DialogDescription>Remplissez les informations ci-dessous.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="add-full_name">Nom complet</Label>
                <Input id="add-full_name" value={newEmployee.full_name} onChange={(e) => setNewEmployee({...newEmployee, full_name: e.target.value})} placeholder="Jean Dupont" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-email">Email</Label>
                <Input id="add-email" type="email" value={newEmployee.email} onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})} placeholder="jean.dupont@exemple.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-department">Département</Label>
                <Input id="add-department" value={newEmployee.department} onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})} placeholder="Commercial" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-password">Mot de passe (temporaire)</Label>
                <Input id="add-password" type="password" value={newEmployee.password} onChange={(e) => setNewEmployee({...newEmployee, password: e.target.value})} placeholder="Minimum 6 caractères" />
              </div>
              <DialogClose asChild>
                <Button onClick={handleAddEmployee} className="w-full gradient-button" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  Ajouter l'Employé
                </Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading && employees.length === 0 && (
         <div className="flex justify-center items-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
         </div>
      )}

      <Card className="glass-effect border-gradient shadow-xl">
        <CardContent className="p-4 md:p-6">
          {employees.length === 0 && !loading ? (
            <p className="text-muted-foreground text-center py-8">Aucun employé trouvé.</p>
          ) : (
            <div className="space-y-4">
              {employees.map((employee) => (
                <motion.div
                  key={employee.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-card/60 backdrop-blur-sm rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-white/10"
                >
                  <div className="flex items-center space-x-4 mb-3 sm:mb-0">
                    <Avatar className="h-12 w-12 border-2 border-primary/50">
                       <AvatarImage src={employee.avatar_url || undefined} alt={employee.full_name || employee.username} />
                       <AvatarFallback className="gradient-purple text-white text-lg">
                         {employee.full_name ? employee.full_name.charAt(0).toUpperCase() : (employee.username ? employee.username.charAt(0).toUpperCase() : '?')}
                       </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">{employee.full_name || employee.username}</h3>
                      <p className="text-sm text-muted-foreground">{employee.username}</p>
                      <p className="text-xs text-muted-foreground">{employee.department || 'Non défini'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="icon" onClick={() => openQrCodeModal(employee)} className="hover:text-green-500 border-green-500/50 hover:border-green-500">
                      <QrCode className="h-5 w-5" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => openEditModal(employee)} className="hover:text-primary border-primary/50 hover:border-primary">
                      <Edit className="h-5 w-5" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleDeleteEmployee(employee.id)} className="text-destructive hover:text-red-700 border-destructive/50 hover:border-destructive">
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {editingEmployee && (
        <Dialog open={isEditEmployeeOpen} onOpenChange={setIsEditEmployeeOpen}>
          <DialogContent className="glass-dialog sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="text-2xl">Modifier l'Employé</DialogTitle>
              <DialogDescription>Mettez à jour les informations.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-full_name">Nom complet</Label>
                <Input id="edit-full_name" value={editingEmployee.full_name || ''} onChange={(e) => setEditingEmployee({...editingEmployee, full_name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email (non modifiable ici)</Label>
                <Input id="edit-email" type="email" value={editingEmployee.email || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-department">Département</Label>
                <Input id="edit-department" value={editingEmployee.department || ''} onChange={(e) => setEditingEmployee({...editingEmployee, department: e.target.value})} />
              </div>
              <DialogClose asChild>
                <Button onClick={handleEditEmployee} className="w-full gradient-button" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit className="mr-2 h-4 w-4" />}
                  Enregistrer
                </Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {selectedEmployeeForQr && (
        <Dialog open={isQrCodeOpen} onOpenChange={setIsQrCodeOpen}>
          <DialogContent className="glass-dialog sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl">QR Code pour {selectedEmployeeForQr.full_name}</DialogTitle>
              <DialogDescription>Cet employé peut scanner ce code pour pointer.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center p-8">
              <div className="p-4 bg-white rounded-lg">
                <QRCode value={selectedEmployeeForQr.id} size={256} />
              </div>
              <p className="mt-4 text-muted-foreground">ID: {selectedEmployeeForQr.id}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </TabsContent>
  );
};

export default AdminEmployeesTab;
