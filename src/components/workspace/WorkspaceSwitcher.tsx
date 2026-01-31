'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Building2, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'

/** UX-006: Workspace switcher Agency ↔ Business; preserve context (return to equivalent page). */
const LAST_AGENCY_PATH = 'farohq_last_agency_path'

const AGENCY_TO_BUSINESS: Record<string, string> = {
  '/agency/dashboard': '/business/dashboard',
  '/agency/leads': '/business/inbox',
  '/agency/diagnostics': '/business/insights',
  '/agency/kpis': '/business/insights',
}

function getBusinessEquivalent(agencyPath: string): string {
  for (const [agency, business] of Object.entries(AGENCY_TO_BUSINESS)) {
    if (agencyPath === agency || agencyPath.startsWith(agency + '/')) {
      return business
    }
  }
  return '/business/dashboard'
}

function getAgencyEquivalent(businessPath: string): string {
  const inverted: Record<string, string> = {}
  for (const [a, b] of Object.entries(AGENCY_TO_BUSINESS)) {
    inverted[b] = a
  }
  for (const [business, agency] of Object.entries(inverted)) {
    if (businessPath === business || businessPath.startsWith(business + '/')) {
      return agency
    }
  }
  return '/agency/dashboard'
}

export function WorkspaceSwitcher() {
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const isAgency = pathname.startsWith('/agency')
  const isBusiness = pathname.startsWith('/business')

  if (!isAgency && !isBusiness) return null

  const switchToBusiness = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(LAST_AGENCY_PATH, pathname)
    }
    router.push(getBusinessEquivalent(pathname))
  }

  const switchToAgency = () => {
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem(LAST_AGENCY_PATH) : null
    const target = saved || getAgencyEquivalent(pathname) || '/agency/dashboard'
    router.push(target)
  }

  return (
    <div className="px-3 py-2 border-t border-black/5 dark:border-white/10">
      <div className="flex rounded-lg bg-muted/50 p-1" role="group" aria-label="Workspace">
        {isAgency ? (
          <>
            <span
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium',
                'bg-background shadow-sm text-foreground'
              )}
            >
              <Building2 className="w-3.5 h-3.5" />
              Agency
            </span>
            <button
              type="button"
              onClick={switchToBusiness}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Business
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={switchToAgency}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5" />
              Agency
            </button>
            <span
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium',
                'bg-background shadow-sm text-foreground'
              )}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Business
            </span>
          </>
        )}
      </div>
    </div>
  )
}
