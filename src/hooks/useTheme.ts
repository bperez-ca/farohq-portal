'use client';

import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark';

export interface UseThemeOptions {
  /**
   * Enable smooth transitions when switching themes
   * @default true
   */
  enableTransitions?: boolean;
  /**
   * Listen to system preference changes
   * @default false
   */
  listenToSystemPreference?: boolean;
}

export const useTheme = (options: UseThemeOptions = {}) => {
  const { enableTransitions = true, listenToSystemPreference = false } = options;
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    // Check if we're on the client side
    if (typeof window === 'undefined') {
      return 'light';
    }

    // Check localStorage first
    const stored = localStorage.getItem('theme') as Theme;
    if (stored && (stored === 'light' || stored === 'dark')) {
      return stored;
    }
    
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });

  // Apply theme to DOM
  const applyTheme = useCallback((newTheme: Theme) => {
    if (typeof window === 'undefined') {
      return;
    }

    const root = document.documentElement;
    
    // Enable smooth transitions
    if (enableTransitions) {
      root.style.transition = 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease';
    }
    
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    localStorage.setItem('theme', newTheme);
    
    // Remove transition after a delay to avoid affecting other animations
    if (enableTransitions) {
      setTimeout(() => {
        root.style.transition = '';
      }, 300);
    }
  }, [enableTransitions]);

  // Initialize on mount
  useEffect(() => {
    setMounted(true);
    applyTheme(theme);
  }, []); // Only run once on mount

  // Apply theme when it changes
  useEffect(() => {
    if (!mounted) return;
    applyTheme(theme);
  }, [theme, mounted, applyTheme]);

  // Listen to system preference changes (optional)
  useEffect(() => {
    if (!listenToSystemPreference || typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't manually set a preference
      const stored = localStorage.getItem('theme');
      if (!stored) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [listenToSystemPreference]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const setThemeMode = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
  }, []);

  return { 
    theme, 
    toggleTheme, 
    setTheme: setThemeMode,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    mounted
  };
};



