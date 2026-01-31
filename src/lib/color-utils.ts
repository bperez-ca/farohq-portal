/**
 * Color utility functions for color theory-based suggestions
 * Implements triadic, complementary, analogous, and other color schemes
 */

export interface ColorSuggestion {
  method: 'triadic' | 'complementary' | 'analogous' | 'split-complementary' | 'monochromatic' | 'standard'
  color: string // hex
  contrast: number // WCAG contrast ratio
  description: string
  label: string
}

/**
 * Convert hex color to HSL
 */
export function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  try {
    // Remove # if present
    const cleanHex = hex.replace('#', '')
    
    // Parse RGB
    const r = parseInt(cleanHex.slice(0, 2), 16) / 255
    const g = parseInt(cleanHex.slice(2, 4), 16) / 255
    const b = parseInt(cleanHex.slice(4, 6), 16) / 255

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

/**
 * Convert HSL to hex
 */
export function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2

  let r = 0
  let g = 0
  let b = 0

  if (0 <= h && h < 60) {
    r = c
    g = x
    b = 0
  } else if (60 <= h && h < 120) {
    r = x
    g = c
    b = 0
  } else if (120 <= h && h < 180) {
    r = 0
    g = c
    b = x
  } else if (180 <= h && h < 240) {
    r = 0
    g = x
    b = c
  } else if (240 <= h && h < 300) {
    r = x
    g = 0
    b = c
  } else if (300 <= h && h < 360) {
    r = c
    g = 0
    b = x
  }

  r = Math.round((r + m) * 255)
  g = Math.round((g + m) * 255)
  b = Math.round((b + m) * 255)

  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`
}

/**
 * Calculate relative luminance for WCAG contrast
 */
export function getLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '')
  const r = parseInt(cleanHex.slice(0, 2), 16) / 255
  const g = parseInt(cleanHex.slice(2, 4), 16) / 255
  const b = parseInt(cleanHex.slice(4, 6), 16) / 255

  const [rs, gs, bs] = [r, g, b].map(val => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
  })

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Calculate WCAG contrast ratio between two colors
 */
export function calculateContrast(color1: string, color2: string): number {
  const lum1 = getLuminance(color1)
  const lum2 = getLuminance(color2)
  
  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)
  
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Get triadic colors (120° apart on color wheel)
 */
export function getTriadicColors(primaryHue: number): string[] {
  const hue1 = (primaryHue + 120) % 360
  const hue2 = (primaryHue + 240) % 360
  
  // Use moderate saturation and lightness for good visibility
  return [
    hslToHex(hue1, 70, 50),
    hslToHex(hue2, 70, 50),
  ]
}

/**
 * Get complementary color (180° opposite)
 */
export function getComplementaryColor(primaryHue: number): string {
  const compHue = (primaryHue + 180) % 360
  // Use moderate saturation and lightness
  return hslToHex(compHue, 70, 50)
}

/**
 * Get analogous colors (±30°)
 */
export function getAnalogousColors(primaryHue: number): string[] {
  const hue1 = (primaryHue - 30 + 360) % 360
  const hue2 = (primaryHue + 30) % 360
  
  return [
    hslToHex(hue1, 70, 50),
    hslToHex(hue2, 70, 50),
  ]
}

/**
 * Get split complementary colors
 */
export function getSplitComplementary(primaryHue: number): string[] {
  const compHue = (primaryHue + 180) % 360
  const split1 = (compHue - 30 + 360) % 360
  const split2 = (compHue + 30) % 360
  
  return [
    hslToHex(split1, 70, 50),
    hslToHex(split2, 70, 50),
  ]
}

/**
 * Get monochromatic variations
 */
export function getMonochromatic(primaryColor: string): string[] {
  const hsl = hexToHsl(primaryColor)
  if (!hsl) return []
  
  // Vary saturation and lightness while keeping hue
  return [
    hslToHex(hsl.h, Math.max(30, hsl.s - 20), Math.min(70, hsl.l + 10)),
    hslToHex(hsl.h, Math.min(90, hsl.s + 20), Math.max(30, hsl.l - 10)),
  ]
}

/**
 * Suggest best secondary color based on primary
 * Returns suggestions sorted by contrast/visibility
 */
export function suggestSecondaryColor(
  primaryColor: string,
  options?: {
    preferHighContrast?: boolean
    minContrast?: number // WCAG minimum (default: 3.0 for AA)
  }
): ColorSuggestion[] {
  const hsl = hexToHsl(primaryColor)
  if (!hsl) return []

  const minContrast = options?.minContrast || 3.0
  const suggestions: ColorSuggestion[] = []

  // Get triadic colors
  const triadic = getTriadicColors(hsl.h)
  triadic.forEach((color, index) => {
    const contrast = calculateContrast(primaryColor, color)
    if (contrast >= minContrast) {
      suggestions.push({
        method: 'triadic',
        color,
        contrast,
        description: 'High contrast, vibrant combination',
        label: `Triadic ${index + 1}`,
      })
    }
  })

  // Get complementary color
  const complementary = getComplementaryColor(hsl.h)
  const compContrast = calculateContrast(primaryColor, complementary)
  if (compContrast >= minContrast) {
    suggestions.push({
      method: 'complementary',
      color: complementary,
      contrast: compContrast,
      description: 'Maximum contrast, bold pairing',
      label: 'Complementary',
    })
  }

  // Get split complementary
  const splitComp = getSplitComplementary(hsl.h)
  splitComp.forEach((color, index) => {
    const contrast = calculateContrast(primaryColor, color)
    if (contrast >= minContrast) {
      suggestions.push({
        method: 'split-complementary',
        color,
        contrast,
        description: 'Balanced contrast, harmonious',
        label: `Split Complementary ${index + 1}`,
      })
    }
  })

  // Get analogous colors (lower contrast, but harmonious)
  const analogous = getAnalogousColors(hsl.h)
  analogous.forEach((color, index) => {
    const contrast = calculateContrast(primaryColor, color)
    // Lower threshold for analogous (they're meant to be subtle)
    if (contrast >= 2.0) {
      suggestions.push({
        method: 'analogous',
        color,
        contrast,
        description: 'Harmonious, subtle pairing',
        label: `Analogous ${index + 1}`,
      })
    }
  })

  // Get monochromatic (subtle variations)
  const monochromatic = getMonochromatic(primaryColor)
  monochromatic.forEach((color, index) => {
    const contrast = calculateContrast(primaryColor, color)
    if (contrast >= 2.0) {
      suggestions.push({
        method: 'monochromatic',
        color,
        contrast,
        description: 'Subtle, professional variation',
        label: `Monochromatic ${index + 1}`,
      })
    }
  })

  // Add standard colors (always included)
  const standardColors = [
    { color: '#6b7280', label: 'Gray (Default)', description: 'Neutral gray, works with any color' },
    { color: '#4b5563', label: 'Dark Gray', description: 'Professional, subtle accent' },
    { color: '#9ca3af', label: 'Light Gray', description: 'Soft, minimal accent' },
    { color: '#374151', label: 'Charcoal', description: 'Deep, sophisticated gray' },
  ]

  standardColors.forEach(({ color, label, description }) => {
    const contrast = calculateContrast(primaryColor, color)
    suggestions.push({
      method: 'standard',
      color,
      contrast,
      description,
      label,
    })
  })

  // Sort by contrast (highest first) if preferHighContrast, otherwise by method priority
  if (options?.preferHighContrast) {
    suggestions.sort((a, b) => b.contrast - a.contrast)
  } else {
    // Priority: triadic > complementary > split-complementary > standard > analogous > monochromatic
    const priority: Record<string, number> = {
      triadic: 6,
      complementary: 5,
      'split-complementary': 4,
      standard: 3,
      analogous: 2,
      monochromatic: 1,
    }
    suggestions.sort((a, b) => {
      const priorityDiff = (priority[b.method] || 0) - (priority[a.method] || 0)
      if (priorityDiff !== 0) return priorityDiff
      return b.contrast - a.contrast
    })
  }

  return suggestions.slice(0, 8) // Return top 8 suggestions (includes standard colors)
}

/**
 * Get contrast rating for accessibility
 */
export function getContrastRating(contrast: number): { level: string; accessible: boolean } {
  if (contrast >= 7) {
    return { level: 'AAA (Excellent)', accessible: true }
  } else if (contrast >= 4.5) {
    return { level: 'AA (Good)', accessible: true }
  } else if (contrast >= 3) {
    return { level: 'AA Large (Acceptable)', accessible: true }
  } else {
    return { level: 'Below Standard', accessible: false }
  }
}

/**
 * Determine if a color is dark (needs light text)
 * Returns true if color is dark, false if light
 */
export function isDarkColor(hex: string): boolean {
  const luminance = getLuminance(hex)
  // Threshold: 0.5 means colors with luminance < 0.5 are considered dark
  return luminance < 0.5
}

/**
 * Get appropriate text color for a background color
 * Returns white (#ffffff) for dark backgrounds, dark gray (#1f2937) for light backgrounds
 */
export function getTextColorForBackground(backgroundColor: string): string {
  return isDarkColor(backgroundColor) ? '#ffffff' : '#1f2937'
}

/**
 * Get appropriate text color with light gray option for very light backgrounds
 * Returns white for dark, dark gray for medium, light gray for very light
 */
export function getTextColorForBackgroundWithGray(backgroundColor: string): string {
  const luminance = getLuminance(backgroundColor)
  if (luminance < 0.5) {
    return '#ffffff' // White for dark backgrounds
  } else if (luminance > 0.9) {
    return '#6b7280' // Light gray for very light backgrounds
  } else {
    return '#1f2937' // Dark gray for medium backgrounds
  }
}
