'use client'

import { StatCard } from '@/components/shared/StatCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { GuidedTasksPanel } from '@/components/guided-tasks/GuidedTasksPanel'
import { Card } from '@/lib/ui'
import { Button } from '@/lib/ui'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, BarChart3, ExternalLink, Download } from 'lucide-react'
import { useBrandTheme } from '@/components/branding/BrandThemeProvider'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardFilters, FilterState } from '@/components/dashboard/DashboardFilters'
import { useState, useMemo, useEffect, Suspense } from 'react'
import { useAuthSession } from '@/contexts/AuthSessionContext'
import { authenticatedFetch } from '@/lib/authenticated-fetch'
import { useToast } from '@/hooks/use-toast'

interface Client {
  id: string
  agency_id: string
  name: string
  slug: string
  tier: string
  status: string
  created_at: string
  updated_at: string
}

function AgencyDashboardContent() {
  const router = useRouter()
  const { theme } = useBrandTheme()
  const { activeOrgId, orgs, loading: sessionLoading } = useAuthSession()
  const brandColor = theme?.primary_color || '#2563eb'
  const [filters, setFilters] = useState<FilterState>({ dateRange: '30d' })

  const orgId = activeOrgId || orgs[0]?.id
  const tenantName = orgs.find((o) => o.id === orgId)?.name || theme?.tenant_name || 'Your Agency'
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Handle GBP OAuth callback redirect (user lands here after connecting)
  useEffect(() => {
    const gbp = searchParams.get('gbp')
    if (!gbp) return
    if (gbp === 'connected') {
      toast({ title: 'Google Business Profile connected', description: 'You can now sync name, address, and phone from GBP for your locations.' })
    } else if (gbp === 'error') {
      toast({ title: 'Connection failed', description: 'Could not connect Google Business Profile. Please try again.', variant: 'destructive' })
    }
    const url = new URL(window.location.href)
    url.searchParams.delete('gbp')
    window.history.replaceState({}, '', url.pathname + url.search)
  }, [searchParams, toast])

  const [clients, setClients] = useState<Client[]>([])
  const [locationCount, setLocationCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (sessionLoading || !orgId) {
      if (!sessionLoading && !orgId && orgs.length === 0) {
        setLoading(false)
        setError('No organization found. Please complete onboarding first.')
      }
      return
    }

    const controller = new AbortController()

    async function loadDashboardData() {
      try {
        setLoading(true)
        setError(null)
        const clientsRes = await authenticatedFetch(`/api/v1/tenants/${orgId}/clients`, {
          headers: { 'X-Tenant-ID': orgId },
          signal: controller.signal,
        })
        if (controller.signal.aborted) return
        if (!clientsRes.ok) throw new Error('Failed to load clients')
        const clientsData = await clientsRes.json()
        if (controller.signal.aborted) return
        const clientList: Client[] = clientsData?.clients || []
        setClients(clientList)

        if (clientList.length === 0) {
          setLocationCount(0)
        } else {
          const locationResList = await Promise.all(
            clientList.map((c) =>
              authenticatedFetch(`/api/v1/clients/${c.id}/locations`, { signal: controller.signal })
            )
          )
          if (controller.signal.aborted) return
          let total = 0
          for (const res of locationResList) {
            if (res.ok) {
              const data = await res.json()
              total += (data?.locations || []).length
            }
          }
          if (controller.signal.aborted) return
          setLocationCount(total)
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) return
        console.error('Failed to load dashboard data:', err)
        const message = err instanceof Error ? err.message : 'Failed to load dashboard'
        setError(typeof message === 'string' ? message : 'Failed to load dashboard')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadDashboardData()
    return () => controller.abort()
  }, [orgId, sessionLoading, orgs.length])

  const handleFixNow = (_clientId: string, _issue: string) => {
    // TODO: Navigate to specific issue resolution page
    // For now, navigate to business dashboard
    router.push('/business/dashboard')
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

  // Placeholder for Needs attention (Phase 1 - P3-06 will add real data)
  const needsAttentionClients = useMemo(() => [] as { id: string; name: string; issue: string; issueType: 'warning' | 'danger'; initial: string }[], [])

  const handleViewAsClient = (clientId: string) => {
    router.push(`/agency/clients/${clientId}`)
  }

  if (error) {
    return (
      <div className="min-h-screen pb-24 md:pb-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-destructive font-medium mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 md:pb-6">
      <PageHeader
        breadcrumbs={[{ label: 'Agency', href: '/agency/dashboard' }, { label: 'Dashboard' }]}
        title="Agency Dashboard"
        subtitle={tenantName ? `${tenantName} — Overview of your clients and locations` : 'Overview of your clients and locations'}
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
            title="Clients"
            bigNumber={loading ? '—' : clients.length}
            subtext="Active clients"
            color="green"
          />
          <StatCard
            title="Locations"
            bigNumber={loading ? '—' : locationCount ?? '—'}
            subtext="Total locations"
            color="green"
          />
          <StatCard
            title="Needs Attention"
            bigNumber="0"
            subtext="Coming soon"
            color="yellow"
          />
          <StatCard
            title="Churn Watch"
            bigNumber="0"
            subtext="Coming soon"
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
                <p className="text-sm text-rose-800 dark:text-rose-200 leading-relaxed">
                  Coming soon. Track clients at risk of churning.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-medium text-base tracking-tight">Average Rating</h3>
              <div className="flex items-center gap-2">
                <span className="text-4xl font-semibold tracking-tight">—</span>
                <span className="text-3xl">⭐</span>
              </div>
            </div>
            <p className="text-xs text-black/60 dark:text-white/60 leading-relaxed">Coming soon. Aggregate rating across client locations.</p>
          </Card>
        </div>

        <Card className="rounded-xl shadow-sm mb-10">
          <div className="px-6 py-5 border-b border-black/5 dark:border-white/10">
            <h2 className="text-xl font-medium tracking-tight">Needs attention</h2>
          </div>
          <div className="divide-y divide-black/5 dark:divide-white/10">
            {needsAttentionClients.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No items need attention right now. (Coming in a future release.)
              </div>
            ) : (
              needsAttentionClients.map((client) => (
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
              ))
            )}
          </div>
        </Card>

        <Card className="rounded-xl shadow-sm">
          <div className="px-6 py-5 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
            <h2 className="text-xl font-medium tracking-tight">Your Clients</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/agency/clients')}
              style={{ borderColor: brandColor, color: brandColor }}
              className="font-medium"
            >
              View all
            </Button>
          </div>
          <div className="divide-y divide-black/5 dark:divide-white/10">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Loading clients…</div>
            ) : clients.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No clients yet.{' '}
                <button
                  type="button"
                  onClick={() => router.push('/agency/clients')}
                  className="underline hover:no-underline font-medium"
                  style={{ color: brandColor }}
                >
                  Add your first client
                </button>
              </div>
            ) : (
              clients.slice(0, 5).map((client) => (
                <div
                  key={client.id}
                  className="p-5 hover:bg-black/[0.02] dark:hover:bg-white/[0.05] transition-colors group"
                >
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0"
                        style={{ backgroundColor: brandColor }}
                      >
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-medium text-base tracking-tight">{client.name}</h3>
                        <p className="text-sm text-black/60 dark:text-white/60">
                          {client.slug} • {client.tier}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewAsClient(client.id)}
                      className="flex items-center gap-2 h-9 px-4 font-medium text-sm border-2 hover:border-opacity-80 transition-all shadow-sm hover:shadow opacity-0 group-hover:opacity-100 md:opacity-100"
                      style={{ borderColor: brandColor, color: brandColor }}
                    >
                      View
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default function AgencyDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading…</div></div>}>
      <AgencyDashboardContent />
    </Suspense>
  )
}
