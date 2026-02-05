"use client";

import { useEffect, useState, useCallback } from 'react';
import type { BrandTheme } from '@/lib/theme';
import { applyBrandTheme, clearBrandTheme } from '@/lib/theme';

interface UseBrandThemeOptions {
  apiUrl?: string;
  domain?: string;
  host?: string;
  cacheKey?: string;
  cacheTTL?: number; // in milliseconds, default 15 minutes
  enabled?: boolean;
}

interface UseBrandThemeReturn {
  theme: BrandTheme | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const DEFAULT_CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const CACHE_VERSION = 'v2'; // Increment this to invalidate all caches

/**
 * Hook to fetch and apply brand theme from API
 * 
 * @example
 * ```tsx
 * const { theme, isLoading } = useBrandTheme({
 *   apiUrl: '/api/v1/brand',
 *   host: window.location.host,
 * });
 * ```
 */
export function useBrandTheme(options: UseBrandThemeOptions = {}): UseBrandThemeReturn {
  const {
    apiUrl = '/api/v1/brand',
    domain,
    host,
    cacheKey = 'brand-theme',
    cacheTTL = DEFAULT_CACHE_TTL,
    enabled = true,
  } = options;

  const [theme, setTheme] = useState<BrandTheme | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTheme = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    // Check cache first
    try {
      const cacheVersionKey = `${cacheKey}_version`;
      const cachedVersion = localStorage.getItem(cacheVersionKey);
      
      // If cache version doesn't match, clear cache and skip to fetch
      if (cachedVersion !== CACHE_VERSION) {
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(cacheVersionKey);
      } else {
        // Version matches, check if cached data exists and is valid
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          if (age < cacheTTL) {
            setTheme(data);
            setIsLoading(false);
            applyBrandTheme(data, document.documentElement.classList.contains('dark'));
            return;
          }
        }
      }
    } catch (e) {
      // Cache invalid, continue to fetch
    }

    setIsLoading(true);
    setError(null);

    try {
      // Determine which endpoint to use
      let url = '';
      
      // Ensure apiUrl is absolute - if relative, prepend current origin
      let baseUrl = apiUrl;
      if (typeof window !== 'undefined') {
        if (!apiUrl.startsWith('http')) {
          // Relative URL - prepend current origin
          baseUrl = window.location.origin + (apiUrl.startsWith('/') ? apiUrl : '/' + apiUrl);
        }
      }
      
      if (host) {
        url = `${baseUrl}/by-host?host=${encodeURIComponent(host)}`;
      } else if (domain) {
        url = `${baseUrl}/by-domain?domain=${encodeURIComponent(domain)}`;
      } else if (typeof window !== 'undefined') {
        // Fallback to using current host (without port for localhost)
        const currentHost = window.location.host;
        // Normalize localhost - remove port
        const normalizedHost = currentHost.includes('localhost:') || currentHost.includes('127.0.0.1:')
          ? currentHost.split(':')[0]
          : currentHost;
        url = `${baseUrl}/by-host?host=${encodeURIComponent(normalizedHost)}`;
      } else {
        throw new Error('Either domain or host must be provided');
      }
      
      // Debug: log the constructed URL
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log('[useBrandTheme] Fetching from URL:', url);
      }

      const response = await fetch(url, {
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000),
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          // No brand theme found, use defaults
          setTheme(null);
          clearBrandTheme();
          setIsLoading(false);
          return;
        }
        throw new Error(`Failed to fetch brand theme: ${response.statusText}`);
      }

      const apiData = await response.json();
      
      // Transform API response (snake_case) to BrandTheme (camelCase)
      // Handle both snake_case (from API) and camelCase (already transformed)
      const data: BrandTheme = {
        agencyId: apiData.agency_id || apiData.agencyId,
        logoUrl: apiData.logo_url || apiData.logoUrl || undefined,
        faviconUrl: apiData.favicon_url || apiData.faviconUrl || undefined,
        primaryColor: apiData.primary_color || apiData.primaryColor,
        secondaryColor: apiData.secondary_color || apiData.secondaryColor,
        themeJson: apiData.theme_json || apiData.themeJson,
      };
      
      // Debug logging in development
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log('[useBrandTheme] API Response:', {
          raw: apiData,
          transformed: data,
          hasLogoUrl: !!data.logoUrl,
          hasFaviconUrl: !!data.faviconUrl,
        });
      }
      
      // Cache the theme
      try {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            data,
            timestamp: Date.now(),
          })
        );
        // Store cache version to invalidate old caches
        localStorage.setItem(`${cacheKey}_version`, CACHE_VERSION);
      } catch (e) {
        // localStorage might be full or unavailable, continue anyway
      }

      setTheme(data);
      applyBrandTheme(data, document.documentElement.classList.contains('dark'));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch brand theme');
      
      // Check if it's a connection error (backend not available)
      const isConnectionError = 
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError') ||
        error.name === 'AbortError' ||
        error.message.includes('timeout');
      
      if (isConnectionError) {
        // Backend not available - use defaults silently
        console.warn('Brand service not available, using default theme:', error.message);
        setTheme(null);
        clearBrandTheme();
        setError(null); // Don't show connection errors as failures
      } else {
        // Other errors - log and set error state
        setError(error);
        console.error('Error fetching brand theme:', error);
        setTheme(null);
        clearBrandTheme();
      }
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, domain, host, cacheKey, cacheTTL, enabled]);

  useEffect(() => {
    fetchTheme();
  }, [fetchTheme]);

  // Re-apply theme when dark mode changes
  useEffect(() => {
    if (theme) {
      const isDark = document.documentElement.classList.contains('dark');
      applyBrandTheme(theme, isDark);
    }
  }, [theme]);

  return {
    theme,
    isLoading,
    error,
    refetch: fetchTheme,
  };
}

