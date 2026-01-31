'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, Users, FileText, BarChart3, Settings, Home, Inbox, Star, MapPin, TrendingUp } from 'lucide-react'
import { useBrandTheme } from '@/components/branding/BrandThemeProvider'
import { cn } from '@/lib/utils'

const agencyTabs = [
  { href: '/agency/dashboard', icon: Building2, label: 'Dashboard' },
  { href: '/agency/leads', icon: Users, label: 'Leads' },
  { href: '/agency/diagnostics', icon: FileText, label: 'Diagnostics' },
  { href: '/agency/kpis', icon: BarChart3, label: 'KPIs' },
  { href: '/agency/settings/branding', icon: Settings, label: 'Settings' },
]

/** UX-012: SMB mobile nav — Home / Inbox / Reviews / Presence / Insights */
const businessTabs = [
  { href: '/business/dashboard', icon: Home, label: 'Home' },
  { href: '/business/inbox', icon: Inbox, label: 'Inbox' },
  { href: '/business/reviews', icon: Star, label: 'Reviews' },
  { href: '/business/presence', icon: MapPin, label: 'Presence' },
  { href: '/business/insights', icon: TrendingUp, label: 'Insights' },
]

export function BottomNavMobile() {
  const pathname = usePathname()
  const { theme } = useBrandTheme()

  const isAgency = pathname.startsWith('/agency')
  const isBusiness = pathname.startsWith('/business')
  if (!isAgency && !isBusiness) {
    return null
  }

  const tabs = isBusiness ? businessTabs : agencyTabs
  const brandColor = theme?.primary_color || '#2563eb'

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t dark:border-slate-800 flex items-center justify-around py-2 px-2 z-50">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`)

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex flex-col items-center gap-1 text-xs py-2 px-3 rounded-lg transition-colors min-w-0 flex-1',
              active ? 'font-semibold' : 'text-muted-foreground'
            )}
            style={{
              color: active ? brandColor : undefined,
            }}
          >
            <Icon
              className="w-5 h-5 flex-shrink-0"
              style={{
                color: active ? brandColor : undefined,
              }}
            />
            <span className="truncate">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
