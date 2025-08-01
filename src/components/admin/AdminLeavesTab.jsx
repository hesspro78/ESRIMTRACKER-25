import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Calendar, Trash2, Edit, Loader2, AlertTriangle, PlusCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { format, parseISO } from 'date-fns';

const AdminLeavesTab = () => {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentLeave, setCurrentLeave] = useState({ user_id: '', leave_type: 'vacation', start_date: '', end_date: '', reason: '', status: 'approved' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: employeesData, error: employeesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'employee')
        .order('full_name');
      if (employeesError) throw employeesError;
      setEmployees(employeesData || []);

      const { data: leavesData, error: leavesError } = await supabase
        .from('leave_requests')
        .select('*, profiles!leave_requests_user_id_fkey(full_name, avatar_url)')
        .order('start_date', { ascending: false });
      if (leavesError) throw leavesError;
      setLeaves(leavesData || []);
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err.message || "Impossible de charger les données des congés.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenModal = (leave = null) => {
    if (leave) {
      setIsEditing(true);
      setCurrentLeave({
        id: leave.id,
        user_id: leave.user_id,
        leave_type: leave.leave_type,
        start_date: format(parseISO(leave.start_date), 'yyyy-MM-dd'),
        end_date: format(parseISO(leave.end_date), 'yyyy-MM-dd'),
        reason: leave.reason || '',
        status: leave.status,
      });
    } else {
      setIsEditing(false);
      setCurrentLeave({ user_id: '', leave_type: 'vacation', start_date: '', end_date: '', reason: '', status: 'approved' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    setLoading(true);
    const { id, ...leaveData } = currentLeave;
    
    const query = isEditing
      ? supabase.from('leave_requests').update(leaveData).eq('id', id)
      : supabase.from('leave_requests').insert(leaveData);

    const { error } = await query;

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Succès", description: `Congé ${isEditing ? 'modifié' : 'ajouté'} avec succès.` });
      setIsModalOpen(false);
      await loadData();
    }
    setLoading(false);
  };

  const handleDeleteLeave = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce congé ?")) return;
    setLoading(true);
    const { error } = await supabase.from('leave_requests').delete().eq('id', id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Succès", description: "Congé supprimé." });
      await loadData();
    }
    setLoading(false);
  };

  if (loading && leaves.length === 0) {
    return <TabsContent value="leaves" className="flex justify-center items-center min-h-[200px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></TabsContent>;
  }

  if (error) {
    return (
      <TabsContent value="leaves" className="space-y-6">
        <Card className="glass-effect border-destructive">
          <CardHeader><CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2 h-5 w-5" />Erreur</CardTitle></CardHeader>
          <CardContent><p>{error}</p><Button onClick={loadData} className="mt-4">Réessayer</Button></CardContent>
        </Card>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="leaves" className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gradient">Gestion des Congés</h2>
        <Button onClick={() => handleOpenModal()} className="gradient-button">
          <PlusCircle className="mr-2 h-5 w-5" />
          Ajouter un congé
        </Button>
      </div>

      <Card className="glass-effect border-gradient">
        <CardContent className="p-6 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/50 scrollbar-track-transparent">
          <div className="space-y-4">
            {leaves.length > 0 ? leaves.map((leave) => (
              <motion.div
                key={leave.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 bg-card/60 rounded-lg shadow-md border border-white/10"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-full gradient-orange">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{leave.profiles?.full_name || 'Employé inconnu'}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{leave.leave_type}</p>
                    <p className="text-xs text-muted-foreground">{leave.reason}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {format(parseISO(leave.start_date), 'dd/MM/yy')} - {format(parseISO(leave.end_date), 'dd/MM/yy')}
                  </p>
                  <p className={`text-sm font-semibold capitalize ${leave.status === 'approved' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {leave.status}
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenModal(leave)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteLeave(leave.id)} className="text-red-500 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )) : <p className="text-center text-muted-foreground py-8">Aucun congé enregistré.</p>}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="glass-dialog">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Modifier' : 'Ajouter'} un congé</DialogTitle>
            <DialogDescription>Enregistrez les informations du congé.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="leave-employee">Employé</Label>
              <Select value={currentLeave.user_id} onValueChange={(value) => setCurrentLeave({...currentLeave, user_id: value})}>
                <SelectTrigger id="leave-employee"><SelectValue placeholder="Sélectionner un employé" /></SelectTrigger>
                <SelectContent>{employees.map((emp) => (<SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="leave-type">Type</Label>
              <Select value={currentLeave.leave_type} onValueChange={(value) => setCurrentLeave({...currentLeave, leave_type: value})}>
                <SelectTrigger id="leave-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacation">Vacances</SelectItem>
                  <SelectItem value="sick">Maladie</SelectItem>
                  <SelectItem value="personal">Personnel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="leave-startDate">Date de début</Label>
                <Input id="leave-startDate" type="date" value={currentLeave.start_date} onChange={(e) => setCurrentLeave({...currentLeave, start_date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leave-endDate">Date de fin</Label>
                <Input id="leave-endDate" type="date" value={currentLeave.end_date} onChange={(e) => setCurrentLeave({...currentLeave, end_date: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="leave-reason">Raison (optionnel)</Label>
              <Input id="leave-reason" value={currentLeave.reason} onChange={(e) => setCurrentLeave({...currentLeave, reason: e.target.value})} placeholder="Raison du congé" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leave-status">Statut</Label>
              <Select value={currentLeave.status} onValueChange={(value) => setCurrentLeave({...currentLeave, status: value})}>
                <SelectTrigger id="leave-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approuvé</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="rejected">Rejeté</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogClose asChild>
              <Button onClick={handleSubmit} className="w-full gradient-button" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEditing ? 'Enregistrer' : 'Ajouter')}
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </TabsContent>
  );
};

export default AdminLeavesTab;