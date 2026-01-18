'use client'

import { useBrandTheme } from '@/components/branding/BrandThemeProvider'
import { BrandLogoSimple } from '@/components/BrandLogo'
import { useEffect, useState } from 'react'

interface AuthLayoutProps {
  children: React.ReactNode
  title?: string
}

export function AuthLayout({ children, title }: AuthLayoutProps) {
  const { theme, loading } = useBrandTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by not rendering logo until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        {children}
      </div>
    )
  }

  const logoUrl = theme?.logo_url
  const tenantName = theme?.tenant_name || 'FaroHQ'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      {/* Logo at top */}
      <div className="mb-8 flex flex-col items-center">
        {logoUrl ? (
          <BrandLogoSimple
            logoUrl={logoUrl}
            alt={tenantName}
            className="h-12 w-auto mb-4"
            fallback="/logo.svg"
          />
        ) : (
          <div className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-semibold text-lg mb-4 bg-brand shadow-sm">
            {tenantName.charAt(0).toUpperCase()}
          </div>
        )}
        {title && (
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        )}
      </div>
      
      {/* Auth content */}
      {children}
    </div>
  )
}
