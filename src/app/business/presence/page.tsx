'use client'

import { PageHeader } from '@/components/shared/PageHeader'
import { Card } from '@/lib/ui'
import { Button } from '@/lib/ui'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusChip } from '@/components/ui/StatusChip'
import { mockPresence } from '@/lib/mock-data'
import { useBrandTheme } from '@/components/branding/BrandThemeProvider'
import { MapPin, RefreshCw } from 'lucide-react'
import Link from 'next/link'

/** UX-011: Presence v1 — platform table, Sync all, fix flows. UX-004: Empty state when no platforms. */
export default function BusinessPresencePage() {
  const { theme } = useBrandTheme()
  const brandColor = theme?.primary_color || '#2563eb'
  const platforms = mockPresence

  if (platforms.length === 0) {
    return (
      <div className="min-h-screen pb-24 md:pb-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Business', href: '/business/dashboard' },
            { label: 'Presence' },
          ]}
          title="Presence"
          subtitle="Manage listings across platforms"
        />
        <div className="max-w-7xl mx-auto px-6 py-10">
          <Card className="rounded-xl shadow-sm">
            <EmptyState variant="presence" icon={MapPin} />
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 md:pb-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Business', href: '/business/dashboard' },
          { label: 'Presence' },
        ]}
        title="Presence"
        subtitle="Manage listings across platforms"
        actions={
          <Button
            size="sm"
            className="hidden md:inline-flex gap-2"
            style={{ backgroundColor: brandColor }}
          >
            <RefreshCw className="w-4 h-4" />
            Sync all
          </Button>
        }
      />
      <div className="max-w-7xl mx-auto px-6 py-10">
        <Card className="rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/5 dark:border-white/10">
                  <th className="text-left py-4 px-6 font-medium">Platform</th>
                  <th className="text-left py-4 px-6 font-medium">Status</th>
                  <th className="text-right py-4 px-6 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {platforms.map((p, i) => (
                  <tr
                    key={i}
                    className="border-b border-black/5 dark:border-white/10 last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.05]"
                  >
                    <td className="py-4 px-6 font-medium">{p.platform}</td>
                    <td className="py-4 px-6">
                      <StatusChip variant={p.status} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      {p.status !== 'synced' && (
                        <Link
                          href="/agency/settings/branding"
                          className="text-sm font-medium hover:underline text-blue-600 dark:text-blue-400"
                          style={{ color: brandColor }}
                        >
                          Fix
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
