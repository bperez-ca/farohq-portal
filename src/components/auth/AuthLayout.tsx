'use client'

import { useBrandTheme } from '@/components/branding/BrandThemeProvider'
import { BrandLogo } from '@/components/BrandLogo'
import { Loader2 } from 'lucide-react'
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
  const tier = theme?.tier
  const isFullWhiteLabel = tier === 'growth' || tier === 'scale'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      {/* Logo at top */}
      <div className="mb-8 flex flex-col items-center">
        {isFullWhiteLabel ? (
          // Full white-label tiers: show agency logo or spinner, NOT Faro logo
          loading || !logoUrl ? (
            <div className="h-12 w-12 flex items-center justify-center mb-4">
              <Loader2 className="h-12 w-12 text-gray-500 animate-spin" />
            </div>
          ) : (
            <BrandLogo
              logoUrl={logoUrl}
              alt={tenantName}
              className="h-12 w-auto mb-4"
              showText={false}
            />
          )
        ) : (
          // Lower tiers: show Faro logo
          <BrandLogo
            logoUrl="/logo.svg"
            alt="FaroHQ"
            className="h-12 w-auto mb-4"
            fallback="/logo.svg"
            showText={false}
          />
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
