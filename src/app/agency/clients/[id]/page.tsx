'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, Button, Badge, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/lib/ui'
import { useBrandTheme } from '@/components/branding/BrandThemeProvider'
import { Loader2, MapPin, ChevronLeft, Zap, Archive, PauseCircle } from 'lucide-react'
import { authenticatedFetch } from '@/lib/authenticated-fetch'
import { useAuthSession } from '@/contexts/AuthSessionContext'
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
  website?: string
  social_links?: Record<string, string> | null
  created_at: string
  updated_at: string
}

interface Location {
  id: string
  client_id: string
  name: string
  address?: Record<string, unknown>
  phone?: string
  website?: string
  business_hours?: Record<string, unknown>
  categories?: string[]
  is_active: boolean
  gbp_place_id?: string
  location_label?: string
  photos?: string[]
  created_at: string
  updated_at: string
}

/** Build place-photo URL for location images (proxy returns 302 to Google image). */
function placePhotoUrl(photoName: string, maxPx = 400): string {
  const params = new URLSearchParams({ name: photoName, max_px: String(maxPx) })
  return `/api/v1/smb/place-photo?${params.toString()}`
}

export default function ClientDetailPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params?.id as string
  const { theme } = useBrandTheme()
  const brandColor = theme?.primary_color || '#2563eb'
  const [client, setClient] = useState<Client | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activateModalOpen, setActivateModalOpen] = useState(false)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const { activeOrgId, orgs } = useAuthSession()
  const orgId = activeOrgId || orgs?.[0]?.id

  useEffect(() => {
    if (!clientId) return

    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        const [clientRes, locationsRes] = await Promise.all([
          authenticatedFetch(`/api/v1/clients/${clientId}`),
          authenticatedFetch(`/api/v1/clients/${clientId}/locations`),
        ])

        if (clientRes.status === 401 || locationsRes.status === 401) {
          router.push('/signin')
          return
        }

        if (!clientRes.ok || !locationsRes.ok) {
          throw new Error(clientRes.status === 404 || locationsRes.status === 404 ? 'Not found' : 'Failed to load')
        }

        const clientData = await clientRes.json()
        const locationsData = await locationsRes.json()

        setClient(clientData)
        setLocations(locationsData?.locations || [])
      } catch (err: unknown) {
        console.error('Failed to load client:', err)
        const msg = err instanceof Error ? err.message : ''
        if (msg === 'Not found') {
          setError('Client not found')
        } else {
          setError('Failed to load client details')
        }
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [clientId, router])

  const refreshClient = useCallback(async () => {
    if (!clientId) return
    try {
      const res = await authenticatedFetch(`/api/v1/clients/${clientId}`)
      if (res.ok) {
        const data = await res.json()
        setClient(data)
      }
    } catch {
      // keep existing
    }
  }, [clientId])

  const handleDeactivate = async () => {
    if (!clientId || !client) return
    setActionLoading(true)
    try {
      const res = await authenticatedFetch(`/api/v1/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'inactive' }),
      })
      if (res.ok) {
        setDeactivateDialogOpen(false)
        await refreshClient()
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleArchive = async () => {
    if (!clientId) return
    setActionLoading(true)
    try {
      const res = await authenticatedFetch(`/api/v1/clients/${clientId}`, { method: 'DELETE' })
      if (res.ok) {
        setArchiveDialogOpen(false)
        router.push('/agency/clients')
      }
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pb-24 md:pb-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading client...</p>
        </div>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="min-h-screen pb-24 md:pb-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Agency', href: '/agency/dashboard' },
            { label: 'Clients', href: '/agency/clients' },
            { label: 'Client' },
          ]}
          title="Client"
        />
        <div className="max-w-4xl mx-auto px-6 py-10">
          <Card className="p-6">
            <p className="text-destructive">{error || 'Client not found'}</p>
            <Button
              variant="outline"
              onClick={() => router.push('/agency/clients')}
              className="mt-4"
            >
              Back to Clients
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 md:pb-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Agency', href: '/agency/dashboard' },
          { label: 'Clients', href: '/agency/clients' },
          { label: client.name },
        ]}
        title={client.name}
        subtitle={client.slug}
        actions={
          <div className="flex items-center gap-2">
            {(client.lifecycle === 'lead' || !client.lifecycle) && orgId && (
              <Button
                onClick={() => setActivateModalOpen(true)}
                style={{ backgroundColor: brandColor }}
                className="text-white h-10 px-4 font-medium text-sm"
              >
                <Zap className="w-4 h-4 mr-2" />
                Activate client
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => router.push('/agency/clients')}
              className="h-10 px-4 font-medium text-sm"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Clients
            </Button>
          </div>
        }
      />

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <Card className="p-6">
          <h3 className="font-medium text-base mb-4">Client Details</h3>
          <div className="flex flex-wrap gap-3 mb-4">
            <Badge variant="outline">{client.tier}</Badge>
            <Badge
              variant="outline"
              className={
                client.lifecycle === 'lead' || !client.lifecycle
                  ? 'text-amber-700 dark:text-amber-400 border-amber-200'
                  : 'text-green-700 dark:text-green-400 border-green-200'
              }
            >
              {client.lifecycle === 'lead' || !client.lifecycle ? 'Lead' : 'Active'}
            </Badge>
            {client.lifecycle === 'active' && client.layer && (
              <Badge variant="secondary" className="capitalize">
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
          <dl className="grid gap-2 text-sm">
            <div><span className="text-muted-foreground">Slug</span> <span className="font-mono">{client.slug}</span></div>
            <div><span className="text-muted-foreground">Created</span> {new Date(client.created_at).toLocaleString()}</div>
            <div><span className="text-muted-foreground">Updated</span> {new Date(client.updated_at).toLocaleString()}</div>
            {client.website && (
              <div>
                <span className="text-muted-foreground">Website</span>{' '}
                <a href={client.website.startsWith('http') ? client.website : `https://${client.website}`} target="_blank" rel="noopener noreferrer" className="text-primary underline truncate block max-w-md">{client.website}</a>
              </div>
            )}
            {client.social_links && Object.keys(client.social_links).length > 0 && (
              <div>
                <span className="text-muted-foreground">Social</span>{' '}
                <span className="flex flex-wrap gap-2 mt-1">
                  {Object.entries(client.social_links).map(([key, url]) => (
                    url ? <a key={key} href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs capitalize">{key}</a> : null
                  ))}
                </span>
              </div>
            )}
          </dl>
        </Card>

        <Card className="p-6">
          <h3 className="font-medium text-base mb-3">Actions</h3>
          <div className="flex flex-wrap gap-2">
            {client.status === 'active' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeactivateDialogOpen(true)}
                disabled={actionLoading}
                className="text-amber-700 border-amber-200 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-950/30"
              >
                <PauseCircle className="w-4 h-4 mr-2" />
                Deactivate
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setArchiveDialogOpen(true)}
              disabled={actionLoading}
              className="text-muted-foreground"
            >
              <Archive className="w-4 h-4 mr-2" />
              Archive client
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Deactivate marks the client inactive; they stay in your list. Archive removes the client from the list (soft-delete).
          </p>
        </Card>

        <Card className="rounded-xl shadow-sm">
          <div className="px-6 py-5 border-b border-black/5 dark:border-white/10">
            <h2 className="text-xl font-medium tracking-tight">Locations</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {locations.length} location{locations.length !== 1 ? 's' : ''}
            </p>
          </div>
          {locations.length === 0 ? (
            <div className="p-12 text-center">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No locations added yet</p>
            </div>
          ) : (
            <div className="divide-y divide-black/5 dark:divide-white/10">
              {locations.map((loc) => (
                <div key={loc.id} className="p-5 space-y-4">
                  <div className="flex items-start gap-4">
                    {loc.photos && loc.photos.length > 0 ? (
                      <div className="flex gap-2 flex-wrap">
                        {loc.photos.slice(0, 5).map((photoName, i) => (
                          <a
                            key={i}
                            href={placePhotoUrl(photoName, 800)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block rounded-lg overflow-hidden border border-black/10 dark:border-white/10 w-16 h-16 flex-shrink-0"
                          >
                            <img
                              src={placePhotoUrl(photoName)}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                        style={{ backgroundColor: brandColor }}
                      >
                        <MapPin className="w-6 h-6" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{loc.name}</div>
                      {loc.location_label && (
                        <div className="text-xs text-muted-foreground">{loc.location_label}</div>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className={loc.is_active ? 'text-green-700' : 'text-muted-foreground'}>
                          {loc.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {loc.gbp_place_id && (
                          <Badge variant="secondary" className="font-mono text-xs truncate max-w-[180px]" title={loc.gbp_place_id}>
                            GBP connected
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                    {loc.phone && <div><span className="text-muted-foreground">Phone</span> <a href={`tel:${loc.phone}`} className="text-foreground">{loc.phone}</a></div>}
                    {loc.website && <div><span className="text-muted-foreground">Website</span> <a href={loc.website.startsWith('http') ? loc.website : `https://${loc.website}`} target="_blank" rel="noopener noreferrer" className="text-primary underline truncate block">{loc.website}</a></div>}
                    {loc.address && (typeof loc.address === 'object' && (loc.address as Record<string, unknown>).formatted_address) && (
                      <div className="sm:col-span-2"><span className="text-muted-foreground">Address</span> <span className="text-foreground">{(loc.address as { formatted_address?: string }).formatted_address}</span></div>
                    )}
                    {loc.address && typeof loc.address === 'object' && !(loc.address as Record<string, unknown>).formatted_address && Object.keys(loc.address as object).length > 0 && (
                      <div className="sm:col-span-2"><span className="text-muted-foreground">Address</span> <span className="text-foreground">{JSON.stringify(loc.address)}</span></div>
                    )}
                    {loc.categories && loc.categories.length > 0 && <div className="sm:col-span-2"><span className="text-muted-foreground">Categories</span> <span className="text-foreground">{loc.categories.join(', ')}</span></div>}
                    {loc.business_hours && typeof loc.business_hours === 'object' && Object.keys(loc.business_hours as object).length > 0 && (
                      <div className="sm:col-span-2"><span className="text-muted-foreground">Hours</span> <pre className="text-xs mt-1 whitespace-pre-wrap">{JSON.stringify(loc.business_hours, null, 2)}</pre></div>
                    )}
                  </dl>
                </div>
              ))}
            </div>
          )}
        </Card>
        {client && orgId && (
          <ActivateClientModal
            open={activateModalOpen}
            onOpenChange={setActivateModalOpen}
            orgId={orgId}
            clientId={client.id}
            clientName={client.name}
            onSuccess={refreshClient}
            brandColor={brandColor}
          />
        )}

        <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deactivate client</AlertDialogTitle>
              <AlertDialogDescription>
                This will set the client to inactive. They will remain in your client list but won&apos;t have access. You can reactivate later by updating their status.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => { e.preventDefault(); handleDeactivate(); }}
                disabled={actionLoading}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Deactivate'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Archive client</AlertDialogTitle>
              <AlertDialogDescription>
                This will archive the client. They will be removed from your client list. Data is kept and can be restored by support if needed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => { e.preventDefault(); handleArchive(); }}
                disabled={actionLoading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Archive'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
