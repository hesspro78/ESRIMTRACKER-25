import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth.jsx';
import { format, differenceInMinutes, startOfDay, endOfDay, parseISO, isValid } from 'date-fns';

export const useTimeTracking = () => {
  const { session, userProfile } = useAuth();
  const [timeEntries, setTimeEntries] = useState([]);
  const [currentStatusInternal, setCurrentStatusInternal] = useState('loading');
  const [todayWorkTime, setTodayWorkTime] = useState("0h 0m");
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [activeRecordId, setActiveRecordId] = useState(null);

  const fetchUserTimeData = useCallback(async () => {
    if (!session?.user?.id || !supabase) {
      setCurrentStatusInternal('unknown');
      setTimeEntries([]);
      setTodayWorkTime("0h 0m");
      setWeeklyStats([]);
      return;
    }

    setCurrentStatusInternal('loading');
    try {
      const today = new Date();
      const { data: records, error } = await supabase
        .from('time_records')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('clock_in', startOfDay(today).toISOString())
        .lte('clock_in', endOfDay(today).toISOString())
        .order('clock_in', { ascending: false });

      if (error) {
        throw error;
      }
      
      setTimeEntries(records || []);

      const openEntry = records?.find(entry => !entry.clock_out);
      if (openEntry) {
        setCurrentStatusInternal('checked-in');
        setActiveRecordId(openEntry.id);
      } else if (records && records.length > 0) {
        setCurrentStatusInternal('checked-out');
        setActiveRecordId(null);
      } else {
        setCurrentStatusInternal('unknown');
        setActiveRecordId(null);
      }
      
      calculateTodayWorkTime(records || []);
      calculateWeeklyStats();

    } catch (error) {
      console.error("Error fetching time data:", error);
      toast({ title: "Erreur", description: "Impossible de récupérer les données de pointage.", variant: "destructive" });
      setCurrentStatusInternal('error');
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchUserTimeData();
  }, [fetchUserTimeData]);

  const calculateTodayWorkTime = (todaysRecords) => {
    let totalMinutes = 0;
    todaysRecords.forEach(record => {
      if (record.clock_in && record.clock_out) {
        const clockInTime = parseISO(record.clock_in);
        const clockOutTime = parseISO(record.clock_out);
        if (isValid(clockInTime) && isValid(clockOutTime)) {
          totalMinutes += differenceInMinutes(clockOutTime, clockInTime);
        }
      } else if (record.clock_in && !record.clock_out && currentStatusInternal === 'checked-in') {
        const clockInTime = parseISO(record.clock_in);
        if(isValid(clockInTime)) {
            totalMinutes += differenceInMinutes(new Date(), clockInTime);
        }
      }
    });
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    setTodayWorkTime(`${hours}h ${minutes}m`);
  };
  
  useEffect(() => {
    let intervalId;
    if (currentStatusInternal === 'checked-in') {
      intervalId = setInterval(() => {
         calculateTodayWorkTime(timeEntries);
      }, 60000); 
    }
    return () => clearInterval(intervalId);
  }, [currentStatusInternal, timeEntries]);


  const calculateWeeklyStats = async () => {
    if (!session?.user?.id || !supabase) return;

    const today = new Date();
    const startOfWeek = startOfDay(new Date(today.setDate(today.getDate() - today.getDay())));
    const endOfWeek = endOfDay(new Date(today.setDate(today.getDate() - today.getDay() + 6)));

    const { data, error } = await supabase
      .from('time_records')
      .select('clock_in, clock_out, date')
      .eq('user_id', session.user.id)
      .gte('date', format(startOfWeek, 'yyyy-MM-dd'))
      .lte('date', format(endOfWeek, 'yyyy-MM-dd'));

    if (error) {
      console.error("Error fetching weekly stats:", error);
      return;
    }

    const dailyHours = { 'Dim': 0, 'Lun': 0, 'Mar': 0, 'Mer': 0, 'Jeu': 0, 'Ven': 0, 'Sam': 0 };
    const daysOrder = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    
    data.forEach(record => {
      if (record.clock_in && record.clock_out) {
        const clockInTime = parseISO(record.clock_in);
        const clockOutTime = parseISO(record.clock_out);
        if (isValid(clockInTime) && isValid(clockOutTime)) {
            const dayName = daysOrder[clockInTime.getDay()];
            const hoursWorked = differenceInMinutes(clockOutTime, clockInTime) / 60;
            dailyHours[dayName] += hoursWorked;
        }
      }
    });
    setWeeklyStats(daysOrder.map(day => ({ day, hours: Math.round(dailyHours[day] * 100) / 100 })));
  };

  const clockIn = async () => {
    if (!session?.user?.id || !supabase) {
      toast({ title: "Erreur", description: "Utilisateur non connecté ou service indisponible.", variant: "destructive" });
      return;
    }
    if (currentStatusInternal === 'checked-in') {
      toast({ title: "Déjà pointé", description: "Vous êtes déjà en service.", variant: "destructive" });
      return;
    }
    setCurrentStatusInternal('loading');
    const now = new Date();
    const newEntry = {
      user_id: session.user.id,
      date: format(now, 'yyyy-MM-dd'),
      clock_in: now.toISOString(),
    };

    const { data, error } = await supabase
      .from('time_records')
      .insert(newEntry)
      .select()
      .single();

    if (error) {
      console.error("Error clocking in:", error);
      toast({ title: "Erreur de pointage", description: error.message, variant: "destructive" });
      setCurrentStatusInternal('unknown');
      return;
    }

    setActiveRecordId(data.id);
    setTimeEntries(prev => [data, ...prev]);
    setCurrentStatusInternal('checked-in');
    toast({ title: "Pointage d'entrée réussi", description: `Entrée enregistrée à ${format(now, 'HH:mm')}` });
    await fetchUserTimeData(); // Refresh data
  };

  const clockOut = async () => {
    if (!session?.user?.id || !supabase) {
      toast({ title: "Erreur", description: "Utilisateur non connecté ou service indisponible.", variant: "destructive" });
      return;
    }
    if (currentStatusInternal !== 'checked-in' || !activeRecordId) {
      toast({ title: "Erreur de pointage", description: "Vous devez d'abord pointer votre entrée.", variant: "destructive" });
      return;
    }
    setCurrentStatusInternal('loading');
    const now = new Date();
    const { data, error } = await supabase
      .from('time_records')
      .update({ clock_out: now.toISOString() })
      .eq('id', activeRecordId)
      .select()
      .single();

    if (error) {
      console.error("Error clocking out:", error);
      toast({ title: "Erreur de pointage", description: error.message, variant: "destructive" });
      setCurrentStatusInternal('checked-in'); // Revert status if error
      return;
    }
    
    setActiveRecordId(null);
    setTimeEntries(prev => prev.map(e => e.id === data.id ? data : e));
    setCurrentStatusInternal('checked-out');
    toast({ title: "Pointage de sortie réussi", description: `Sortie enregistrée à ${format(now, 'HH:mm')}` });
    await fetchUserTimeData(); // Refresh data
  };
  
  return {
    timeEntries,
    currentStatus: currentStatusInternal,
    clockIn,
    clockOut,
    getTodayWorkTime: () => todayWorkTime, // Return state directly
    getWeeklyStats: () => weeklyStats, // Return state directly
    isLoading: currentStatusInternal === 'loading',
    fetchUserTimeData // Expose for manual refresh if needed
  };
};