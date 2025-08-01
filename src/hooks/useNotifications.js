import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('notifications') || '[]');
    setNotifications(stored);
  }, []);

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };

    const updated = [newNotification, ...notifications];
    setNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));

    toast({
      title: notification.title,
      description: notification.message
    });
  };

  const markAsRead = (id) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.read).length;
  };

  return {
    notifications,
    addNotification,
    markAsRead,
    getUnreadCount
  };
};