/**
 * Contrast utility functions for ensuring WCAG compliance
 * Based on WCAG 2.1 contrast ratio calculations
 */

/**
 * Calculate relative luminance of a color (0-1 range)
 * Based on WCAG 2.1 formula
 */
function getRelativeLuminance(color: string): number {
  const { r, g, b } = parseColor(color);
  
  // Convert RGB to linear values
  const rs = linearizeRGB(r);
  const gs = linearizeRGB(g);
  const bs = linearizeRGB(b);
  
  // Calculate relative luminance
  // Formula: 0.2126*R + 0.7152*G + 0.0722*B
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Linearize RGB value for luminance calculation
 */
function linearizeRGB(value: number): number {
  if (value <= 0.03928) {
    return value / 12.92;
  }
  return Math.pow((value + 0.055) / 1.055, 2.4);
}

/**
 * Parse color string (hex, rgb, rgba) and return RGB values (0-1 range)
 */
function parseColor(color: string): { r: number; g: number; b: number } {
  color = color.trim().toLowerCase();

  // Handle hex colors (#RRGGBB or #RGB)
  if (color.startsWith('#')) {
    return parseHexColor(color);
  }

  // Handle rgb/rgba colors
  if (color.startsWith('rgb')) {
    return parseRGBColor(color);
  }

  // Default: assume black if parsing fails
  return { r: 0, g: 0, b: 0 };
}

/**
 * Parse hex color (#RRGGBB or #RGB)
 */
function parseHexColor(hex: string): { r: number; g: number; b: number } {
  hex = hex.replace('#', '');
  
  // Handle short form (#RGB -> #RRGGBB)
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  if (hex.length !== 6) {
    return { r: 0, g: 0, b: 0 };
  }

  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  return { r, g, b };
}

/**
 * Parse rgb/rgba color string
 */
function parseRGBColor(rgb: string): { r: number; g: number; b: number } {
  // Extract numbers using regex
  const matches = rgb.match(/\d+\.?\d*/g);

  if (!matches || matches.length < 3) {
    return { r: 0, g: 0, b: 0 };
  }

  // Parse RGB values
  let r = parseFloat(matches[0]);
  let g = parseFloat(matches[1]);
  let b = parseFloat(matches[2]);

  // Normalize to 0-1 range (assuming 0-255 input)
  if (r > 1.0 || g > 1.0 || b > 1.0) {
    r /= 255.0;
    g /= 255.0;
    b /= 255.0;
  }

  return { r, g, b };
}

/**
 * Calculate WCAG contrast ratio between two colors
 * Returns a value between 1 (no contrast) and 21 (maximum contrast)
 * WCAG AA requires 4.5:1 for normal text, 3:1 for large text
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);

  // Ensure lighter color is numerator
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  // Contrast ratio formula: (L1 + 0.05) / (L2 + 0.05)
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get appropriate text color (white or dark) for a given background
 * Returns "#ffffff" for dark backgrounds, "#1f2937" for light backgrounds
 */
export function getContrastingTextColor(backgroundColor: string): string {
  const luminance = getRelativeLuminance(backgroundColor);
  
  // If background is dark (luminance < 0.5), use white text
  // If background is light (luminance >= 0.5), use dark text
  if (luminance < 0.5) {
    return '#ffffff';
  }
  return '#1f2937';
}

/**
 * Validate if contrast meets minimum ratio
 * Returns true if contrast is sufficient, false otherwise
 */
export function validateContrast(
  backgroundColor: string,
  textColor: string,
  minRatio: number = 4.5
): boolean {
  const ratio = calculateContrastRatio(backgroundColor, textColor);
  return ratio >= minRatio;
}

/**
 * Options for ensureContrast function
 */
export interface ContrastOptions {
  minRatio?: number;
  autoAdjust?: boolean;
  fallbackLight?: string;
  fallbackDark?: string;
}

/**
 * Ensure text color has sufficient contrast against background
 * If contrast is insufficient and autoAdjust is true, returns adjusted color
 * Otherwise returns original text color
 */
export function ensureContrast(
  backgroundColor: string,
  textColor: string,
  options: ContrastOptions = {}
): string {
  const {
    minRatio = 4.5, // WCAG AA default
    autoAdjust = true,
    fallbackLight = '#1f2937',
    fallbackDark = '#ffffff',
  } = options;

  // Validate current contrast
  if (validateContrast(backgroundColor, textColor, minRatio)) {
    return textColor;
  }

  // If auto-adjust is disabled, return original (caller should handle)
  if (!autoAdjust) {
    return textColor;
  }

  // Auto-adjust: return contrasting color based on background
  const bgLuminance = getRelativeLuminance(backgroundColor);
  return bgLuminance < 0.5 ? fallbackDark : fallbackLight;
}

/**
 * Extract color from Tailwind class name (e.g., "bg-cyan-100" -> actual color)
 * This is a helper for components using Tailwind classes
 */
export function extractColorFromTailwind(className: string): string | null {
  // Match Tailwind color classes like bg-cyan-100, text-cyan-700, etc.
  const colorMatch = className.match(/(?:bg|text|border)-(\w+)-(\d+)/);
  if (!colorMatch) {
    return null;
  }

  const [, colorName, shade] = colorMatch;
  
  // Map common Tailwind colors to hex values
  // This is a simplified mapping - for production, consider using tailwindcss/resolveConfig
  const colorMap: Record<string, Record<string, string>> = {
    cyan: {
      '50': '#ecfeff',
      '100': '#cffafe',
      '200': '#a5f3fc',
      '300': '#67e8f9',
      '400': '#22d3ee',
      '500': '#06b6d4',
      '600': '#0891b2',
      '700': '#0e7490',
      '800': '#155e75',
      '900': '#164e63',
    },
    // Add more colors as needed
  };

  return colorMap[colorName]?.[shade] || null;
}

/**
 * Get text color class that ensures contrast with background
 * Returns a Tailwind text color class that will have sufficient contrast
 */
export function getContrastingTextClass(backgroundColor: string): string {
  const contrastingColor = getContrastingTextColor(backgroundColor);
  return contrastingColor === '#ffffff' 
    ? 'text-white' 
    : 'text-gray-800 dark:text-gray-100';
}
