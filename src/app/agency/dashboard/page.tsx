'use client'

import { StatCard } from '@/components/shared/StatCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { GuidedTasksPanel } from '@/components/guided-tasks/GuidedTasksPanel'
import { Card } from '@/lib/ui'
import { Button } from '@/lib/ui'
import { mockAgencyStats, mockBusinesses } from '@/lib/mock-data'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, BarChart3, ExternalLink, Download } from 'lucide-react'
import { useBrandTheme } from '@/components/branding/BrandThemeProvider'
import { useRouter } from 'next/navigation'
import { DashboardFilters, FilterState } from '@/components/dashboard/DashboardFilters'
import { useState, useMemo } from 'react'

export default function AgencyDashboardPage() {
  const router = useRouter()
  const { theme } = useBrandTheme()
  const brandColor = theme?.primary_color || '#2563eb'
  const [filters, setFilters] = useState<FilterState>({ dateRange: '30d' })

  const handleViewAsClient = (_clientId: string) => {
    // TODO: Navigate to specific client dashboard when implemented
    router.push('/business/dashboard')
  }

  const handleFixNow = (_clientId: string, _issue: string) => {
    // TODO: Navigate to specific issue resolution page
    // For now, navigate to business dashboard
    router.push('/business/dashboard')
  }

  const handlePlaybookClick = () => {
    console.log('TODO: Open playbook')
  }

  const handleExportPDF = () => {
    // TODO: Implement PDF export using jspdf or react-pdf
    console.log('Exporting to PDF with filters:', filters)
    // For now, just log - will implement with jspdf later
    alert('PDF export coming soon!')
  }

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    // TODO: Refetch data with new filters when API is ready
    // This should trigger a server-side data fetch or client-side API call
  }

  // Memoize needs attention clients to avoid recalculation on re-renders
  const needsAttentionClients = useMemo(
    () => [
      { id: '1', name: "Joe's Pizza Downtown", issue: 'Slow Reply', issueType: 'warning' as const, initial: 'J' },
      { id: '2', name: "Bella's Hair Salon", issue: 'Low Reviews', issueType: 'danger' as const, initial: 'B' },
      { id: '3', name: 'Peak HVAC Services', issue: 'Listing Outdated', issueType: 'warning' as const, initial: 'P' },
    ],
    []
  )

  // TODO: When API is ready, replace mock data with:
  // - Server-side data fetching using Next.js App Router
  // - Parallel data fetching for KPIs and client list
  // - Pagination for client list (initial 20, load more)
  // - API response caching (15min TTL)

  return (
    <div className="min-h-screen pb-24 md:pb-6">
      <PageHeader
        breadcrumbs={[{ label: 'Agency', href: '/agency/dashboard' }, { label: 'Dashboard' }]}
        title="Agency Dashboard"
        subtitle="Overview of all your clients and their performance"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleExportPDF}
              className="hidden md:flex items-center gap-2 h-10 px-4 font-medium text-sm border-2 shadow-sm hover:shadow transition-all"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
            <Button
              onClick={() => router.push('/agency/kpis')}
              style={{ backgroundColor: brandColor }}
              className="text-white hover:opacity-95 transition-all focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hidden md:flex items-center gap-2 h-10 px-4 font-medium text-sm shadow-md hover:shadow-lg"
            >
              <BarChart3 className="w-4 h-4" />
              View KPIs
            </Button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-6 py-10">
        <GuidedTasksPanel />
        <DashboardFilters onFilterChange={handleFilterChange} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
          <StatCard
            title="Pipeline"
            bigNumber={mockAgencyStats.totalPipeline}
            subtext="Total active leads"
            color="green"
          />
          <StatCard
            title="Needs Attention"
            bigNumber={mockAgencyStats.needsAttention}
            subtext="Leads waiting"
            color="yellow"
          />
          <StatCard
            title="Average Rating"
            bigNumber={`${mockAgencyStats.avgRating} ★`}
            subtext={`${mockAgencyStats.avgRatingChange >= 0 ? '+' : ''}${mockAgencyStats.avgRatingChange} across clients`}
            color={
              mockAgencyStats.avgRatingChange > 0
                ? 'green'
                : mockAgencyStats.avgRatingChange <= -1
                  ? 'red'
                  : 'yellow'
            }
          />
          <StatCard
            title="Churn Watch"
            bigNumber={mockAgencyStats.churnWatch}
            subtext="Clients declining"
            color="red"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-5 mb-10">
          <Card className="p-6 rounded-xl shadow-sm border-rose-100 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-900/20">
            <div className="flex items-start gap-5">
              <div className="p-2.5 rounded-lg bg-rose-100 dark:bg-rose-900/40 flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-base text-rose-900 dark:text-rose-100 mb-2 tracking-tight">Churn Watch</h3>
                <p className="text-sm text-rose-800 dark:text-rose-200 mb-4 leading-relaxed">
                  3 clients dropped below 10 replies in 24h. Reach out before they blame &quot;marketing not working&quot;.
                </p>
                <Button
                  onClick={handlePlaybookClick}
                  variant="ghost"
                  size="sm"
                  className="text-sm font-medium h-8 px-3 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-blue-600 dark:text-blue-400"
                  style={{ color: brandColor }}
                >
                  Open Playbook →
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-medium text-base tracking-tight">Average Rating</h3>
              <div className="flex items-center gap-2">
                <span className="text-4xl font-semibold tracking-tight">4.6</span>
                <span className="text-3xl">⭐</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 mb-5">
              <span className="text-lg">↗</span>
              <span className="font-medium">+0.3 this month</span>
            </div>
            <div className="flex gap-1.5 h-8 mb-3">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-blue-100 dark:bg-blue-900/30 rounded-md"
                  style={{ opacity: 0.3 + i * 0.1 }}
                />
              ))}
            </div>
            <p className="text-xs text-black/60 dark:text-white/60 leading-relaxed">Keep asking for reviews after completed jobs.</p>
          </Card>
        </div>

        <Card className="rounded-xl shadow-sm mb-10">
          <div className="px-6 py-5 border-b border-black/5 dark:border-white/10">
            <h2 className="text-xl font-medium tracking-tight">Needs attention</h2>
          </div>
          <div className="divide-y divide-black/5 dark:divide-white/10">
            {needsAttentionClients.map((client) => (
              <div
                key={client.id}
                className="p-5 flex items-center justify-between hover:bg-black/[0.02] dark:hover:bg-white/[0.05] transition-colors group"
              >
                <div className="flex items-center gap-5">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: brandColor }}
                  >
                    {client.initial}
                  </div>
                  <div>
                    <div className="font-medium text-base mb-1.5 tracking-tight">{client.name}</div>
                    <Badge
                      variant="outline"
                      className={
                        client.issueType === 'danger'
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900 text-xs font-medium'
                          : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-900 text-xs font-medium'
                      }
                    >
                      {client.issue}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-4 font-medium text-sm border-2 hover:border-opacity-80 transition-all shadow-sm hover:shadow"
                  style={{ 
                    borderColor: brandColor,
                    color: brandColor,
                  }}
                  onClick={() => handleFixNow(client.id, client.issue)}
                >
                  Fix now
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-xl shadow-sm">
          <div className="px-6 py-5 border-b border-black/5 dark:border-white/10">
            <h2 className="text-xl font-medium tracking-tight">Your Clients</h2>
          </div>
          <div className="divide-y divide-black/5 dark:divide-white/10">
            {mockBusinesses.map((business) => (
              <div
                key={business.id}
                className="p-5 hover:bg-black/[0.02] dark:hover:bg-white/[0.05] transition-colors group"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-medium text-base tracking-tight">{business.name}</h3>
                      <Badge variant="outline" className="dark:border-slate-600 text-xs font-medium">
                        {business.industry}
                      </Badge>
                    </div>
                    <p className="text-sm text-black/60 dark:text-white/60 mb-5 leading-relaxed">
                      {business.city} • {business.phone}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                      <div>
                        <div className="text-xs text-black/60 dark:text-white/60 mb-1.5 font-medium">Rating</div>
                        <div className="font-medium text-base">
                          {business.rating} ★
                          <span className="text-xs text-green-600 dark:text-green-400 ml-1.5 font-medium">
                            +{business.ratingChange}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-black/60 dark:text-white/60 mb-1.5 font-medium">New Leads</div>
                        <div className="font-medium text-base">{business.newLeads}</div>
                      </div>
                      <div>
                        <div className="text-xs text-black/60 dark:text-white/60 mb-1.5 font-medium">Revenue</div>
                        <div className="font-medium text-base">${(business.closedRevenue / 1000).toFixed(1)}K</div>
                      </div>
                      <div>
                        <div className="text-xs text-black/60 dark:text-white/60 mb-1.5 font-medium">Reply Time</div>
                        <div className="font-medium text-base">{business.avgReplyTime}m</div>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewAsClient(business.id)}
                    className="flex items-center gap-2 h-9 px-4 font-medium text-sm border-2 hover:border-opacity-80 transition-all shadow-sm hover:shadow opacity-0 group-hover:opacity-100"
                    style={{ 
                      borderColor: brandColor,
                      color: brandColor,
                    }}
                  >
                    View as client
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
