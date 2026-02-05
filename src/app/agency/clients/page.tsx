'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, Button, Badge } from '@/lib/ui'
import { useBrandTheme } from '@/components/branding/BrandThemeProvider'
import { Loader2, Building2, ChevronRight, Plus, Zap } from 'lucide-react'
import { authenticatedFetch } from '@/lib/authenticated-fetch'
import { useAuthSession } from '@/contexts/AuthSessionContext'
import { AddClientFlow } from '@/components/agency/AddClientFlow'
import { ActivateClientModal } from '@/components/agency/ActivateClientModal'

interface Client {
  id: string
  agency_id: string
  name: string
  slug: string
  tier: string
  status: string
  lifecycle?: string
  layer?: string | null
  created_at: string
  updated_at: string
}

export default function AgencyClientsPage() {
  const router = useRouter()
  const { theme } = useBrandTheme()
  const { activeOrgId, orgs, loading: sessionLoading } = useAuthSession()
  const brandColor = theme?.primary_color || '#2563eb'
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [activateClient, setActivateClient] = useState<Client | null>(null)

  // Stable orgId: use activeOrgId or first org - avoids duplicate fetches when activeOrgId is set asynchronously
  const orgId = activeOrgId || orgs[0]?.id

  useEffect(() => {
    if (sessionLoading) return

    if (!orgId || orgs.length === 0) {
      setError('No organization found. Please complete onboarding first.')
      setLoading(false)
      return
    }

    const controller = new AbortController()

    async function loadClients() {
      try {
        setLoading(true)
        setError(null)
        const res = await authenticatedFetch(`/api/v1/tenants/${orgId}/clients`, {
          headers: { 'X-Tenant-ID': orgId },
          signal: controller.signal,
        })
        if (controller.signal.aborted) return
        if (!res.ok) throw new Error('Failed to load clients')
        const data = await res.json()
        if (controller.signal.aborted) return
        setClients(data?.clients || [])
      } catch (err: unknown) {
        if (controller.signal.aborted) return
        console.error('Failed to load clients:', err)
        const message = err instanceof Error ? err.message : 'Failed to load clients'
        setError(typeof message === 'string' ? message : 'Failed to load clients')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    loadClients()
    return () => controller.abort()
  }, [orgId, sessionLoading, orgs.length])

  const refreshClients = useCallback(async () => {
    if (!orgId) return
    try {
      const res = await authenticatedFetch(`/api/v1/tenants/${orgId}/clients`, {
        headers: { 'X-Tenant-ID': orgId },
      })
      if (res.ok) {
        const data = await res.json()
        setClients(data?.clients || [])
      }
    } catch {
      // keep existing list
    }
  }, [orgId])

  const handleViewClient = (clientId: string) => {
    router.push(`/agency/clients/${clientId}`)
  }

  const openAddDialog = () => setAddDialogOpen(true)

  if (sessionLoading || loading) {
    return (
      <div className="min-h-screen pb-24 md:pb-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading clients...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 md:pb-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Agency', href: '/agency/dashboard' },
          { label: 'Clients' },
        ]}
        title="Clients"
        subtitle="Manage your agency clients"
        actions={
          <div className="flex gap-2">
            {!error && orgId && (
              <Button
                onClick={openAddDialog}
                style={{ backgroundColor: brandColor }}
                className="text-white h-10 px-4 font-medium text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Client
              </Button>
            )}
            <Button
              onClick={() => router.push('/agency/dashboard')}
              variant="outline"
              className="h-10 px-4 font-medium text-sm"
            >
              Back to Dashboard
            </Button>
          </div>
        }
      />

      <div className="max-w-4xl mx-auto px-6 py-10">
        {error && (
          <Card className="p-6 mb-6 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20">
            <p className="text-red-700 dark:text-red-300">{error}</p>
            <Button
              variant="outline"
              onClick={() => router.push('/onboarding')}
              className="mt-4"
            >
              Go to Onboarding
            </Button>
          </Card>
        )}

        {!error && clients.length === 0 && (
          <Card className="p-12 text-center">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium text-lg mb-2">No clients yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Add your first client to get started.
            </p>
            <Button
              onClick={openAddDialog}
              style={{ backgroundColor: brandColor }}
              className="text-white"
            >
              Add First Client
            </Button>
          </Card>
        )}

        {!error && clients.length > 0 && (
          <Card className="rounded-xl shadow-sm">
            <div className="px-6 py-5 border-b border-black/5 dark:border-white/10">
              <h2 className="text-xl font-medium tracking-tight">Your Clients</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {clients.length} client{clients.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="divide-y divide-black/5 dark:divide-white/10">
              {clients.map((client) => {
                const isLead = client.lifecycle === 'lead' || !client.lifecycle
                return (
                  <div
                    key={client.id}
                    className="p-5 flex items-center justify-between hover:bg-black/[0.02] dark:hover:bg-white/[0.05] transition-colors group"
                  >
                    <div
                      className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleViewClient(client.id)}
                    >
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium text-lg flex-shrink-0"
                        style={{ backgroundColor: brandColor }}
                      >
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-base mb-1">{client.name}</div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span className="font-mono">{client.slug}</span>
                          <Badge variant="outline" className="text-xs">
                            {client.tier}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={
                              isLead
                                ? 'text-amber-700 dark:text-amber-400 border-amber-200'
                                : 'text-green-700 dark:text-green-400 border-green-200'
                            }
                          >
                            {isLead ? 'Lead' : 'Active'}
                          </Badge>
                          {!isLead && client.layer && (
                            <Badge variant="secondary" className="text-xs capitalize">
                              {client.layer}
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={
                              client.status === 'active'
                                ? 'text-green-700 dark:text-green-400 border-green-200'
                                : 'text-muted-foreground'
                            }
                          >
                            {client.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isLead && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setActivateClient(client)
                          }}
                          style={{ backgroundColor: brandColor }}
                          className="text-white"
                        >
                          <Zap className="w-4 h-4 mr-1" />
                          Activate
                        </Button>
                      )}
                      <button
                        type="button"
                        className="p-1 text-muted-foreground hover:text-foreground"
                        onClick={() => handleViewClient(client.id)}
                        aria-label="View client"
                      >
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        <AddClientFlow
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          orgId={orgId!}
          onSuccess={refreshClients}
          brandColor={brandColor}
        />
        {activateClient && (
          <ActivateClientModal
            open={!!activateClient}
            onOpenChange={(open) => !open && setActivateClient(null)}
            orgId={orgId!}
            clientId={activateClient.id}
            clientName={activateClient.name}
            onSuccess={refreshClients}
            brandColor={brandColor}
          />
        )}
      </div>
    </div>
  )
}
