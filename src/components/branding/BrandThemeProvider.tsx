'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import axios from 'axios'

interface BrandThemeProviderProps {
  children: React.ReactNode
}

export interface BrandTheme {
  primary_color?: string
  secondary_color?: string
  logo_url?: string
  favicon_url?: string
  hide_powered_by?: boolean
  can_hide_powered_by?: boolean
  can_configure_domain?: boolean
  tier?: string
  tenant_name?: string
}

interface BrandThemeContextType {
  theme: BrandTheme | null
  loading: boolean
}

const BrandThemeContext = createContext<BrandThemeContextType>({
  theme: null,
  loading: true,
})

export const useBrandTheme = () => useContext(BrandThemeContext)

/**
 * BrandThemeProvider enhances ThemeProvider by:
 * 1. Fetching brand theme from /api/v1/brand/by-host on app load
 * 2. Applying CSS variables for brand colors dynamically
 * 3. Updating favicon dynamically
 * 4. Caching theme with TTL (15 minutes)
 */
// Helper functions outside component
const darkenColor = (hex: string, amount: number): string => {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) - Math.round(255 * amount)))
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) - Math.round(255 * amount)))
  const b = Math.max(0, Math.min(255, (num & 0xff) - Math.round(255 * amount)))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

const hexToHsl = (hex: string): { h: number; s: number; l: number } | null => {
  try {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    const l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6
          break
        case g:
          h = ((b - r) / d + 2) / 6
          break
        case b:
          h = ((r - g) / d + 4) / 6
          break
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    }
  } catch {
    return null
  }
}

const updateFavicon = (faviconUrl: string) => {
  let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  link.href = faviconUrl
}

const applyBrandTheme = (brandTheme: BrandTheme) => {
  const root = document.documentElement

  // Apply primary color as CSS variable
  if (brandTheme.primary_color) {
    root.style.setProperty('--brand-color', brandTheme.primary_color)
    // Calculate hover color (darken by 10%)
    const hoverColor = darkenColor(brandTheme.primary_color, 0.1)
    root.style.setProperty('--brand-color-hover', hoverColor)
  }

  // Apply secondary color as CSS variable
  if (brandTheme.secondary_color) {
    root.style.setProperty('--brand-secondary', brandTheme.secondary_color)
  }

  // Update favicon dynamically
  if (brandTheme.favicon_url) {
    updateFavicon(brandTheme.favicon_url)
  }

  // Apply brand colors to Tailwind variables
  if (brandTheme.primary_color) {
    // Convert hex to HSL for Tailwind compatibility
    const hsl = hexToHsl(brandTheme.primary_color)
    if (hsl) {
      root.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`)
    }
  }

  if (brandTheme.secondary_color) {
    const hsl = hexToHsl(brandTheme.secondary_color)
    if (hsl) {
      root.style.setProperty('--secondary', `${hsl.h} ${hsl.s}% ${hsl.l}%`)
    }
  }
}

const applyDefaultTheme = () => {
  const root = document.documentElement
  root.style.setProperty('--brand-color', '#2563eb')
  root.style.setProperty('--brand-color-hover', '#1d4ed8')
  root.style.setProperty('--brand-secondary', '#6b7280')
}

export function BrandThemeProvider({ children }: BrandThemeProviderProps) {
  const pathname = usePathname()
  const [theme, setTheme] = useState<BrandTheme | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastFetch, setLastFetch] = useState<number>(0)
  const CACHE_TTL = 15 * 60 * 1000 // 15 minutes

  useEffect(() => {
    // Fetch brand theme based on tenantId (authenticated) or host (public)
    const fetchBrandTheme = async () => {
      // Check cache TTL
      const now = Date.now()
      if (lastFetch > 0 && (now - lastFetch) < CACHE_TTL && theme) {
        // Use cached theme
        applyBrandTheme(theme)
        return
      }

      try {
        setLoading(true)
        
        // Try to get tenantId from localStorage (set by authenticated users)
        const tenantId = typeof window !== 'undefined' ? localStorage.getItem('farohq_active_org_id') : null
        
        let response
        if (tenantId) {
          // For authenticated users, use tenantId-based fetching
          response = await axios.get(`/api/v1/brand/by-host?org-id=${encodeURIComponent(tenantId)}`, {
            withCredentials: true,
          })
        } else {
          // For public/unauthenticated access, use host-based fetching
          const host = window.location.host
          response = await axios.get(`/api/v1/brand/by-host?host=${host}`, {
            withCredentials: true,
          })
        }

        if (response.data) {
          setTheme(response.data)
          setLastFetch(now)
          applyBrandTheme(response.data)
        }
      } catch (error) {
        console.error('Failed to fetch brand theme:', error)
        // Use default theme if fetch fails
        applyDefaultTheme()
      } finally {
        setLoading(false)
      }
    }

    fetchBrandTheme()
  }, [pathname]) // Re-fetch when pathname changes (different subdomain/domain)

  return (
    <BrandThemeContext.Provider value={{ theme, loading }}>
      {children}
    </BrandThemeContext.Provider>
  )
}
