'use client'

import { PageHeader } from '@/components/shared/PageHeader'
import { Card } from '@/lib/ui'
import { EmptyState } from '@/components/shared/EmptyState'
import { DollarSign } from 'lucide-react'

/** UX-004: Empty state with CTA when no revenue data. */
export default function BusinessRevenuePage() {
  const hasRevenue = false // TODO: from API

  return (
    <div className="min-h-screen pb-24 md:pb-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Business', href: '/business/dashboard' },
          { label: 'Revenue' },
        ]}
        title="Revenue"
        subtitle="Leads and booked revenue"
      />
      <div className="max-w-7xl mx-auto px-6 py-10">
        {hasRevenue ? (
          <Card className="p-8 rounded-xl shadow-sm">
            <p className="text-muted-foreground">Leads vs revenue chart coming next.</p>
          </Card>
        ) : (
          <Card className="rounded-xl shadow-sm">
            <EmptyState variant="revenue" icon={DollarSign} />
          </Card>
        )}
      </div>
    </div>
  )
}
