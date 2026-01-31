'use client'

import { PageHeader } from '@/components/shared/PageHeader'
import { Card } from '@/lib/ui'
import Link from 'next/link'

export default function AgencyDiagnosticsPage() {
  return (
    <div className="min-h-screen pb-24 md:pb-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Agency', href: '/agency/dashboard' },
          { label: 'Diagnostics' },
        ]}
        title="Diagnostics"
        subtitle="Growth reports and share links"
      />
      <div className="max-w-7xl mx-auto px-6 py-10">
        <Card className="p-8 rounded-xl shadow-sm">
          <p className="text-muted-foreground mb-4">
            Diagnostics table. Create, share, track views. Link to shared diagnostic (e.g. /share/diagnostic/demo).
          </p>
          <Link href="/share/diagnostic/demo" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            View demo diagnostic
          </Link>
        </Card>
      </div>
    </div>
  )
}
