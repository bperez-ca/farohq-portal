'use client'

import { PageHeader } from '@/components/shared/PageHeader'
import { GuidedTasksPanel } from '@/components/guided-tasks/GuidedTasksPanel'
import { Card } from '@/lib/ui'
import { Button } from '@/lib/ui'
import { Badge } from '@/components/ui/badge'
import { StatusChip } from '@/components/ui/StatusChip'
import { mockBusinesses, mockPresence } from '@/lib/mock-data'
import { useBrandTheme } from '@/components/branding/BrandThemeProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  MessageSquare,
  Star,
  MapPin,
  DollarSign,
  ArrowRight,
  ExternalLink,
  TrendingUp,
} from 'lucide-react'

/** UX-008: Business Dashboard — 4 KPI cards + 2 primary CTAs. */
export default function BusinessDashboardPage() {
  const router = useRouter()
  const { theme } = useBrandTheme()
  const brandColor = theme?.primary_color || '#2563eb'
  const business = mockBusinesses[0]

  return (
    <div className="min-h-screen pb-24 md:pb-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Business', href: '/business/dashboard' },
          { label: 'Dashboard' },
        ]}
        title={business.name}
        subtitle="Your business performance at a glance"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/agency/dashboard">
              <Button variant="outline" size="sm" className="hidden md:inline-flex gap-2">
                View as agency
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Button
              size="sm"
              className="hidden md:inline-flex gap-2"
              style={{ backgroundColor: brandColor }}
              onClick={() => router.push('/business/insights')}
            >
              <TrendingUp className="w-4 h-4" />
              View Insights
            </Button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <GuidedTasksPanel />
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-muted-foreground">New Leads</h3>
              </div>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200">
                {business.newLeads} waiting
              </Badge>
            </div>
            <div className="text-4xl md:text-5xl font-bold mb-3">{business.newLeads}</div>
            <p className="text-sm text-muted-foreground mb-6">Reply fast to close more deals</p>
            <Button
              className="w-full"
              style={{ backgroundColor: brandColor }}
              onClick={() => router.push('/business/inbox')}
            >
              Reply now
            </Button>
          </Card>

          <Card className="p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-muted-foreground">Your Rating</h3>
              </div>
              <StatusChip variant="success" label={`+${business.ratingChange}`} />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-4xl md:text-5xl font-bold">{business.rating}</span>
              <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="text-sm text-muted-foreground mb-6">Great job keeping customers happy</p>
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full hover:bg-accent"
                style={{ color: brandColor }}
                onClick={() => router.push('/business/reviews')}
              >
                Go to reviews
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                className="w-full"
                style={{ backgroundColor: brandColor }}
                onClick={() => router.push('/business/reviews')}
              >
                Request a review
              </Button>
            </div>
          </Card>

          <Card className="p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-muted-foreground">Be Found Online</h3>
              </div>
            </div>
            <div className="space-y-3 mb-3">
              {mockPresence.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.platform}</span>
                  <div className="flex items-center gap-2">
                    <StatusChip variant={item.status} />
                    {item.status !== 'synced' && (
                      <button
                        type="button"
                        className="text-sm font-medium hover:underline text-blue-600 dark:text-blue-400"
                        style={{ color: brandColor }}
                        onClick={() => router.push('/business/presence')}
                      >
                        Fix
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mb-6">Keep your listings accurate everywhere</p>
            <Button
              className="w-full"
              style={{ backgroundColor: brandColor }}
              onClick={() => router.push('/business/presence')}
            >
              Manage listings
            </Button>
          </Card>

          <Card className="p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-muted-foreground">Booked this week</h3>
              </div>
            </div>
            <div className="text-4xl md:text-5xl font-bold mb-3">
              ${(business.closedRevenue / 1000).toFixed(1)}K
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              {business.bookedJobs} jobs · ${business.avgTicket} avg ticket
            </p>
            <Button
              variant="ghost"
              className="w-full hover:bg-accent"
              style={{ color: brandColor }}
              onClick={() => router.push('/business/revenue')}
            >
              See full breakdown
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
