'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/lib/ui'
import { X } from 'lucide-react'

/** UX-002: Reminder banner when user skipped "Connect channels" — dismissible. */
const SKIPPED_KEY = 'farohq_connect_skipped'
const DISMISSED_KEY = 'farohq_connect_reminder_dismissed'

export function ConnectReminderBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const skipped = localStorage.getItem(SKIPPED_KEY) === 'true'
    const dismissed = localStorage.getItem(DISMISSED_KEY) === 'true'
    setShow(skipped && !dismissed)
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-900/50 px-4 py-3 flex items-center justify-between gap-4">
      <p className="text-sm text-amber-800 dark:text-amber-200">
        Complete setup: connect Google Business Profile &amp; WhatsApp to sync leads and reviews.
      </p>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link href="/agency/settings/branding">
          <Button size="sm" variant="outline" className="border-amber-300 dark:border-amber-700">
            Connect now
          </Button>
        </Link>
        <button
          type="button"
          onClick={dismiss}
          className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-300"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
