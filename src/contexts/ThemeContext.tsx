"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { applyBrandTheme } from "@/lib/theme";
import type { BrandTheme } from "@/lib/theme";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  brandTheme: BrandTheme | null;
  isBrandThemeLoading: boolean;
  brandThemeError: Error | null;
  refetchBrandTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  brandApiUrl?: string;
  brandDomain?: string;
  brandHost?: string;
  enableBrandTheme?: boolean;
}

export function ThemeProvider({ 
  children,
  brandApiUrl,
  brandDomain,
  brandHost,
  enableBrandTheme = true,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // Fetch brand theme
  const {
    theme: brandTheme,
    isLoading: isBrandThemeLoading,
    error: brandThemeError,
    refetch: refetchBrandTheme,
  } = useBrandTheme({
    apiUrl: brandApiUrl,
    domain: brandDomain,
    host: brandHost,
    enabled: enableBrandTheme,
  });

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored) {
      setTheme(stored);
      // Apply theme with smooth transition
      const root = document.documentElement;
      root.style.transition = "background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease";
      root.classList.toggle("dark", stored === "dark");
      setTimeout(() => {
        root.style.transition = "";
      }, 300);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
      const root = document.documentElement;
      root.style.transition = "background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease";
      root.classList.add("dark");
      setTimeout(() => {
        root.style.transition = "";
      }, 300);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    
    // Apply theme with smooth transition
    const root = document.documentElement;
    root.style.transition = "background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease";
    root.classList.toggle("dark", newTheme === "dark");
    
    // Re-apply brand theme with new dark mode state
    if (brandTheme) {
      applyBrandTheme(brandTheme, newTheme === "dark");
    }
    
    // Remove transition after animation completes
    setTimeout(() => {
      root.style.transition = "";
    }, 300);
  };

  // Re-apply brand theme when theme or brandTheme changes
  useEffect(() => {
    if (brandTheme && mounted) {
      applyBrandTheme(brandTheme, theme === "dark");
    }
  }, [theme, brandTheme, mounted]);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        brandTheme,
        isBrandThemeLoading,
        brandThemeError,
        refetchBrandTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    return {
      theme: "light" as Theme,
      toggleTheme: () => {},
      brandTheme: null,
      isBrandThemeLoading: false,
      brandThemeError: null,
      refetchBrandTheme: async () => {},
    };
  }
  return context;
}

