'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, Users, FileText, BarChart3, LayoutDashboard, Settings, ChevronLeft, ChevronRight, Moon, Sun, Palette, Mail, ChevronDown, ChevronUp, Inbox, Star, MapPin, DollarSign, TrendingUp, Clock, Briefcase, Image, Link as LinkIcon, MessageSquare } from 'lucide-react'
import { useSidebar } from '@/components/navigation/SidebarContext'
import { NavItem } from '@/components/navigation/NavItem'
import { UserProfileSection } from '@/components/navigation/UserProfileSection'
import { WorkspaceSwitcher } from '@/components/workspace/WorkspaceSwitcher'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/lib/ui'
import { cn } from '@/lib/utils'
import { useTheme } from '@/app/hooks/useTheme'
import { useEffect, useState } from 'react'
import { useBrandTheme } from '@/components/branding/BrandThemeProvider'
import { BrandLogoSimple } from '@/components/BrandLogo'
import { Loader2 } from 'lucide-react'
import { useAuthSession } from '@/contexts/AuthSessionContext'
// Using img tag instead of Next Image for external URLs

const agencyNavigationItems = [
  { href: '/agency/dashboard', icon: Building2, label: 'Dashboard' },
  { href: '/agency/clients', icon: Briefcase, label: 'Clients' },
  { href: '/agency/leads', icon: Users, label: 'Leads' },
  { href: '/agency/diagnostics', icon: FileText, label: 'Diagnostics' },
  { href: '/agency/kpis', icon: BarChart3, label: 'KPIs' },
]

const businessNavigationItems = [
  { href: '/business/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/business/inbox', icon: Inbox, label: 'Inbox' },
  { href: '/business/reviews', icon: Star, label: 'Reviews' },
  { href: '/business/presence', icon: MapPin, label: 'Presence' },
  { href: '/business/revenue', icon: DollarSign, label: 'Revenue' },
  { href: '/business/insights', icon: TrendingUp, label: 'Insights' },
]

const businessSettingsItems = [
  { href: '/business/settings/profile', icon: Users, label: 'Profile' },
  { href: '/business/settings/hours', icon: Clock, label: 'Hours' },
  { href: '/business/settings/services-products', icon: Briefcase, label: 'Services & Products' },
  { href: '/business/settings/media', icon: Image, label: 'Media' },
  { href: '/business/settings/posts-qa', icon: FileText, label: 'Posts & Q&A' },
  { href: '/business/settings/links-attributes', icon: LinkIcon, label: 'Links & Attributes' },
  { href: '/business/settings/messaging', icon: MessageSquare, label: 'Messaging' },
]

const settingsItems = [
  { href: '/agency/settings/branding', icon: Palette, label: 'Branding' },
  { href: '/agency/settings/invites', icon: Mail, label: 'Invites' },
]

