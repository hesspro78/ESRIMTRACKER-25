import { useState, useCallback } from 'react';

export const useNotificationToast = () => {
  const [notification, setNotification] = useState({
    isVisible: false,
    message: '',
    userName: '',
    type: 'success',
    duration: 3000
  });

  const showNotification = useCallback(({
    message,
    userName,
    type = 'success',
    duration = 3000
  }) => {
    setNotification({
      isVisible: true,
      message,
      userName,
      type,
      duration
    });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(prev => ({
      ...prev,
      isVisible: false
    }));
  }, []);

  return {
    notification,
    showNotification,
    hideNotification
  };
};