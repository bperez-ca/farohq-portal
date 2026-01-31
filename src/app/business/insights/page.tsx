'use client'

import { PageHeader } from '@/components/shared/PageHeader'
import { Card } from '@/lib/ui'
import Link from 'next/link'

export default function BusinessInsightsPage() {
  return (
    <div className="min-h-screen pb-24 md:pb-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Business', href: '/business/dashboard' },
          { label: 'Insights' },
        ]}
        title="Insights"
        subtitle="Analytics and trends"
      />
      <div className="max-w-7xl mx-auto px-6 py-10">
        <Card className="p-8 rounded-xl shadow-sm">
          <p className="text-muted-foreground">
            Insights. Deep analytics coming next.
          </p>
          <Link href="/business/dashboard" className="mt-4 inline-block text-primary hover:underline">
            Back to Dashboard
          </Link>
        </Card>
      </div>
    </div>
  )
}
