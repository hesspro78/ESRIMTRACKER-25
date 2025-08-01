import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell } from 'lucide-react';

const RecentActivityCard = ({ notifications }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <Card className="glass-effect border-gradient">
        <CardHeader>
          <CardTitle className="text-xl text-foreground">Activité Récente</CardTitle>
          <CardDescription>
            Vos derniers pointages et notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-hide">
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-4 p-3 glass-effect rounded-lg hover-lift"
              >
                <div className={`p-2 rounded-full ${notification.read ? 'bg-gray-500/30' : 'gradient-purple'} `}>
                  <Bell className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${!notification.read ? 'text-primary-foreground' : 'text-muted-foreground'}`}>{notification.title}</p>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(notification.timestamp).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
                </div>
              </motion.div>
            ))}
            {notifications.length === 0 && (
              <p className="text-center text-muted-foreground py-4">Aucune activité récente.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RecentActivityCard;