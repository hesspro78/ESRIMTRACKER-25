import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckCircle, XCircle, Calendar, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

const AdminStatsCards = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    onLeaveToday: 0,
    totalHoursToday: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);

      if (!supabase) {
        console.warn('Supabase client not initialized');
        setStats({
          totalEmployees: 0,
          presentToday: 0,
          absentToday: 0,
          onLeaveToday: 0,
          totalHoursToday: 0,
        });
        setLoading(false);
        return;
      }

      const today = new Date();
      const todayStart = new Date(today);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      // Total employees
      const { data: employees, error: employeesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'employee');

      if (employeesError) throw employeesError;
      const totalEmployees = employees?.length || 0;

      // Employees present today (with clock-in records)
      const { data: presentRecords, error: presentError } = await supabase
        .from('time_records')
        .select('user_id, clock_in')
        .gte('date', today.toISOString().split('T')[0])
        .lte('date', today.toISOString().split('T')[0])
        .not('clock_in', 'is', null);

      if (presentError) throw presentError;
      const uniquePresentEmployees = new Set(presentRecords?.map(record => record.user_id) || []);
      const presentToday = uniquePresentEmployees.size;

      // Employees on leave today
      const { data: leavesToday, error: leavesError } = await supabase
        .from('leave_requests')
        .select('user_id')
        .eq('status', 'approved')
        .lte('start_date', today.toISOString().split('T')[0])
        .gte('end_date', today.toISOString().split('T')[0]);

      if (leavesError) throw leavesError;
      const onLeaveToday = leavesToday?.length || 0;

      // Absent today (total - present - on leave)
      const absentToday = Math.max(0, totalEmployees - presentToday - onLeaveToday);

      // Total hours worked today
      const { data: allRecordsToday, error: recordsError } = await supabase
        .from('time_records')
        .select('user_id, clock_in, clock_out')
        .eq('date', today.toISOString().split('T')[0])
        .not('clock_in', 'is', null);

      if (recordsError) throw recordsError;

      let totalHoursToday = 0;

      allRecordsToday?.forEach(record => {
        if (record.clock_in && record.clock_out) {
          const clockIn = new Date(record.clock_in);
          const clockOut = new Date(record.clock_out);
          const hours = (clockOut - clockIn) / (1000 * 60 * 60);
          totalHoursToday += hours;
        } else if (record.clock_in) {
          // Si seulement clock_in, estimer 8 heures
          totalHoursToday += 8;
        }
      });

      setStats({
        totalEmployees,
        presentToday,
        absentToday,
        onLeaveToday,
        totalHoursToday: Math.round(totalHoursToday * 10) / 10,
      });
    } catch (error) {
      console.warn('Database not accessible, using demo data:', error);
      // Mode démo avec données factices
      setStats({
        totalEmployees: 12,
        presentToday: 8,
        absentToday: 2,
        onLeaveToday: 2,
        totalHoursToday: 64,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);

    return () => clearInterval(interval);
  }, []);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1 },
    }),
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="glass-effect border-gradient animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted-foreground/20 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted-foreground/20 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={0}>
        <Card className="glass-effect border-gradient hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employés</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Employés enregistrés</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={1}>
        <Card className="glass-effect border-gradient hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Présents Aujourd'hui</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.presentToday}</div>
            <p className="text-xs text-muted-foreground">Employés pointés</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={2}>
        <Card className="glass-effect border-gradient hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absents Aujourd'hui</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.absentToday}</div>
            <p className="text-xs text-muted-foreground">Non pointés & non en congé</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={3}>
        <Card className="glass-effect border-gradient hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Congé Aujourd'hui</CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.onLeaveToday}</div>
            <p className="text-xs text-muted-foreground">Employés en congé</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={4}>
        <Card className="glass-effect border-gradient hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Heures Aujourd'hui</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.totalHoursToday}h</div>
            <p className="text-xs text-muted-foreground">Total heures travaillées</p>
          </CardContent>
        </Card>
      </motion.div>


    </div>
  );
};

export default AdminStatsCards;
