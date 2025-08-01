import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar, TrendingUp, Bell } from 'lucide-react';

const DashboardStatsCards = ({
  currentStatus,
  currentTime,
  todayWorkTime,
  weeklyHours,
  unreadNotificationsCount
}) => {
  const getStatusColor = () => {
    switch (currentStatus) {
      case 'checked-in':
        return 'gradient-green';
      case 'checked-out':
        return 'gradient-orange';
      default:
        return 'gradient-red';
    }
  };

  const getStatusText = () => {
    switch (currentStatus) {
      case 'checked-in':
        return 'Présent';
      case 'checked-out':
        return 'Absent';
      default:
        return 'Non pointé';
    }
  };

  const stats = [
    { title: "Statut Actuel", value: getStatusText(), subtext: currentTime.toLocaleTimeString('fr-FR'), Icon: Clock, color: getStatusColor(), delay: 0.1 },
    { title: "Temps Aujourd'hui", value: todayWorkTime, subtext: "Temps travaillé", Icon: Calendar, color: "gradient-blue", delay: 0.2 },
    { title: "Cette Semaine", value: `${weeklyHours.toFixed(1)}h`, subtext: "Total hebdomadaire", Icon: TrendingUp, color: "gradient-purple", delay: 0.3 },
    { title: "Notifications", value: unreadNotificationsCount, subtext: "Non lues", Icon: Bell, color: "gradient-orange", delay: 0.4 },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: stat.delay }}
        >
          <Card className="glass-effect border-gradient hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">{stat.title}</CardTitle>
              <div className={`p-2 rounded-full ${stat.color}`}>
                <stat.Icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.subtext}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default DashboardStatsCards;