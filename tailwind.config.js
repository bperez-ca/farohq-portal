/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    // Include UI package source for Tailwind class scanning
    // Use node_modules path which works in both local and Docker contexts
    './node_modules/@farohq/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: ['class'],
  theme: {
    extend: {
      borderRadius: {
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        full: '999px',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: 'hsl(var(--primary) / 0.05)',
          100: 'hsl(var(--primary) / 0.1)',
          200: 'hsl(var(--primary) / 0.2)',
          300: 'hsl(var(--primary) / 0.3)',
          400: 'hsl(var(--primary) / 0.4)',
          500: 'hsl(var(--primary))',
          600: 'hsl(var(--primary) / 0.9)',
          700: 'hsl(var(--primary) / 0.8)',
          800: 'hsl(var(--primary) / 0.7)',
          900: 'hsl(var(--primary) / 0.6)',
          950: 'hsl(var(--primary) / 0.5)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          50: 'hsl(var(--secondary) / 0.05)',
          100: 'hsl(var(--secondary) / 0.1)',
          200: 'hsl(var(--secondary) / 0.2)',
          300: 'hsl(var(--secondary) / 0.3)',
          400: 'hsl(var(--secondary) / 0.4)',
          500: 'hsl(var(--secondary))',
          600: 'hsl(var(--secondary) / 0.9)',
          700: 'hsl(var(--secondary) / 0.8)',
          800: 'hsl(var(--secondary) / 0.7)',
          900: 'hsl(var(--secondary) / 0.6)',
          950: 'hsl(var(--secondary) / 0.5)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    require('tailwindcss-animate'), // Required for UI package animations
  ],
};
