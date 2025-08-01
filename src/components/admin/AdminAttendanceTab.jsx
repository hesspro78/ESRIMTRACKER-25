import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader as ShadcnCardHeader } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { format, parseISO, isValid, differenceInMinutes, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Dialog } from '@/components/ui/dialog'; // Importez Dialog ici

import AttendanceList from '@/components/admin/attendance/AttendanceList';
import AttendanceFiltersDialog from '@/components/admin/attendance/AttendanceFiltersDialog';
import AttendanceCardHeader from '@/components/admin/attendance/AttendanceCardHeader';

const calculateWorkDuration = (clockIn, clockOut) => {
  if (!clockIn || !clockOut) return 'N/A';
  const start = parseISO(clockIn);
  const end = parseISO(clockOut);
  if (!isValid(start) || !isValid(end)) return 'N/A';
  const diff = differenceInMinutes(end, start);
  if (diff < 0) return 'Invalide';
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  return `${hours}h ${minutes}m`;
};

const AdminAttendanceTab = () => {
  const [allTimeEntries, setAllTimeEntries] = useState([]);
  const [filteredTimeEntries, setFilteredTimeEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [isFiltersDialogOpen, setIsFiltersDialogOpen] = useState(false);

  const [filters, setFilters] = useState({
    selectedEmployee: 'all',
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    searchTerm: '',
    sortOrder: 'desc',
  });

  const handleFiltersChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };
  
  const fetchEmployees = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error: supabaseError } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .order('full_name', { ascending: true });
      if (supabaseError) throw supabaseError;
      setEmployees(data || []);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  }, []);

  const fetchAllTimeEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!supabase) {
      setError("Supabase client n'est pas initialisé.");
      setLoading(false);
      return;
    }
    try {
      const { data, error: supabaseError } = await supabase
        .from('time_records')
        .select(`
          id,
          clock_in,
          clock_out,
          date,
          user_id,
          profiles (
            id,
            full_name,
            avatar_url,
            username
          )
        `)
        .order('clock_in', { ascending: filters.sortOrder === 'asc' });

      if (supabaseError) {
        throw supabaseError;
      }
      
      const formattedEntries = data.map(record => {
        const clockInDate = record.clock_in ? parseISO(record.clock_in) : null;
        const clockOutDate = record.clock_out ? parseISO(record.clock_out) : null;
        
        return {
          id: record.id,
          userId: record.user_id,
          userName: record.profiles?.full_name || record.profiles?.username || 'Utilisateur inconnu',
          avatarUrl: record.profiles?.avatar_url,
          clockIn: clockInDate,
          clockOut: clockOutDate,
          recordDate: record.date ? parseISO(record.date) : (clockInDate || new Date()),
          duration: calculateWorkDuration(record.clock_in, record.clock_out)
        };
      });
      setAllTimeEntries(formattedEntries);
    } catch (err) {
      console.error("Error fetching time entries:", err);
      setError("Impossible de charger l'historique des pointages. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }, [filters.sortOrder]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchAllTimeEntries();
  }, [fetchAllTimeEntries]);


  useEffect(() => {
    let entries = [...allTimeEntries];
    if (filters.selectedEmployee !== 'all') {
      entries = entries.filter(entry => entry.userId === filters.selectedEmployee);
    }

    const sDate = parseISO(filters.startDate);
    const eDate = parseISO(filters.endDate);

    if (isValid(sDate)) {
        entries = entries.filter(entry => entry.recordDate >= startOfDay(sDate));
    }
    if (isValid(eDate)) {
        entries = entries.filter(entry => entry.recordDate <= endOfDay(eDate));
    }

    if (filters.searchTerm) {
      entries = entries.filter(entry => 
        entry.userName.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }
    setFilteredTimeEntries(entries);
  }, [allTimeEntries, filters]);


  const handleApplyFilters = () => {
     fetchAllTimeEntries(); 
     setIsFiltersDialogOpen(false);
  };
  
  const handleDeleteAllTimeEntries = async () => {
    if (!supabase) {
      toast({
        title: "Erreur",
        description: "Supabase client n'est pas initialisé.",
        variant: "destructive",
      });
      return;
    }
    try {
      setLoading(true);
      const { error: deleteError } = await supabase
        .from('time_records')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); 

      if (deleteError) throw deleteError;

      toast({
        title: "Succès",
        description: "Tout l'historique des pointages a été supprimé.",
      });
      setAllTimeEntries([]);
      setFilteredTimeEntries([]);
    } catch (err) {
      console.error("Error deleting all time entries:", err);
      toast({
        title: "Erreur de suppression",
        description: "Impossible de supprimer l'historique des pointages. " + err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && allTimeEntries.length === 0 && !error) {
    return (
      <TabsContent value="attendance" className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </TabsContent>
    );
  }

  if (error) {
    return (
      <TabsContent value="attendance" className="space-y-6">
        <Card className="glass-effect border-destructive">
          <ShadcnCardHeader><AlertTriangle className="mr-2 h-5 w-5 inline text-destructive" />Erreur</ShadcnCardHeader>
          <CardContent>
            <p>{error}</p>
            <Button onClick={fetchAllTimeEntries} className="mt-4">Réessayer</Button>
          </CardContent>
        </Card>
      </TabsContent>
    );
  }
  
  return (
    <TabsContent value="attendance" className="space-y-6">
      <Dialog open={isFiltersDialogOpen} onOpenChange={setIsFiltersDialogOpen}>
        <Card className="glass-effect border-gradient shadow-xl">
          <ShadcnCardHeader>
            <AttendanceCardHeader 
              onOpenFilters={() => setIsFiltersDialogOpen(true)}
              onDeleteAll={handleDeleteAllTimeEntries}
            />
          </ShadcnCardHeader>
          <CardContent className="p-4 md:p-6 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/50 scrollbar-track-transparent">
            <AttendanceList entries={filteredTimeEntries} loading={loading} />
          </CardContent>
        </Card>
        {/* AttendanceFiltersDialog est maintenant un enfant direct de Dialog et recevra le contexte */}
        <AttendanceFiltersDialog
          employees={employees}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onApplyFilters={handleApplyFilters}
        />
      </Dialog>
    </TabsContent>
  );
};

export default AdminAttendanceTab;