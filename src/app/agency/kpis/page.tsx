'use client'

import { PageHeader } from '@/components/shared/PageHeader'
import { Card } from '@/lib/ui'
import Link from 'next/link'

export default function AgencyKpisPage() {
  return (
    <div className="min-h-screen pb-24 md:pb-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Agency', href: '/agency/dashboard' },
          { label: 'KPIs' },
        ]}
        title="KPIs"
        subtitle="Aggregate metrics and client performance"
      />
      <div className="max-w-7xl mx-auto px-6 py-10">
        <Card className="p-8 rounded-xl shadow-sm">
          <p className="text-muted-foreground mb-4">
            KPIs dashboard. Aggregate metrics, client comparison, export CSV coming next.
          </p>
          <Link href="/agency/dashboard" className="text-primary hover:underline">
            Back to Dashboard
          </Link>
        </Card>
      </div>
    </div>
  )
}
