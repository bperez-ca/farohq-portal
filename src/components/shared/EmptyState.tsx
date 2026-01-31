'use client'

import Link from 'next/link'
import { Button } from '@/lib/ui'
import { LucideIcon } from 'lucide-react'

/** UX-004: Empty states that sell the next click. */
export type EmptyStateVariant = 'inbox' | 'reviews' | 'presence' | 'revenue'

const DEFAULT_CONFIG: Record<
  EmptyStateVariant,
  { title: string; description: string; primary: { label: string; href: string }; secondary?: { label: string; href: string } }
> = {
  inbox: {
    title: 'No conversations yet',
    description: 'Connect Google Business Profile or reply to your first lead to get started.',
    primary: { label: 'Connect Google Business Profile', href: '/agency/settings/branding' },
    secondary: { label: 'Go to Inbox', href: '/business/inbox' },
  },
  reviews: {
    title: 'No reviews yet',
    description: 'Request your first review or connect Google to sync existing reviews.',
    primary: { label: 'Request your first review', href: '/business/reviews' },
    secondary: { label: 'Connect Google', href: '/agency/settings/branding' },
  },
  presence: {
    title: 'No listings connected',
    description: 'Sync your first listing or connect Google Business Profile to manage your presence.',
    primary: { label: 'Connect GBP', href: '/agency/settings/branding' },
    secondary: { label: 'Manage listings', href: '/business/presence' },
  },
  revenue: {
    title: 'No revenue tracked yet',
    description: 'Connect your booking tool or log your first job to see revenue here.',
    primary: { label: 'Connect booking tool', href: '/business/settings/profile' },
    secondary: { label: 'View Insights', href: '/business/insights' },
  },
}

interface EmptyStateProps {
  variant: EmptyStateVariant
  title?: string
  description?: string
  primaryCTA?: { label: string; href: string }
  secondaryCTA?: { label: string; href: string }
  icon?: LucideIcon
}

export function EmptyState({
  variant,
  title,
  description,
  primaryCTA,
  secondaryCTA,
  icon: Icon,
}: EmptyStateProps) {
  const config = DEFAULT_CONFIG[variant]
  const displayTitle = title ?? config.title
  const displayDesc = description ?? config.description
  const primary = primaryCTA ?? config.primary
  const secondary = secondaryCTA ?? config.secondary

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="mb-4 p-4 rounded-full bg-muted">
          <Icon className="w-10 h-10 text-muted-foreground" />
        </div>
      )}
      <h2 className="text-lg font-semibold mb-2">{displayTitle}</h2>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{displayDesc}</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild>
          <Link href={primary.href}>{primary.label}</Link>
        </Button>
        {secondary && (
          <Button variant="outline" asChild>
            <Link href={secondary.href}>{secondary.label}</Link>
          </Button>
        )}
      </div>
    </div>
  )
}
