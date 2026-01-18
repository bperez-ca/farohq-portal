'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Palette, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBrandTheme } from '@/components/branding/BrandThemeProvider'

const settingsItems = [
  { href: '/agency/settings/branding', icon: Palette, label: 'Branding' },
  { href: '/agency/settings/invites', icon: Mail, label: 'Invites' },
]

export function SettingsNav() {
  const pathname = usePathname()
  const { theme } = useBrandTheme()
  const brandColor = theme?.primary_color || '#2563eb'
  const activeBgColor = `${brandColor}15`

  return (
    <div className="mb-6 border-b border-border">
      <nav className="flex gap-2 -mb-px">
        {settingsItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                isActive
                  ? 'border-current text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
              style={
                isActive
                  ? {
                      borderBottomColor: brandColor,
                      color: brandColor,
                    }
                  : {}
              }
            >
              <item.icon className="w-4 h-4" style={isActive ? { color: brandColor } : {}} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
