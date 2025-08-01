import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AppSettingsContext = createContext();

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
};

export const AppSettingsProvider = ({ children }) => {
  const [appName, setAppName] = useState('TimeTracker Pro');
  const [appLogo, setAppLogo] = useState('/logo.svg');
  const [kioskPassword] = useState('1234567800');
  const [kioskPasswordFailMessage] = useState('Mot de passe incorrect. Veuillez réessayer.');
  const [loadingSettings, setLoadingSettings] = useState(true);

  const loadInitialSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const localAppName = localStorage.getItem('appName');
      const localAppLogo = localStorage.getItem('appLogo');

      if (localAppName) setAppName(localAppName);
      if (localAppLogo) setAppLogo(localAppLogo);
      
    } catch (e) {
      console.error("Error in loadInitialSettings:", e);
      const localAppName = localStorage.getItem('appName');
      const localAppLogo = localStorage.getItem('appLogo');
      if (localAppName) setAppName(localAppName);
      if (localAppLogo) setAppLogo(localAppLogo);
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    loadInitialSettings();
  }, [loadInitialSettings]);

  useEffect(() => {
    localStorage.setItem('appName', appName);
    document.title = appName;
  }, [appName]);

  useEffect(() => {
    localStorage.setItem('appLogo', appLogo);
    const favicon = document.querySelector("link[rel~='icon']");
    if (favicon) {
      favicon.href = appLogo;
    }
  }, [appLogo]);

  const updateAppSetting = (key, newValue) => {
    try {
      if (key === 'appName') setAppName(newValue);
      else if (key === 'appLogo') setAppLogo(newValue);
      
      localStorage.setItem(key, newValue);
    } catch (error) {
      console.error(`Failed to update setting ${key}:`, error);
    }
  };

  const value = {
    appName,
    setAppName: (name) => updateAppSetting('appName', name),
    appLogo,
    setAppLogo: (logo) => updateAppSetting('appLogo', logo),
    kioskPassword,
    kioskPasswordFailMessage,
    loadInitialSettings,
    loadingSettings
  };

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
};