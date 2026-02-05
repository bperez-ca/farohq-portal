'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, Button, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Input, Label } from '@/lib/ui'
import { useBrandTheme } from '@/components/branding/BrandThemeProvider'
import { Loader2, Building2, ChevronRight, Plus } from 'lucide-react'
import { authenticatedFetch } from '@/lib/authenticated-fetch'
import { useAuthSession } from '@/contexts/AuthSessionContext'

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

export default function AgencyClientsPage() {
  const router = useRouter()
  const { theme } = useBrandTheme()
  const { activeOrgId, orgs, loading: sessionLoading } = useAuthSession()
  const brandColor = theme?.primary_color || '#2563eb'
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addName, setAddName] = useState('')
  const [addSlug, setAddSlug] = useState('')
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

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

  const handleViewClient = (clientId: string) => {
    router.push(`/agency/clients/${clientId}`)
  }

  const handleAddNameChange = (name: string) => {
    setAddName(name)
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'client'
    setAddSlug(slug)
  }

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgId || !addName.trim()) return
    setAddSubmitting(true)
    setAddError(null)
    try {
      const res = await authenticatedFetch(`/api/v1/tenants/${orgId}/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': orgId,
        },
        body: JSON.stringify({
          name: addName.trim(),
          slug: addSlug.trim() || 'client',
          tier: 'starter',
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || errData.details || 'Failed to create client')
      }
      const newClient = await res.json()
      setClients((prev) => [...prev, newClient])
      setAddDialogOpen(false)
      setAddName('')
      setAddSlug('')
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to create client')
    } finally {
      setAddSubmitting(false)
    }
  }

  const openAddDialog = () => {
    setAddName('')
    setAddSlug('')
    setAddError(null)
    setAddDialogOpen(true)
  }

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
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="p-5 flex items-center justify-between hover:bg-black/[0.02] dark:hover:bg-white/[0.05] transition-colors group cursor-pointer"
                  onClick={() => handleViewClient(client.id)}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium text-lg flex-shrink-0"
                      style={{ backgroundColor: brandColor }}
                    >
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-base mb-1">{client.name}</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-mono">{client.slug}</span>
                        <Badge variant="outline" className="text-xs">
                          {client.tier}
                        </Badge>
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
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              ))}
            </div>
          </Card>
        )}

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent>
            <form onSubmit={handleAddClient}>
              <DialogHeader>
                <DialogTitle>Add Client</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {addError && (
                  <p className="text-sm text-destructive">{addError}</p>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="add-name">Name</Label>
                  <Input
                    id="add-name"
                    value={addName}
                    onChange={(e) => handleAddNameChange(e.target.value)}
                    placeholder="Client business name"
                    required
                    disabled={addSubmitting}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="add-slug">Slug</Label>
                  <Input
                    id="add-slug"
                    value={addSlug}
                    onChange={(e) => setAddSlug(e.target.value)}
                    placeholder="client-slug"
                    disabled={addSubmitting}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddDialogOpen(false)}
                  disabled={addSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  style={{ backgroundColor: brandColor }}
                  className="text-white"
                  disabled={addSubmitting}
                >
                  {addSubmitting ? 'Creating...' : 'Add Client'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
