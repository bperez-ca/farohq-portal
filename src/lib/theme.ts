/**
 * Theme utilities for white-label branding
 * Handles brand colors, fonts, and theme configuration
 */

/**
 * Default theme object (legacy support for existing components)
 * @deprecated Use BrandTheme and useBrandTheme hook instead
 */
export const theme = {
  brandName: "FARO",
  brandColor: "#2563eb",
  brandLogoUrl: "/logo-faro.svg",
};

export interface BrandTheme {
  agencyId?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  themeJson?: {
    name?: string;
    version?: string;
    layout?: {
      type?: string;
      sidebar_width?: string;
      header_height?: string;
    };
    typography?: {
      font_family?: string;
      font_size_base?: string;
      line_height_base?: string;
    };
    colors?: {
      brand?: string;
      brand_hover?: string;
      accent?: string;
    };
  };
}

/**
 * Default theme fallback values
 */
export const DEFAULT_THEME: BrandTheme = {
  primaryColor: '#2563eb',
  secondaryColor: '#6b7280',
  themeJson: {
    typography: {
      font_family: 'Inter, system-ui, sans-serif',
      font_size_base: '16px',
      line_height_base: '1.5',
    },
    colors: {
      brand: '#2563eb',
      brand_hover: '#1d4ed8',
      accent: '#10b981',
    },
  },
};

/**
 * Apply brand theme to CSS variables
 */
export function applyBrandTheme(theme: BrandTheme | null, isDark: boolean = false) {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  const brandTheme = theme || DEFAULT_THEME;

  // Extract colors from theme
  const primaryColor = brandTheme.primaryColor || brandTheme.themeJson?.colors?.brand || DEFAULT_THEME.primaryColor!;
  const secondaryColor = brandTheme.secondaryColor || brandTheme.themeJson?.colors?.accent || DEFAULT_THEME.secondaryColor!;
  const brandHover = brandTheme.themeJson?.colors?.brand_hover || adjustColorBrightness(primaryColor, -10);
  const accentColor = brandTheme.themeJson?.colors?.accent || DEFAULT_THEME.themeJson!.colors!.accent!;

  // Extract font from theme
  const fontFamily = brandTheme.themeJson?.typography?.font_family || DEFAULT_THEME.themeJson!.typography!.font_family!;

  // Apply CSS variables
  root.style.setProperty('--brand-color', primaryColor);
  root.style.setProperty('--brand-color-hover', brandHover);
  root.style.setProperty('--brand-accent', accentColor);
  root.style.setProperty('--brand-font', fontFamily);
  root.style.setProperty('--brand-secondary', secondaryColor);

  // Apply brand color to primary color (for shadcn/ui components)
  // This ensures buttons with bg-primary use the brand color
  if (primaryColor) {
    const hsl = hexToHsl(primaryColor);
    if (hsl) {
      // In dark mode, increase lightness for better contrast
      // Ensure minimum contrast ratio of 4.5:1 for accessibility
      const lightLightness = Math.min(hsl.l, 53); // Cap at 53% for light mode
      const darkLightness = Math.max(hsl.l + 15, 65); // Increase by at least 15% for dark mode, min 65%
      
      // Set primary color in HSL format for Tailwind
      root.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${isDark ? darkLightness : lightLightness}%`);
      root.style.setProperty('--ring', `${hsl.h} ${hsl.s}% ${isDark ? darkLightness - 5 : lightLightness}%`);
      
      // Also set primary foreground for contrast
      // In dark mode, use darker foreground for better contrast with lighter primary
      root.style.setProperty('--primary-foreground', isDark ? '222.2 47.4% 11.2%' : '210 40% 98%');
      
      // Adjust brand color hover state for dark mode
      if (isDark) {
        const darkHoverHsl = { ...hsl, l: Math.min(darkLightness + 5, 85) };
        root.style.setProperty('--brand-color-hover', `hsl(${darkHoverHsl.h}, ${darkHoverHsl.s}%, ${darkHoverHsl.l}%)`);
      }
    }
  }

  // Apply font family
  if (fontFamily) {
    root.style.setProperty('--font-family', fontFamily);
    document.body.style.fontFamily = fontFamily;
  }
}

/**
 * Convert hex color to HSL
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Adjust color brightness
 */
function adjustColorBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}

/**
 * Clear brand theme (reset to defaults)
 */
export function clearBrandTheme() {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  root.style.removeProperty('--brand-color');
  root.style.removeProperty('--brand-color-hover');
  root.style.removeProperty('--brand-accent');
  root.style.removeProperty('--brand-font');
  root.style.removeProperty('--brand-secondary');
  root.style.removeProperty('--font-family');
  document.body.style.fontFamily = '';
}
