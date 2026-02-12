import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // Default to dark mode if no preference saved
    return true;
  });

  useEffect(() => {
    // Save theme preference to localStorage
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    
    // Apply theme to document root
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const theme = {
    isDarkMode,
    toggleTheme,
    colors: isDarkMode ? {
      // Dark theme colors
      bgApp: '#0a0c10',
      bgSidebar: '#0d1117',
      bgSurface: '#151a21',
      bgSurfaceHover: '#1a2028',
      bgSurfaceElevated: '#1c222b',
      bgMuted: '#1a1f26',
      textPrimary: '#e5e7eb',
      textSecondary: '#9ca3af',
      textTertiary: '#6b7280',
      textMuted: '#4b5563',
      borderSubtle: 'rgba(255, 255, 255, 0.06)',
      borderDefault: 'rgba(255, 255, 255, 0.08)',
      borderHover: 'rgba(255, 255, 255, 0.12)',
      accent: '#6366f1',
      accentMuted: '#5558e3',
      accentSubtle: 'rgba(99, 102, 241, 0.15)',
      accentText: '#a5b4fc',
      successBg: 'rgba(34, 197, 94, 0.12)',
      successText: '#4ade80',
      warningBg: 'rgba(234, 179, 8, 0.12)',
      warningText: '#fbbf24',
      dangerBg: 'rgba(239, 68, 68, 0.12)',
      dangerText: '#f87171'
    } : {
      // Light theme colors
      bgApp: '#ffffff',
      bgSidebar: '#f8fafc',
      bgSurface: '#ffffff',
      bgSurfaceHover: '#f1f5f9',
      bgSurfaceElevated: '#ffffff',
      bgMuted: '#f8fafc',
      textPrimary: '#1e293b',
      textSecondary: '#475569',
      textTertiary: '#64748b',
      textMuted: '#94a3b8',
      borderSubtle: 'rgba(0, 0, 0, 0.06)',
      borderDefault: 'rgba(0, 0, 0, 0.08)',
      borderHover: 'rgba(0, 0, 0, 0.12)',
      accent: '#6366f1',
      accentMuted: '#5558e3',
      accentSubtle: 'rgba(99, 102, 241, 0.1)',
      accentText: '#4338ca',
      successBg: 'rgba(34, 197, 94, 0.1)',
      successText: '#16a34a',
      warningBg: 'rgba(234, 179, 8, 0.1)',
      warningText: '#ca8a04',
      dangerBg: 'rgba(239, 68, 68, 0.1)',
      dangerText: '#dc2626'
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};