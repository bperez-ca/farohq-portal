'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, Users, FileText, BarChart3, LayoutDashboard, Settings, ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react'
import { useSidebar } from './SidebarContext'
import { NavItem } from './NavItem'
import { UserProfileSection } from './UserProfileSection'
import { useUser } from '@clerk/nextjs'
import { Button } from '@farohq/ui'
import { cn } from '@/lib/utils'
import { useTheme } from '@/app/hooks/useTheme'
import { useEffect, useState } from 'react'
// Using img tag instead of Next Image for external URLs

const navigationItems = [
  { href: '/agency/dashboard', icon: Building2, label: 'Dashboard' },
  { href: '/agency/leads', icon: Users, label: 'Leads' },
  { href: '/agency/diagnostics', icon: FileText, label: 'Diagnostics' },
  { href: '/agency/kpis', icon: BarChart3, label: 'KPIs' },
  { href: '/business/dashboard', icon: LayoutDashboard, label: 'Business' },
  { href: '/agency/settings/branding', icon: Settings, label: 'Settings' },
]

export function SidebarNav() {
  // All hooks must be called before any conditional returns
  const { collapsed, toggleCollapsed } = useSidebar()
  const { user, isLoaded: userLoaded } = useUser()
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()
  const [orgInfo, setOrgInfo] = useState<{ name: string; logoUrl?: string } | null>({ name: 'FARO' }) // Initialize with default
  const [isLoadingOrgInfo, setIsLoadingOrgInfo] = useState(false) // Start as false since we have default

  // Fetch organization info for branding (optimized with early return and request deduplication)
  useEffect(() => {
    // Don't fetch on auth pages
    if (pathname.startsWith('/signin') || pathname.startsWith('/signup') || pathname.startsWith('/login')) {
      return
    }

    let cancelled = false

    async function fetchOrgInfo() {
      // Wait for user to be loaded, but don't block rendering
      if (!userLoaded) {
        return
      }

      // If no user, keep default
      if (!user) {
        if (!cancelled) {
          setOrgInfo(null)
        }
        return
      }

      setIsLoadingOrgInfo(true)
      try {
        const response = await fetch('/api/v1/tenants/my-orgs', {
          credentials: 'include',
          // Add cache headers to speed up subsequent loads
          cache: 'default',
        })

        if (cancelled) return

        if (response.ok) {
          const data = await response.json()
          const orgs = data.orgs || []
          if (orgs.length > 0) {
            const activeOrgId = localStorage.getItem('farohq_active_org_id')
            const activeOrg = activeOrgId ? orgs.find((org: any) => org.id === activeOrgId) : orgs[0]
            const selectedOrg = activeOrg || orgs[0]
            if (!cancelled) {
              setOrgInfo({
                name: selectedOrg.name || 'FARO',
                logoUrl: selectedOrg.logo_url || selectedOrg.logoUrl,
              })
            }
          } else {
            // No orgs - hide sidebar only after we confirm
            if (!cancelled) {
              setOrgInfo(null)
            }
          }
        } else {
          // On error, keep default FARO so sidebar still shows
          if (!cancelled) {
            setOrgInfo({ name: 'FARO' })
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch org info:', error)
          // Default to FARO if fetch fails so sidebar still shows
          setOrgInfo({ name: 'FARO' })
        }
      } finally {
        if (!cancelled) {
          setIsLoadingOrgInfo(false)
        }
      }
    }

    fetchOrgInfo()

    return () => {
      cancelled = true
    }
  }, [user, userLoaded, pathname])

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

  // Use default if still loading or orgInfo is null
  const displayOrgInfo = orgInfo || { name: 'FARO' }

  const brandColor = '#2563eb' // Default brand color, can be enhanced later
  const logoUrl = displayOrgInfo.logoUrl
  const tenantName = displayOrgInfo.name

  // Get first letter for fallback logo
  const logoInitial = tenantName.charAt(0).toUpperCase()

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
      <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/10">
        <Link
          href="/agency/dashboard"
          className={cn('flex items-center gap-3', collapsed && 'justify-center w-full')}
        >
          {logoUrl ? (
            <div className="relative w-8 h-8 flex-shrink-0">
              <img
                src={logoUrl}
                alt={tenantName}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-medium text-sm flex-shrink-0 shadow-sm"
              style={{ backgroundColor: brandColor }}
            >
              {logoInitial}
            </div>
          )}
          {!collapsed && (
            <span className="font-medium text-lg tracking-tight leading-tight">
              {formatBusinessName(tenantName)}
            </span>
          )}
        </Link>
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation items */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {navigationItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            collapsed={collapsed}
          />
        ))}
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
        <UserProfileSection collapsed={collapsed} />
      </div>
    </aside>
  )
}
