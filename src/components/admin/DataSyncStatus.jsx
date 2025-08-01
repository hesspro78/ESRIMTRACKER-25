import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { CheckCircle, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DataSyncStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('pending');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!isOnline) {
      setSyncStatus('offline');
      return;
    }

    const checkSync = async () => {
      setSyncStatus('pending');
      if (!supabase) {
        setSyncStatus('error');
        return;
      }
      try {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        if (error) throw error;
        setSyncStatus('success');
      } catch (error) {
        console.error("Sync check failed:", error);
        setSyncStatus('error');
      }
    };

    checkSync();
    const interval = setInterval(checkSync, 60000);

    return () => clearInterval(interval);
  }, [isOnline]);

  const getStatusInfo = () => {
    switch (syncStatus) {
      case 'success':
        return { Icon: CheckCircle, color: 'text-green-400', text: 'Synchronisé' };
      case 'error':
        return { Icon: AlertTriangle, color: 'text-yellow-400', text: 'Erreur Synchro' };
      case 'offline':
        return { Icon: WifiOff, color: 'text-red-400', text: 'Hors ligne' };
      default:
        return { Icon: Wifi, color: 'text-muted-foreground animate-pulse', text: 'Vérification...' };
    }
  };

  const { Icon, color, text } = getStatusInfo();

  return (
    <div className="flex items-center space-x-2 p-2 bg-background/50 rounded-lg text-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={syncStatus}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          <Icon className={`h-5 w-5 ${color}`} />
        </motion.div>
      </AnimatePresence>
      <span className={`font-medium ${color}`}>{text}</span>
    </div>
  );
};

export default DataSyncStatus;