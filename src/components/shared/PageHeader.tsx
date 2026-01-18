'use client'

import { ReactNode } from 'react'
import { Breadcrumbs, BreadcrumbItem } from './Breadcrumbs'
import { useBrandTheme } from '@/components/branding/BrandThemeProvider'
import { BrandLogoSimple } from '@/components/BrandLogo'

interface PageHeaderProps {
  breadcrumbs: BreadcrumbItem[]
  title: string
  subtitle?: string
  actions?: ReactNode
  showLogo?: boolean
}

export function PageHeader({ breadcrumbs, title, subtitle, actions, showLogo = false }: PageHeaderProps) {
  const { theme } = useBrandTheme()
  const logoUrl = showLogo ? (theme?.logo_url || null) : null
  const tenantName = theme?.tenant_name || 'FaroHQ'

  return (
    <div className="sticky top-0 z-10 bg-neutralBg/80 dark:bg-neutralBgDark/80 backdrop-blur-lg border-b border-black/5 dark:border-white/10">
      <div className="px-6 py-4">
        <div className="mb-3">
          <Breadcrumbs items={breadcrumbs} />
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 space-y-1.5">
            {logoUrl && (
              <BrandLogoSimple
                logoUrl={logoUrl}
                alt={tenantName}
                className="h-8 w-auto flex-shrink-0"
                fallback="/logo.svg"
              />
            )}
            <div className="space-y-1.5">
              <h1 className="text-2xl md:text-3xl font-medium tracking-tight">{title}</h1>
              {subtitle && <p className="text-sm text-muted-foreground leading-relaxed">{subtitle}</p>}
            </div>
          </div>

          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      </div>
    </div>
  )
}
