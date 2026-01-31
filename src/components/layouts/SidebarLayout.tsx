'use client'

import { usePathname } from 'next/navigation'
import { SidebarNav } from '../navigation/SidebarNav'
import { BottomNavMobile } from '../navigation/BottomNavMobile'
import { ConnectReminderBanner } from '../connect-reminder/ConnectReminderBanner'
import { SidebarProvider, useSidebar } from '../navigation/SidebarContext'
import { cn } from '@/lib/utils'

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar()
  const pathname = usePathname()

  // Don't apply sidebar layout to auth, invite, onboarding, shared diagnostic, or root
  if (
    pathname.startsWith('/signin') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/invites/accept') ||
    pathname.startsWith('/share') ||
    pathname === '/onboarding' ||
    pathname === '/'
  ) {
    return <>{children}</>
  }

  const isAgencyOrBusiness =
    pathname.startsWith('/agency') || pathname.startsWith('/business')

  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main
        className={cn(
          'flex-1 transition-all duration-300',
          collapsed ? 'md:ml-16' : 'md:ml-64',
          'pb-20 md:pb-0' // Space for bottom nav on mobile
        )}
      >
        {isAgencyOrBusiness && <ConnectReminderBanner />}
        {children}
      </main>
      <BottomNavMobile />
    </div>
  )
}

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  )
}
