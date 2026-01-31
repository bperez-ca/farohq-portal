'use client'

import { PageHeader } from '@/components/shared/PageHeader'
import { Card } from '@/lib/ui'
import { EmptyState } from '@/components/shared/EmptyState'
import { Inbox } from 'lucide-react'

/** UX-010: Inbox/Leads v1. UX-004: Empty state with CTA when no data. */
export default function BusinessInboxPage() {
  const hasConversations = false // TODO: from API

  return (
    <div className="min-h-screen pb-24 md:pb-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Business', href: '/business/dashboard' },
          { label: 'Inbox' },
        ]}
        title="Inbox"
        subtitle="Unified lead conversations"
      />
      <div className="max-w-7xl mx-auto px-6 py-10">
        {hasConversations ? (
          <Card className="p-8 rounded-xl shadow-sm">
            <p className="text-muted-foreground">3-column layout + quick actions (UX-010) coming next.</p>
          </Card>
        ) : (
          <Card className="rounded-xl shadow-sm">
            <EmptyState variant="inbox" icon={Inbox} />
          </Card>
        )}
      </div>
    </div>
  )
}