export function SidebarNav() {
  // All hooks must be called before any conditional returns
  const { collapsed, toggleCollapsed } = useSidebar()
  const { user, isLoaded: userLoaded } = useUser()
  const { orgs, activeOrgId, loading: isLoadingOrgInfo } = useAuthSession()
  const { theme, toggleTheme } = useTheme()
  const { theme: brandTheme, loading: isBrandThemeLoading } = useBrandTheme()
  const pathname = usePathname()

  const selectedOrg = activeOrgId ? orgs.find((o) => o.id === activeOrgId) : orgs[0]
  const orgInfo = orgs.length > 0 && selectedOrg
    ? { name: selectedOrg.name || '', logoUrl: selectedOrg.logo_url || selectedOrg.logoUrl, tier: selectedOrg.tier }
    : null

  // Conditional returns AFTER all hooks
  // Don't show sidebar on auth pages
  if (pathname.startsWith('/signin') || pathname.startsWith('/signup') || pathname.startsWith('/login')) {
    return null
  }

  // Show sidebar immediately, even before user is loaded (optimistic rendering)
  // Only hide if we've confirmed user has no orgs after loading
  if (userLoaded && !user) {
    return null
  }

  // Don't show sidebar if user has no agency/org (only after loading completes and user is loaded)
  if (userLoaded && user && !isLoadingOrgInfo && !orgInfo) {
    return null
  }

  // Get brand colors and logo from BrandThemeProvider (preferred) or fallback to orgInfo
  const brandColor = brandTheme?.primary_color || '#6b7280'
  const logoUrl = brandTheme?.logo_url || orgInfo?.logoUrl
  const tenantName = brandTheme?.tenant_name || orgInfo?.name || ''

  // Show loading state if brand theme is loading or if we're still loading org info
  const isLoading = isBrandThemeLoading || isLoadingOrgInfo

  // Determine if we're in business or agency view
  const isBusiness = pathname.startsWith('/business')
  const defaultDashboardHref = isBusiness ? '/business/dashboard' : '/agency/dashboard'

  // Calculate luminance to determine if color is dark (for text contrast)
  const getLuminance = (hex: string): number => {
    const rgb = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
    if (!rgb) return 0.5 // Default to medium if invalid
    
    const r = parseInt(rgb[1], 16) / 255
    const g = parseInt(rgb[2], 16) / 255
    const b = parseInt(rgb[3], 16) / 255
    
    // Relative luminance formula (WCAG)
    const [rs, gs, bs] = [r, g, b].map(val => {
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
    })
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  const isDarkColor = brandColor ? getLuminance(brandColor) < 0.5 : false
  // Use white text for dark backgrounds, dark text for light backgrounds
  // For gray loading state, use appropriate text color
  const textColor = brandColor 
    ? (isDarkColor ? '#ffffff' : '#000000')
    : '#6b7280' // Gray text for loading state

  // Function to split business name with line break based on length
  const formatBusinessName = (name: string): JSX.Element | string => {
    // If name is short (15 chars or less), return as is
    if (name.length <= 15) {
      return name
    }

    // Find a good break point (prefer space, hyphen, or after 12-18 chars)
    const breakPoint = Math.min(Math.max(12, Math.floor(name.length / 2)), 18)
    
    // Try to find a space near the break point
    let splitIndex = name.lastIndexOf(' ', breakPoint)
    if (splitIndex === -1 || splitIndex < 8) {
      // If no space found or too early, try hyphen
      splitIndex = name.lastIndexOf('-', breakPoint)
      if (splitIndex === -1 || splitIndex < 8) {
        // If no hyphen, just split at break point
        splitIndex = breakPoint
      }
    }

    const firstPart = name.substring(0, splitIndex)
    const secondPart = name.substring(splitIndex + (name[splitIndex] === ' ' || name[splitIndex] === '-' ? 1 : 0))

    return (
      <>
        {firstPart}
        <br />
        {secondPart}
      </>
    )
  }

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col fixed left-0 top-0 h-screen bg-white dark:bg-slate-900 border-r border-black/5 dark:border-white/10 transition-all duration-300 z-40',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header with logo and toggle */}
      <div 
        className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/10"
        style={{ 
          backgroundColor: brandColor || undefined,
          color: textColor,
        }}
      >
        <Link
          href={defaultDashboardHref}
          className={cn('flex items-center gap-3', collapsed && 'justify-center w-full')}
          style={{ color: textColor }}
        >
          {isLoading ? (
            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          ) : logoUrl ? (
            <BrandLogoSimple
              logoUrl={logoUrl}
              alt={tenantName}
              className="w-8 h-8 flex-shrink-0 object-contain"
              showText={false}
            />
          ) : (
            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          )}
          {!collapsed && (
            <span 
              className="font-medium text-lg tracking-tight leading-tight"
              style={{ 
                color: textColor || (brandColor ? (isDarkColor ? '#ffffff' : '#000000') : undefined)
              }}
            >
              {tenantName ? formatBusinessName(tenantName) : ''}
            </span>
          )}
        </Link>
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            className="h-8 w-8"
            style={{ color: textColor }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation items */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {(() => {
          const isBusiness = pathname.startsWith('/business')
          const navigationItems = isBusiness ? businessNavigationItems : agencyNavigationItems
          
          return (
            <>
              {navigationItems.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  collapsed={collapsed}
                />
              ))}
              
              {/* Settings with submenu */}
              <SettingsSubmenu collapsed={collapsed} pathname={pathname} isBusiness={isBusiness} />
            </>
          )
        })()}
      </nav>

      {/* Theme toggle */}
      <div className="px-3 py-2 border-t border-black/5 dark:border-white/10">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className={cn('w-full justify-start', collapsed && 'justify-center')}
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4" />
          )}
          {!collapsed && <span className="ml-2">Toggle Theme</span>}
        </Button>
      </div>

      {/* UX-006: Workspace switcher Agency ↔ Business */}
      {!collapsed && <WorkspaceSwitcher />}

      {/* Collapse button when collapsed */}
      {collapsed && (
        <div className="p-3 border-t border-black/5 dark:border-white/10">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            className="w-full"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* User profile section */}
      <div className="p-3 border-t border-black/5 dark:border-white/10">
        <UserProfileSection collapsed={collapsed} tier={orgInfo?.tier} />
      </div>
    </aside>
  )
}

