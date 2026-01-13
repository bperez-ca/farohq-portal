import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export const useTheme = () => {
    const [theme, setTheme] = useState<Theme>('light');
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        // Set hydrated flag
        setIsHydrated(true);
        
        // Initialize theme from localStorage, default to light
        const stored = localStorage.getItem('theme') as Theme;
        if (stored) {
            setTheme(stored);
        } else {
            // Default to light mode
            setTheme('light');
        }
    }, []);

    useEffect(() => {
        if (!isHydrated) return;
        
        const root = document.documentElement;

        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        localStorage.setItem('theme', theme);
    }, [theme, isHydrated]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return { theme, toggleTheme, isHydrated };
};