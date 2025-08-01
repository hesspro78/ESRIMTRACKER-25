import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth.jsx';
import { useTimeTracking } from '@/hooks/useTimeTracking.js';
import { useNotifications } from '@/hooks/useNotifications.js';
import { useAppSettings } from '@/contexts/AppSettingsContext';


import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardStatsCards from '@/components/dashboard/DashboardStatsCards';
import QuickActionsCard from '@/components/dashboard/QuickActionsCard';
import WeeklyHoursChartCard from '@/components/dashboard/WeeklyHoursChartCard';
import RecentActivityCard from '@/components/dashboard/RecentActivityCard';

const Dashboard = ({ onBackToClocking }) => {
  const { session, userProfile, logout } = useAuth();
  const { 
    currentStatus, 
    clockIn, 
    clockOut, 
    getTodayWorkTime, 
    getWeeklyStats,
    isLoading: timeTrackingLoading,
    fetchUserTimeData 
  } = useTimeTracking();
  
  const { notifications, getUnreadCount, markAllAsRead } = useNotifications(session?.user?.id);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { appName, appLogo } = useAppSettings();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
        fetchUserTimeData(); 
    }
  }, [session?.user?.id, fetchUserTimeData]);
  
  const handleLogout = async () => {
    await logout();
  };

  const weeklyData = getWeeklyStats(); 
  const todayWorkTime = getTodayWorkTime();
  const unreadNotificationsCount = getUnreadCount();

  if (timeTrackingLoading && currentStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des données de pointage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 space-y-6 bg-gradient-to-br from-background to-slate-900">
      <DashboardHeader
        appName={appName}
        appLogo={appLogo}
        userName={userProfile?.full_name || session?.user?.email}
        userAvatarUrl={userProfile?.avatar_url}
        currentTime={currentTime}
        unreadNotificationsCount={unreadNotificationsCount}
        notifications={notifications}
        markAllNotificationsAsRead={markAllAsRead}
        onLogout={handleLogout}
        onBackToClocking={onBackToClocking}
      />

      <DashboardStatsCards
        currentStatus={currentStatus}
        currentTime={currentTime}
        todayWorkTime={todayWorkTime}
        weeklyHours={weeklyData.reduce((acc, day) => acc + day.hours, 0)}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <QuickActionsCard
          currentTime={currentTime}
          currentStatus={currentStatus}
          onClockIn={clockIn}
          onClockOut={clockOut}
          isLoading={timeTrackingLoading}
        />
        <WeeklyHoursChartCard weeklyData={weeklyData} />
      </motion.div>

      <RecentActivityCard notifications={notifications.slice(0,5)} />
    </div>
  );
};

export default Dashboard;
