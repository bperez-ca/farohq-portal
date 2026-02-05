'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import axios from 'axios'

// Helper to get text color for background (import from color-utils if available)
const getLuminance = (hex: string): number => {
  try {
    const cleanHex = hex.replace('#', '')
    const r = parseInt(cleanHex.slice(0, 2), 16) / 255
    const g = parseInt(cleanHex.slice(2, 4), 16) / 255
    const b = parseInt(cleanHex.slice(4, 6), 16) / 255
    const [rs, gs, bs] = [r, g, b].map(val => {
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  } catch {
    return 0.5
  }
}

const getTextColorForBackground = (backgroundColor: string): string => {
  const luminance = getLuminance(backgroundColor)
  return luminance < 0.5 ? '#ffffff' : '#1f2937'
}

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
    root.style.setProperty('--brand-color', primaryColor, 'important')
    // Calculate hover color (darken by 10%) or use from theme_json
    const hoverColor = brandHover || darkenColor(primaryColor, 0.1)
    root.style.setProperty('--brand-color-hover', hoverColor, 'important')
    
    // Automatically set text color for primary color based on background darkness
    const primaryTextColor = getTextColorForBackground(primaryColor)
    root.style.setProperty('--brand-color-text', primaryTextColor, 'important')
  }

  // Apply secondary color as CSS variable
  if (secondaryColor) {
    root.style.setProperty('--brand-secondary', secondaryColor)
    root.style.setProperty('--brand-secondary-color', secondaryColor)
    
    // Automatically set text color for secondary color based on background darkness
    const secondaryTextColor = getTextColorForBackground(secondaryColor)
    root.style.setProperty('--brand-secondary-text', secondaryTextColor, 'important')
  }

  // Update favicon dynamically
  if (brandTheme.favicon_url) {
    updateFavicon(brandTheme.favicon_url)
  }

  // Update page title globally with business name
  if (typeof document !== 'undefined') {
    const businessName = brandTheme.tenant_name || ''
    document.title = businessName ? `${businessName} - Portal` : 'Portal'
  }

  // Apply brand colors to Tailwind variables
  if (primaryColor) {
    // Convert hex to HSL for Tailwind compatibility
    const hsl = hexToHsl(primaryColor)
    if (hsl) {
      const isDark = document.documentElement.classList.contains('dark')
      
      // Ensure minimum lightness for contrast in light mode
      const lightLightness = Math.min(hsl.l, 53)
      // Increase lightness for dark mode contrast
      const darkLightness = Math.max(hsl.l + 15, 65)
      
      // Use appropriate lightness based on current theme
      const currentLightness = isDark ? darkLightness : lightLightness
      
      // Set primary color for current theme with !important to override defaults
      root.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${currentLightness}%`, 'important')
      
      // Also set ring color (slightly darker for better visibility)
      root.style.setProperty('--ring', `${hsl.h} ${hsl.s}% ${Math.max(currentLightness - 5, 20)}%`, 'important')
      
      // Set primary foreground based on background darkness (automatic text color)
      // Use the calculated text color from getTextColorForBackground
      const primaryTextColor = getTextColorForBackground(primaryColor)
      if (primaryTextColor === '#ffffff') {
        root.style.setProperty('--primary-foreground', '210 40% 98%', 'important') // White text
      } else {
        root.style.setProperty('--primary-foreground', '222.2 47.4% 11.2%', 'important') // Dark text
      }
    }
  } else {
    // If no primary color, ensure --primary is still set to default (for links)
    const isDark = document.documentElement.classList.contains('dark')
    const defaultPrimary = isDark ? '217.2 91.2% 59.8%' : '221.2 83.2% 53.3%'
    root.style.setProperty('--primary', defaultPrimary, 'important')
  }

  if (secondaryColor) {
    const hsl = hexToHsl(secondaryColor)
    if (hsl) {
      // Update Tailwind secondary with important flag
      // For links, we want a readable color, so adjust lightness if needed
      const isDark = document.documentElement.classList.contains('dark')
      // Ensure secondary color is readable for links (not too light in light mode, not too dark in dark mode)
      const linkLightness = isDark 
        ? Math.max(hsl.l, 60) // At least 60% lightness in dark mode
        : Math.min(hsl.l, 50) // At most 50% lightness in light mode
      
      root.style.setProperty('--secondary', `${hsl.h} ${hsl.s}% ${linkLightness}%`, 'important')
      
      // Calculate appropriate foreground color for contrast
      const foregroundLightness = hsl.l > 50 ? 11.2 : 98
      root.style.setProperty('--secondary-foreground', 
        isDark ? '210 40% 98%' : `222.2 47.4% ${foregroundLightness}%`, 'important'
      )
    }
  } else {
    // If no secondary color, set default secondary for links
    const isDark = document.documentElement.classList.contains('dark')
    const defaultSecondary = isDark ? '210 40% 96.1%' : '210 40% 40%'
    root.style.setProperty('--secondary', defaultSecondary, 'important')
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
  // Support both legacy single value and new component-specific structure
  if (brandTheme.theme_json?.spacing) {
    const spacing = brandTheme.theme_json.spacing as any
    
    // Legacy support: single border_radius value
    if (typeof spacing.border_radius === 'string') {
      root.style.setProperty('--radius', spacing.border_radius)
    }
    
    // New structure: component-specific border radius
    if (spacing.border_radius && typeof spacing.border_radius === 'object') {
      const borderRadius = spacing.border_radius as any
      
      // Button border radius
      if (borderRadius.button) {
        root.style.setProperty('--border-radius-button-default', borderRadius.button.default || '999px')
        root.style.setProperty('--border-radius-button-rounded', borderRadius.button.rounded || '8px')
        root.style.setProperty('--border-radius-button-square', borderRadius.button.square || '0px')
      } else {
        // Set defaults
        root.style.setProperty('--border-radius-button-default', '999px')
        root.style.setProperty('--border-radius-button-rounded', '8px')
        root.style.setProperty('--border-radius-button-square', '0px')
      }
      
      // Card border radius
      if (borderRadius.card) {
        root.style.setProperty('--border-radius-card-default', borderRadius.card.default || '12px')
        root.style.setProperty('--border-radius-card-rounded', borderRadius.card.rounded || '16px')
        root.style.setProperty('--border-radius-card-square', borderRadius.card.square || '0px')
      } else {
        root.style.setProperty('--border-radius-card-default', '12px')
        root.style.setProperty('--border-radius-card-rounded', '16px')
        root.style.setProperty('--border-radius-card-square', '0px')
      }
      
      // Panel border radius
      if (borderRadius.panel) {
        root.style.setProperty('--border-radius-panel-default', borderRadius.panel.default || '8px')
        root.style.setProperty('--border-radius-panel-rounded', borderRadius.panel.rounded || '12px')
        root.style.setProperty('--border-radius-panel-square', borderRadius.panel.square || '0px')
      } else {
        root.style.setProperty('--border-radius-panel-default', '8px')
        root.style.setProperty('--border-radius-panel-rounded', '12px')
        root.style.setProperty('--border-radius-panel-square', '0px')
      }
      
      // Tile border radius
      if (borderRadius.tile) {
        root.style.setProperty('--border-radius-tile-default', borderRadius.tile.default || '4px')
        root.style.setProperty('--border-radius-tile-rounded', borderRadius.tile.rounded || '8px')
        root.style.setProperty('--border-radius-tile-square', borderRadius.tile.square || '0px')
      } else {
        root.style.setProperty('--border-radius-tile-default', '4px')
        root.style.setProperty('--border-radius-tile-rounded', '8px')
        root.style.setProperty('--border-radius-tile-square', '0px')
      }
      
      // Badge border radius
      if (borderRadius.badge) {
        root.style.setProperty('--border-radius-badge-default', borderRadius.badge.default || '999px')
        root.style.setProperty('--border-radius-badge-rounded', borderRadius.badge.rounded || '6px')
        root.style.setProperty('--border-radius-badge-square', borderRadius.badge.square || '0px')
      } else {
        root.style.setProperty('--border-radius-badge-default', '999px')
        root.style.setProperty('--border-radius-badge-rounded', '6px')
        root.style.setProperty('--border-radius-badge-square', '0px')
      }
      
      // Input border radius
      if (borderRadius.input) {
        root.style.setProperty('--border-radius-input-default', borderRadius.input.default || '6px')
        root.style.setProperty('--border-radius-input-rounded', borderRadius.input.rounded || '8px')
        root.style.setProperty('--border-radius-input-square', borderRadius.input.square || '0px')
      } else {
        root.style.setProperty('--border-radius-input-default', '6px')
        root.style.setProperty('--border-radius-input-rounded', '8px')
        root.style.setProperty('--border-radius-input-square', '0px')
      }
      
      // Global fallback (for legacy components)
      if (borderRadius.global) {
        root.style.setProperty('--radius', borderRadius.global)
      } else {
        root.style.setProperty('--radius', '8px')
      }
    } else {
      // No border radius config, set defaults
      root.style.setProperty('--radius', '8px')
      root.style.setProperty('--border-radius-button-default', '999px')
      root.style.setProperty('--border-radius-button-rounded', '8px')
      root.style.setProperty('--border-radius-button-square', '0px')
      root.style.setProperty('--border-radius-card-default', '12px')
      root.style.setProperty('--border-radius-card-rounded', '16px')
      root.style.setProperty('--border-radius-card-square', '0px')
      root.style.setProperty('--border-radius-panel-default', '8px')
      root.style.setProperty('--border-radius-panel-rounded', '12px')
      root.style.setProperty('--border-radius-panel-square', '0px')
      root.style.setProperty('--border-radius-tile-default', '4px')
      root.style.setProperty('--border-radius-tile-rounded', '8px')
      root.style.setProperty('--border-radius-tile-square', '0px')
      root.style.setProperty('--border-radius-badge-default', '999px')
      root.style.setProperty('--border-radius-badge-rounded', '6px')
      root.style.setProperty('--border-radius-badge-square', '0px')
      root.style.setProperty('--border-radius-input-default', '6px')
      root.style.setProperty('--border-radius-input-rounded', '8px')
      root.style.setProperty('--border-radius-input-square', '0px')
    }
  } else {
    // No spacing config, set defaults
    root.style.setProperty('--radius', '8px')
  }
}

const applyLoadingTheme = () => {
  const root = document.documentElement
  // Apply static gray colors for loading state
  root.style.setProperty('--brand-color', '#6b7280')
  root.style.setProperty('--brand-color-hover', '#4b5563')
  root.style.setProperty('--brand-secondary', '#9ca3af')
  // Set text colors for gray backgrounds (gray is medium, so use dark text)
  root.style.setProperty('--brand-color-text', '#ffffff', 'important') // Gray background needs white text
  root.style.setProperty('--brand-secondary-text', '#1f2937', 'important') // Light gray needs dark text
  // Reset typography to defaults
  root.style.setProperty('--brand-font', "'Inter', system-ui, sans-serif")
  root.style.setProperty('--font-family', "'Inter', system-ui, sans-serif")
  // Set default primary color (blue) for loading state
  root.style.setProperty('--primary', '221.2 83.2% 53.3%', 'important')
  root.style.setProperty('--ring', '221.2 83.2% 53.3%', 'important')
}

export function BrandThemeProvider({ children }: BrandThemeProviderProps) {
  const pathname = usePathname()
  const [theme, setTheme] = useState<BrandTheme | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastFetch, setLastFetch] = useState<number>(0)
  const CACHE_TTL = 15 * 60 * 1000 // 15 minutes

  // Apply loading theme on initial mount
  useEffect(() => {
    applyLoadingTheme()
  }, [])

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
      } else if (!theme) {
        // Apply loading theme while fetching
        applyLoadingTheme()
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
              // Check if brandData is valid
              if (brandData && typeof brandData === 'object') {
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
              }
            } else if (response.data && !Array.isArray(response.data) && typeof response.data === 'object') {
              // Single brand object
              const brandData = response.data
              // Check if brandData has required properties
              if (brandData && typeof brandData === 'object') {
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
            }
            
            // If we get here, no valid brand data was found
            applyLoadingTheme()
            return
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
            const brandData = Array.isArray(response.data) 
              ? (response.data.length > 0 ? response.data[0] : null)
              : response.data
              
            // Check if brandData exists and has required properties
            if (!brandData || typeof brandData !== 'object') {
              // No valid brand data, use loading theme
              applyLoadingTheme()
              return
            }
            
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
          // No data in response, use loading theme
          applyLoadingTheme()
        }
      } catch (error) {
        console.error('Failed to fetch brand theme:', error)
        // Use loading theme if fetch fails
        applyLoadingTheme()
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
    
    // Listen for theme changes (light/dark mode toggle)
    const handleThemeChange = () => {
      if (theme) {
        // Re-apply theme when dark mode changes
        applyBrandTheme(theme)
      }
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('brandThemeUpdated', handleBrandThemeUpdate)
      
      // Watch for dark mode class changes
      const observer = new MutationObserver(handleThemeChange)
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      })
      
      return () => {
        window.removeEventListener('brandThemeUpdated', handleBrandThemeUpdate)
        observer.disconnect()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run once at load time; brandThemeUpdated event handles manual refetches

  return (
    <BrandThemeContext.Provider value={{ theme, loading }}>
      {children}
    </BrandThemeContext.Provider>
  )
}