// Settings submenu component
function SettingsSubmenu({ collapsed, pathname, isBusiness = false }: { collapsed: boolean; pathname: string; isBusiness?: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const { theme } = useBrandTheme()
  const brandColor = theme?.primary_color || '#2563eb'
  const activeBgColor = `${brandColor}15`
  const isSettingsPage = isBusiness 
    ? pathname?.startsWith('/business/settings')
    : pathname?.startsWith('/agency/settings')
  
  const currentSettingsItems = isBusiness ? businessSettingsItems : settingsItems
  
  // Auto-expand if we're on a settings page
  useEffect(() => {
    if (isSettingsPage && !collapsed) {
      setIsOpen(true)
    }
  }, [isSettingsPage, collapsed])

  const content = (
    <div className="space-y-1">
      {/* Settings parent button */}
      <button
        onClick={() => !collapsed && setIsOpen(!isOpen)}
        className={cn(
          'flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all tracking-tight w-full',
          isSettingsPage
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
          collapsed && 'justify-center'
        )}
        style={
          isSettingsPage && !collapsed
            ? {
                backgroundColor: activeBgColor,
                color: brandColor,
              }
            : {}
        }
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Settings className="w-5 h-5 flex-shrink-0" style={isSettingsPage ? { color: brandColor } : {}} />
          {!collapsed && <span className="truncate">Settings</span>}
        </div>
        {!collapsed && (
          <div className="flex-shrink-0">
            {isOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        )}
      </button>

      {/* Settings submenu items */}
      {!collapsed && isOpen && (
        <div className="ml-4 pl-4 border-l border-border space-y-1">
          {currentSettingsItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
                style={
                  isActive
                    ? {
                        backgroundColor: activeBgColor,
                        color: brandColor,
                      }
                    : {}
                }
              >
                <item.icon className="w-4 h-4 flex-shrink-0" style={isActive ? { color: brandColor } : {}} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )

  if (collapsed) {
    const defaultSettingsHref = isBusiness ? '/business/settings/profile' : '/agency/settings/branding'
    return (
      <div className="space-y-1">
        <Link
          href={defaultSettingsHref}
          className={cn(
            'flex items-center justify-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
            isSettingsPage
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          )}
          style={
            isSettingsPage
              ? {
                  backgroundColor: activeBgColor,
                  color: brandColor,
                }
              : {}
          }
        >
          <Settings className="w-5 h-5" style={isSettingsPage ? { color: brandColor } : {}} />
        </Link>
      </div>
    )
  }

  return content
}
