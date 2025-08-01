import React from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, Settings as SettingsIconLucide, User, LogOut, Palette, ArrowLeft, TrendingUp } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { useAuth } from '@/hooks/useAuth.jsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabaseClient';

import AdminStatsCards from '@/components/admin/AdminStatsCards';
import AdminEmployeesTab from '@/components/admin/AdminEmployeesTab';
import AdminAttendanceTab from '@/components/admin/AdminAttendanceTab';
import AdminLeavesTab from '@/components/admin/AdminLeavesTab';
import AdminEmployeeStatsTab from '@/components/admin/AdminEmployeeStatsTab';
import AdminAnalyticsTab from '@/components/admin/AdminAnalyticsTab';
import AdminSettingsTab from '@/components/admin/AdminSettingsTab';
import AdminUICustomizationTab from '@/components/admin/AdminUICustomizationTab';
import DataSyncStatus from '@/components/admin/DataSyncStatus';

const AdminPanel = ({ onBackToClocking }) => {
  const { appName, appLogo } = useAppSettings();
  const { userProfile, logout } = useAuth();

  const exportData = async () => {
    try {
      const { data: employees, error: employeesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'employee');
      if (employeesError) throw employeesError;

      const { data: timeEntries, error: timeEntriesError } = await supabase
        .from('time_records')
        .select('*');
      if (timeEntriesError) throw timeEntriesError;
      
      const { data: leaves, error: leavesError } = await supabase
        .from('leave_requests')
        .select('*');
      if (leavesError) throw leavesError;

      const data = {
        appName,
        appLogo,
        employees,
        timeEntries,
        leaves,
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${appName.toLowerCase().replace(/\s+/g, '-')}-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export réussi",
        description: "Les données ont été exportées avec succès"
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Erreur d'exportation",
        description: "Impossible d'exporter les données. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 space-y-6 bg-gradient-to-br from-background to-slate-900">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0"
      >
        <div className="flex items-center space-x-3">
          <img-replace src={appLogo} alt={`${appName} Logo`} className="h-10 w-10 rounded-md shadow-md"/>
          <div>
            <h1 className="text-3xl font-bold text-gradient">{appName} - Admin</h1>
            <p className="text-muted-foreground">Gestion complète des employés et du temps</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <DataSyncStatus />
          <Button onClick={exportData} className="gradient-purple hover:opacity-90 transition-opacity">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-white/10">
                <Avatar className="h-10 w-10 border-2 border-primary">
                  <AvatarImage src={userProfile?.avatar_url || "/placeholder-avatar.jpg"} alt={userProfile?.full_name} />
                  <AvatarFallback className="gradient-purple text-white">
                    {(userProfile?.full_name || userProfile?.username || 'A').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 glass-effect border-gradient" align="end" forceMount>
              <DropdownMenuItem className="focus:bg-white/5">
                <User className="mr-2 h-4 w-4 text-primary" />
                <span>Profil Admin</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10"/>
              {onBackToClocking && (
                <>
                  <DropdownMenuItem onClick={onBackToClocking} className="text-blue-400 focus:bg-blue-400/20 focus:text-blue-300">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    <span>Retour au Pointage</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10"/>
                </>
              )}
              <DropdownMenuItem onClick={handleLogout} className="text-red-400 focus:bg-red-400/20 focus:text-red-300">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Déconnexion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      <AdminStatsCards />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Tabs defaultValue="employees" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2">
            <TabsTrigger value="employees" className="text-xs sm:text-sm">Employés</TabsTrigger>
            <TabsTrigger value="attendance" className="text-xs sm:text-sm">Pointages</TabsTrigger>
            <TabsTrigger value="leaves" className="text-xs sm:text-sm">Congés</TabsTrigger>
            <TabsTrigger value="employee-stats" className="text-xs sm:text-sm flex items-center">
              <TrendingUp className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Stats Employés
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analyses</TabsTrigger>
            <TabsTrigger value="uiCustomization" className="text-xs sm:text-sm flex items-center">
              <Palette className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Personnalisation UI
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm flex items-center">
              <SettingsIconLucide className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          <AdminEmployeesTab />
          <AdminAttendanceTab />
          <AdminLeavesTab />
          <AdminEmployeeStatsTab />
          <AdminAnalyticsTab />
          <AdminUICustomizationTab />
          <AdminSettingsTab />
        </Tabs>
      </motion.div>
    </div>
  );
};

export default AdminPanel;
