'use client'

import { PageHeader } from '@/components/shared/PageHeader'
import { Card } from '@/lib/ui'
import { EmptyState } from '@/components/shared/EmptyState'
import { Star } from 'lucide-react'

/** UX-009: Reviews Inbox v1. UX-004: Empty state with CTA when no data. */
export default function BusinessReviewsPage() {
  const hasReviews = false // TODO: from API

  return (
    <div className="min-h-screen pb-24 md:pb-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Business', href: '/business/dashboard' },
          { label: 'Reviews' },
        ]}
        title="Reviews"
        subtitle="Manage and respond to reviews"
      />
      <div className="max-w-7xl mx-auto px-6 py-10">
        {hasReviews ? (
          <Card className="p-8 rounded-xl shadow-sm">
            <p className="text-muted-foreground">Filters, detail sheet, AI draft (UX-009) coming next.</p>
          </Card>
        ) : (
          <Card className="rounded-xl shadow-sm">
            <EmptyState variant="reviews" icon={Star} />
          </Card>
        )}
      </div>
    </div>
  )
}
