'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Card } from '@/lib/ui'
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react'

/** UX-003: First-session Guided Tasks — 3–5 items, persistent, localStorage. */

// Business-specific tasks (shown on /business/* routes)
const BUSINESS_TASKS = [
  { id: 'lead', label: 'Respond to 1 lead', href: '/business/inbox' },
  { id: 'review', label: 'Reply to 1 review', href: '/business/reviews' },
  { id: 'request', label: 'Request 1 review', href: '/business/reviews' },
  { id: 'listing', label: 'Fix 1 listing', href: '/business/presence' },
] as const

// Agency-specific tasks (shown on /agency/* routes)
const AGENCY_TASKS = [
  { id: 'gbp', label: 'Connect Google Business Profile', href: '/agency/settings/branding' },
  { id: 'invite', label: 'Invite your first client', href: '/agency/settings/invites' },
  { id: 'branding', label: 'Customize your branding', href: '/agency/settings/branding' },
] as const

const STORAGE_KEY = 'farohq_guided_tasks_done'

function getDoneSet(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as string[]
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

function setDone(id: string, done: boolean) {
  const set = getDoneSet()
  if (done) set.add(id)
  else set.delete(id)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)))
  } catch {}
}

export function GuidedTasksPanel() {
  const pathname = usePathname()
  const [done, setDoneState] = useState<Set<string>>(new Set())
  const [collapsed, setCollapsed] = useState(false)

  // Determine which tasks to show based on current route
  const isBusinessRoute = pathname?.startsWith('/business')
  const isAgencyRoute = pathname?.startsWith('/agency')
  const TASKS = isBusinessRoute ? BUSINESS_TASKS : isAgencyRoute ? AGENCY_TASKS : BUSINESS_TASKS

  useEffect(() => {
    setDoneState(getDoneSet())
  }, [])

  const toggle = (id: string) => {
    const next = !done.has(id)
    setDone(id, next)
    setDoneState(getDoneSet())
  }

  const incomplete = TASKS.filter((t) => !done.has(t.id))
  if (incomplete.length === 0) return null

  return (
    <Card className="rounded-[var(--border-radius-card-default)] shadow-sm overflow-hidden mb-6">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.05] transition-colors"
        onClick={() => setCollapsed((c) => !c)}
      >
        <span className="font-medium text-sm">What&apos;s next?</span>
        {collapsed ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {!collapsed && (
        <div className="px-4 pb-4 space-y-2">
          {TASKS.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-2 text-sm"
            >
              <button
                type="button"
                onClick={() => toggle(t.id)}
                className="flex-shrink-0 text-muted-foreground hover:text-foreground"
                aria-label={done.has(t.id) ? 'Mark incomplete' : 'Mark done'}
              >
                {done.has(t.id) ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
              </button>
              {done.has(t.id) ? (
                <span className="text-muted-foreground line-through">{t.label}</span>
              ) : (
                <Link href={t.href} className="text-primary hover:underline">
                  {t.label}
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
