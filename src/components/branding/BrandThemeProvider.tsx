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
  theme_json?: {
    typography?: {
      font_family?: string
      font_size_base?: string
      line_height_base?: string
    }
    colors?: {
      brand?: string
      brand_hover?: string
      accent?: string
      background?: string
      foreground?: string
    }
    spacing?: {
      border_radius?: string
    }
  }
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

  // Extract colors from theme_json or use top-level properties
  const primaryColor = brandTheme.theme_json?.colors?.brand || brandTheme.primary_color
  const secondaryColor = brandTheme.secondary_color || brandTheme.theme_json?.colors?.accent
  const brandHover = brandTheme.theme_json?.colors?.brand_hover

  // Apply primary color as CSS variable
  if (primaryColor) {
    root.style.setProperty('--brand-color', primaryColor)
    // Calculate hover color (darken by 10%) or use from theme_json
    const hoverColor = brandHover || darkenColor(primaryColor, 0.1)
    root.style.setProperty('--brand-color-hover', hoverColor)
  }

  // Apply secondary color as CSS variable
  if (secondaryColor) {
    root.style.setProperty('--brand-secondary', secondaryColor)
  }

  // Update favicon dynamically
  if (brandTheme.favicon_url) {
    updateFavicon(brandTheme.favicon_url)
  }

  // Update page title globally with business name
  if (typeof document !== 'undefined') {
    const businessName = brandTheme.tenant_name || 'Faro'
    document.title = `${businessName} - Portal`
  }

  // Apply brand colors to Tailwind variables
  if (primaryColor) {
    // Convert hex to HSL for Tailwind compatibility
    const hsl = hexToHsl(primaryColor)
    if (hsl) {
      root.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`)
    }
  }

  if (secondaryColor) {
    const hsl = hexToHsl(secondaryColor)
    if (hsl) {
      root.style.setProperty('--secondary', `${hsl.h} ${hsl.s}% ${hsl.l}%`)
    }
  }

  // Apply typography from theme_json
  if (brandTheme.theme_json?.typography) {
    const typography = brandTheme.theme_json.typography
    
    // Apply font family
    if (typography.font_family) {
      root.style.setProperty('--brand-font', typography.font_family)
      root.style.setProperty('--font-family', typography.font_family)
      // Apply to body as well
      document.body.style.fontFamily = typography.font_family
    }
    
    // Apply font size base
    if (typography.font_size_base) {
      root.style.setProperty('--font-size-base', typography.font_size_base)
    }
    
    // Apply line height base
    if (typography.line_height_base) {
      root.style.setProperty('--line-height-base', typography.line_height_base)
    }
  }

  // Apply border radius from theme_json
  if (brandTheme.theme_json?.spacing?.border_radius) {
    root.style.setProperty('--radius', brandTheme.theme_json.spacing.border_radius)
  }
}

const applyDefaultTheme = () => {
  const root = document.documentElement
  root.style.setProperty('--brand-color', '#2563eb')
  root.style.setProperty('--brand-color-hover', '#1d4ed8')
  root.style.setProperty('--brand-secondary', '#6b7280')
  // Reset typography to defaults
  root.style.setProperty('--brand-font', "'Inter', system-ui, sans-serif")
  root.style.setProperty('--font-family', "'Inter', system-ui, sans-serif")
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
      // Check for cache clear signal
      const cacheCleared = typeof window !== 'undefined' 
        ? sessionStorage.getItem('farohq_clear_brand_cache') === 'true'
        : false
      
      if (cacheCleared && typeof window !== 'undefined') {
        sessionStorage.removeItem('farohq_clear_brand_cache')
        setLastFetch(0) // Force refresh
      }
      
      // Check cache TTL
      const now = Date.now()
      // Get current tenantId to check if we need to force re-fetch
      const currentTenantId = typeof window !== 'undefined' ? localStorage.getItem('farohq_active_org_id') : null
      
      // Force re-fetch if on /dashboard or /agency/dashboard and tenantId is available (user just redirected after invite acceptance)
      // Always re-fetch on dashboard pages with tenantId to ensure correct branding for that tenant
      const shouldForceRefetch = !!(pathname === '/dashboard' || pathname === '/agency/dashboard') && !!currentTenantId
      
      if (!cacheCleared && !shouldForceRefetch && lastFetch > 0 && (now - lastFetch) < CACHE_TTL && theme) {
        // Use cached theme (only if not forcing re-fetch)
        applyBrandTheme(theme)
        return
      }

      try {
        setLoading(true)
        
        // Try to get tenantId from localStorage (set by authenticated users)
        const tenantId = typeof window !== 'undefined' ? localStorage.getItem('farohq_active_org_id') : null
        
        let response
        if (tenantId) {
          // For authenticated users, try /api/v1/brands first (direct endpoint that works)
          try {
            response = await axios.get('/api/v1/brands', {
              withCredentials: true,
              headers: {
                'X-Tenant-ID': tenantId,
              },
            })
            
            // Handle array response (take first brand)
            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
              const brandData = response.data[0]
              // Map the brand data to BrandTheme format
              const themeData: BrandTheme = {
                primary_color: brandData.primary_color,
                secondary_color: brandData.secondary_color,
                logo_url: brandData.logo_url,
                favicon_url: brandData.favicon_url,
                hide_powered_by: brandData.hide_powered_by,
                can_hide_powered_by: brandData.can_hide_powered_by,
                can_configure_domain: brandData.can_configure_domain,
                tier: brandData.tier,
                tenant_name: brandData.tenant?.name || brandData.tenant_name,
                theme_json: brandData.theme_json,
              }
              
              setTheme(themeData)
              setLastFetch(now)
              applyBrandTheme(themeData)
              return
            } else if (response.data && !Array.isArray(response.data)) {
              // Single brand object
              const brandData = response.data
              const themeData: BrandTheme = {
                primary_color: brandData.primary_color,
                secondary_color: brandData.secondary_color,
                logo_url: brandData.logo_url,
                favicon_url: brandData.favicon_url,
                hide_powered_by: brandData.hide_powered_by,
                can_hide_powered_by: brandData.can_hide_powered_by,
                can_configure_domain: brandData.can_configure_domain,
                tier: brandData.tier,
                tenant_name: brandData.tenant?.name || brandData.tenant_name,
                theme_json: brandData.theme_json,
              }
              
              setTheme(themeData)
              setLastFetch(now)
              applyBrandTheme(themeData)
              return
            }
          } catch (brandsError) {
            // If /api/v1/brands fails, fall back to by-host endpoint
            console.warn('Failed to fetch from /api/v1/brands, trying by-host fallback:', brandsError)
            try {
              response = await axios.get(`/api/v1/brand/by-host?org-id=${encodeURIComponent(tenantId)}`, {
                withCredentials: true,
                headers: {
                  'X-Tenant-ID': tenantId,
                },
              })
            } catch (byHostError) {
              throw byHostError // Re-throw if both fail
            }
          }
        } else {
          // For public/unauthenticated access, use host-based fetching
          const host = window.location.host
          response = await axios.get(`/api/v1/brand/by-host?host=${host}`, {
            withCredentials: true,
          })
        }

        if (response && response.data) {
          // If response.data is not already in BrandTheme format, map it
          let themeData: BrandTheme
          if (response.data.primary_color !== undefined) {
            // Already in BrandTheme format (from by-host endpoint)
            themeData = response.data
          } else {
            // Need to map from brands endpoint format
            const brandData = Array.isArray(response.data) ? response.data[0] : response.data
            themeData = {
              primary_color: brandData.primary_color,
              secondary_color: brandData.secondary_color,
              logo_url: brandData.logo_url,
              favicon_url: brandData.favicon_url,
              hide_powered_by: brandData.hide_powered_by,
              can_hide_powered_by: brandData.can_hide_powered_by,
              can_configure_domain: brandData.can_configure_domain,
              tier: brandData.tier,
              tenant_name: brandData.tenant?.name || brandData.tenant_name,
              theme_json: brandData.theme_json,
            }
          }
          
          setTheme(themeData)
          setLastFetch(now)
          applyBrandTheme(themeData)
        } else {
          // No data in response, use default theme
          applyDefaultTheme()
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
    
    // Listen for brand theme update events (e.g., after saving branding settings)
    const handleBrandThemeUpdate = () => {
      setLastFetch(0) // Clear cache
      fetchBrandTheme() // Refetch immediately
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('brandThemeUpdated', handleBrandThemeUpdate)
      
      return () => {
        window.removeEventListener('brandThemeUpdated', handleBrandThemeUpdate)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]) // Re-fetch when pathname changes (different subdomain/domain)

  return (
    <BrandThemeContext.Provider value={{ theme, loading }}>
      {children}
    </BrandThemeContext.Provider>
  )
}
