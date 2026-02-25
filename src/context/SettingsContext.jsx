import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  // Default settings with localStorage fallback
  const [settings, setSettings] = useState(() => {
    try {
      const savedSettings = localStorage.getItem('userSettings');
      if (savedSettings) {
        return JSON.parse(savedSettings);
      }
    } catch (error) {
      console.error('Error loading settings from localStorage:', error);
    }
    
    // Default settings if no saved settings found
    return {
      emailNotifications: true,
      pushNotifications: false,
      movieRecommendations: true,
      newReleaseAlerts: true,
      language: "vi",
      autoPlay: false, // Default to false for better UX
      downloadQuality: "hd",
      dataUsage: "normal",
    };
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('userSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings to localStorage:', error);
    }
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetSettings = () => {
    const defaultSettings = {
      emailNotifications: true,
      pushNotifications: false,
      movieRecommendations: true,
      newReleaseAlerts: true,
      language: "vi",
      autoPlay: false,
      downloadQuality: "hd",
      dataUsage: "normal",
    };
    setSettings(defaultSettings);
  };

  const value = {
    settings,
    updateSetting,
    resetSettings,
    // Convenient getters for commonly used settings
    autoPlay: settings.autoPlay,
    language: settings.language,
    downloadQuality: settings.downloadQuality,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};