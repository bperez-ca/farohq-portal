'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, Button, Badge, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label } from '@/lib/ui'
import { useBrandTheme } from '@/components/branding/BrandThemeProvider'
import { Loader2, MapPin, ChevronLeft, Zap, Archive, PauseCircle, Star, ChevronDown, ChevronUp, MessageCircle, FileText, Send, Plus, ExternalLink, RefreshCw, Link2, Phone } from 'lucide-react'
import { authenticatedFetch } from '@/lib/authenticated-fetch'
import { useAuthSession } from '@/contexts/AuthSessionContext'
import { ActivateClientModal } from '@/components/agency/ActivateClientModal'
import { LocationPhotoLightbox } from '@/components/agency/LocationPhotoLightbox'
import { placePhotoUrl } from '@/lib/place-photo'
import { useToast } from '@/hooks/use-toast'

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
  business_hours?: Record<string, unknown> & { weekdayDescriptions?: string[]; openNow?: boolean }
  categories?: string[]
  is_active: boolean
  gbp_place_id?: string
  location_label?: string
  photos?: string[]
  rating?: number
  review_count?: number
  primary_type?: string
  google_maps_uri?: string
  price_level?: string
  business_status?: string
  editorial_summary?: string
  types?: string[]
  delivery?: boolean
  takeout?: boolean
  dine_in?: boolean
  curbside_pickup?: boolean
  reservable?: boolean
  serves_breakfast?: boolean
  serves_lunch?: boolean
  serves_dinner?: boolean
  serves_beer?: boolean
  serves_wine?: boolean
  serves_cocktails?: boolean
  serves_vegetarian_food?: boolean
  outdoor_seating?: boolean
  live_music?: boolean
  good_for_children?: boolean
  good_for_groups?: boolean
  payment_options?: Record<string, unknown>
  parking_options?: Record<string, unknown>
  accessibility_options?: Record<string, unknown>
  created_at: string
  updated_at: string
}

interface WhatsAppBinding {
  connected: boolean
  twilio_phone?: string
  connected_at?: string
}

function priceLevelLabel(level: string): string {
  const map: Record<string, string> = {
    PRICE_LEVEL_FREE: 'Free',
    PRICE_LEVEL_INEXPENSIVE: '$',
    PRICE_LEVEL_MODERATE: '$$',
    PRICE_LEVEL_EXPENSIVE: '$$$',
    PRICE_LEVEL_VERY_EXPENSIVE: '$$$$',
  }
  return map[level] || level.replace('PRICE_LEVEL_', '') || ''
}

function getLocationCoords(loc: Location): { lat: number; lng: number } | null {
  const addr = loc.address as { latitude?: number; longitude?: number } | undefined
  if (addr && typeof addr.latitude === 'number' && typeof addr.longitude === 'number') {
    return { lat: addr.latitude, lng: addr.longitude }
  }
  return null
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
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([])
  const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0)
  const [expandedHoursLocId, setExpandedHoursLocId] = useState<string | null>(null)
  const [gbpSyncLocationId, setGbpSyncLocationId] = useState<string | null>(null)
  const [gbpConnectLocationId, setGbpConnectLocationId] = useState<string | null>(null)
  const [gbpConnectedLocationIds, setGbpConnectedLocationIds] = useState<Set<string>>(new Set())
  const [whatsappByLocationId, setWhatsappByLocationId] = useState<Record<string, WhatsAppBinding>>({})
  const [whatsappDisconnectLocationId, setWhatsappDisconnectLocationId] = useState<string | null>(null)
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false)
  const [whatsappDialogLocationId, setWhatsappDialogLocationId] = useState<string | null>(null)
  const [whatsappDialogPhone, setWhatsappDialogPhone] = useState('')
  const [whatsappDialogSubmitting, setWhatsappDialogSubmitting] = useState(false)
  const { activeOrgId, orgs } = useAuthSession()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const headerRating = locations.length > 0 && (locations[0].rating != null && locations[0].rating > 0)
    ? { rating: locations[0].rating, reviewCount: locations[0].review_count ?? 0 }
    : null
  const orgId = activeOrgId || orgs?.[0]?.id

  // Handle OAuth callback query params (redirect back from Google)
  useEffect(() => {
    const gbp = searchParams.get('gbp')
    if (!gbp) return
    if (gbp === 'connected') {
      toast({ title: 'Google Business Profile connected', description: 'You can now sync name, address, and phone from GBP.' })
      // Refetch connected IDs so Connect/Reconnect and Sync buttons update
      if (orgId) {
        authenticatedFetch(`/api/v1/gbp/locations/connected?tenant_id=${orgId}`)
          .then((res) => (res.ok ? res.json() : { location_ids: [] }))
          .then((data) => setGbpConnectedLocationIds(new Set((data?.location_ids as string[]) || [])))
          .catch(() => {})
      }
    } else if (gbp === 'error') {
      toast({ title: 'Connection failed', description: 'Could not connect Google Business Profile. Please try again.', variant: 'destructive' })
    }
    // Clear query params from URL without full navigation
    const url = new URL(window.location.href)
    url.searchParams.delete('gbp')
    window.history.replaceState({}, '', url.pathname + url.search)
  }, [searchParams, toast, orgId])

  const mapEmbedKey =
    typeof process !== 'undefined'
      ? (process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY || '')
      : ''
  const firstLocationWithPlaceId = locations.find((loc) => loc.gbp_place_id)
  const firstLocationWithCoords = locations.map((loc) => ({ loc, coords: getLocationCoords(loc) })).find((x) => x.coords)
  const canShowMap = mapEmbedKey && (firstLocationWithPlaceId || firstLocationWithCoords)

  useEffect(() => {
    if (!clientId) return

    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        const orgIdForFetch = activeOrgId || orgs?.[0]?.id
        const [clientRes, locationsRes, connectedRes] = await Promise.all([
          authenticatedFetch(`/api/v1/clients/${clientId}`),
          authenticatedFetch(`/api/v1/clients/${clientId}/locations`),
          orgIdForFetch
            ? authenticatedFetch(`/api/v1/gbp/locations/connected?tenant_id=${orgIdForFetch}`)
            : Promise.resolve(null),
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

        if (connectedRes?.ok) {
          const connectedData = await connectedRes.json().catch(() => ({}))
          setGbpConnectedLocationIds(new Set((connectedData?.location_ids as string[]) || []))
        } else {
          setGbpConnectedLocationIds(new Set())
        }

        // Fetch WhatsApp binding for each location (tenant-scoped)
        const locs = locationsData?.locations || []
        if (orgIdForFetch && locs.length > 0) {
          const bindingPromises = locs.map(async (loc: Location) => {
            const res = await authenticatedFetch(`/api/v1/locations/${loc.id}/whatsapp?tenant_id=${orgIdForFetch}`)
            if (!res.ok) return { id: loc.id, binding: { connected: false } as WhatsAppBinding }
            const data = await res.json().catch(() => ({}))
            return { id: loc.id, binding: data as WhatsAppBinding }
          })
          const results = await Promise.all(bindingPromises)
          const map: Record<string, WhatsAppBinding> = {}
          results.forEach(({ id, binding }) => { map[id] = binding })
          setWhatsappByLocationId(map)
        } else {
          setWhatsappByLocationId({})
        }
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
  }, [clientId, router, activeOrgId, orgs])

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

  const refreshLocations = useCallback(async () => {
    if (!clientId) return
    try {
      const res = await authenticatedFetch(`/api/v1/clients/${clientId}/locations`)
      if (res.ok) {
        const data = await res.json()
        setLocations(data?.locations || [])
      }
    } catch {
      // keep existing
    }
  }, [clientId])

  const handleConnectGbp = useCallback(async (locationId: string) => {
    if (!orgId) {
      toast({ title: 'Select an organization', description: 'Choose an organization first.', variant: 'destructive' })
      return
    }
    setGbpConnectLocationId(locationId)
    try {
      const res = await authenticatedFetch(`/api/v1/gbp/oauth/url?location_id=${locationId}&tenant_id=${orgId}`)
      if (res.status === 401) {
        router.push('/signin')
        return
      }
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = (data as { error?: string }).error || 'Failed to get OAuth URL.'
        toast({ title: 'Could not start connection', description: msg, variant: 'destructive' })
        return
      }
      const url = (data as { url?: string }).url
      if (url) {
        window.location.href = url
        return
      }
      toast({ title: 'Could not connect', description: 'GBP OAuth is not configured. Contact support or set Google OAuth credentials.', variant: 'destructive' })
    } finally {
      setGbpConnectLocationId(null)
    }
  }, [orgId, router, toast])

  const refetchWhatsAppBinding = useCallback(async (locationId: string) => {
    if (!orgId) return
    try {
      const res = await authenticatedFetch(`/api/v1/locations/${locationId}/whatsapp?tenant_id=${orgId}`)
      const data = res.ok ? await res.json().catch(() => ({})) : { connected: false }
      setWhatsappByLocationId((prev) => ({ ...prev, [locationId]: data as WhatsAppBinding }))
    } catch {
      setWhatsappByLocationId((prev) => ({ ...prev, [locationId]: { connected: false } }))
    }
  }, [orgId])

  const handleConnectWhatsApp = useCallback((locationId: string) => {
    setWhatsappDialogLocationId(locationId)
    setWhatsappDialogPhone(whatsappByLocationId[locationId]?.twilio_phone ?? '')
    setWhatsappDialogOpen(true)
  }, [whatsappByLocationId])

  const handleWhatsappDialogSubmit = useCallback(async () => {
    if (!whatsappDialogLocationId || !orgId) return
    const phone = whatsappDialogPhone.trim()
    if (!phone) {
      toast({ title: 'Number required', description: 'Enter the Twilio WhatsApp number (E.164, e.g. +14155551234).', variant: 'destructive' })
      return
    }
    setWhatsappDialogSubmitting(true)
    try {
      const res = await authenticatedFetch(`/api/v1/locations/${whatsappDialogLocationId}/whatsapp?tenant_id=${orgId}`, {
        method: 'PUT',
        body: JSON.stringify({ twilio_phone: phone }),
      })
      if (res.ok) {
        toast({ title: 'WhatsApp connected', description: `Number ${phone} is now linked to this location.` })
        setWhatsappDialogOpen(false)
        setWhatsappDialogLocationId(null)
        setWhatsappDialogPhone('')
        await refetchWhatsAppBinding(whatsappDialogLocationId)
      } else {
        const data = await res.json().catch(() => ({}))
        toast({ title: 'Could not connect', description: (data as { error?: string }).error || 'Failed to connect WhatsApp.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Could not connect', description: 'Network or server error.', variant: 'destructive' })
    } finally {
      setWhatsappDialogSubmitting(false)
    }
  }, [whatsappDialogLocationId, whatsappDialogPhone, orgId, refetchWhatsAppBinding, toast])

  const handleDisconnectWhatsApp = useCallback(async (locationId: string) => {
    if (!orgId) return
    setWhatsappDisconnectLocationId(locationId)
    try {
      const res = await authenticatedFetch(`/api/v1/locations/${locationId}/whatsapp?tenant_id=${orgId}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'WhatsApp disconnected', description: 'The number has been unlinked from this location.' })
        await refetchWhatsAppBinding(locationId)
      } else {
        toast({ title: 'Could not disconnect', description: 'Failed to disconnect WhatsApp.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Could not disconnect', description: 'Network or server error.', variant: 'destructive' })
    } finally {
      setWhatsappDisconnectLocationId(null)
    }
  }, [orgId, refetchWhatsAppBinding, toast])

  const handleSyncGbp = useCallback(async (locationId: string) => {
    if (!orgId) {
      toast({ title: 'Select an organization', description: 'Choose an organization first.', variant: 'destructive' })
      return
    }
    setGbpSyncLocationId(locationId)
    try {
      const res = await authenticatedFetch(`/api/v1/gbp/sync/${locationId}?tenant_id=${orgId}`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        const updated = (data as { updated?: boolean }).updated
        toast({ title: updated ? 'Location updated' : 'Sync complete', description: updated ? 'Name, address, and phone synced from Google Business Profile.' : 'NAP data retrieved.' })
        await refreshLocations()
      } else {
        const msg = data.error || (res.status === 409 ? 'GBP not connected for this location. Connect first.' : 'Sync failed.')
        toast({ title: 'Sync failed', description: msg, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Sync failed', description: 'Network or server error.', variant: 'destructive' })
    } finally {
      setGbpSyncLocationId(null)
    }
  }, [orgId, refreshLocations, toast])

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
        subtitle={[client.slug, headerRating && `${headerRating.rating.toFixed(1)} ★${headerRating.reviewCount > 0 ? ` (${headerRating.reviewCount} reviews)` : ''}`].filter(Boolean).join(' · ')}
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
            {client.status === 'active' && (
              <Button
                variant="outline"
                className="h-10 px-4 font-medium text-sm gap-2"
                onClick={() => router.push(`/business/${client.slug}/dashboard`)}
                title="View as Business (client-facing dashboard)"
              >
                <ExternalLink className="w-4 h-4" />
                View as Business
              </Button>
            )}
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
          <h3 className="font-medium text-base mb-4">Health Score</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 text-center">
              <div className="text-2xl font-semibold text-muted-foreground">—</div>
              <div className="text-xs text-muted-foreground mt-1">Presence</div>
              <div className="text-xs text-muted-foreground">NAP, Hours, Photos</div>
            </div>
            <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 text-center">
              <div className="text-2xl font-semibold text-muted-foreground">—</div>
              <div className="text-xs text-muted-foreground mt-1">Trust</div>
              <div className="text-xs text-muted-foreground">Rating, Reviews</div>
            </div>
            <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 text-center">
              <div className="text-2xl font-semibold text-muted-foreground">—</div>
              <div className="text-xs text-muted-foreground mt-1">Speed</div>
              <div className="text-xs text-muted-foreground">Response time</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Scores will appear when metrics are available.</p>
        </Card>

        <Card className="p-6">
          <h3 className="font-medium text-base mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Zap className="w-4 h-4" />
              Connect Google Business Profile
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <MessageCircle className="w-4 h-4" />
              Connect WhatsApp
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <FileText className="w-4 h-4" />
              Generate Diagnostic Report
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Send className="w-4 h-4" />
              Send Review Request
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-medium text-base mb-3">Recent activity</h3>
          <p className="text-sm text-muted-foreground">No recent activity</p>
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

        {(locations.length > 0 || canShowMap) && (
          <Card className="p-6">
            <h3 className="font-medium text-base mb-3">Map</h3>
            {canShowMap ? (
              <div className="rounded-md overflow-hidden border border-black/10 dark:border-white/10 bg-muted/30">
                {firstLocationWithPlaceId ? (
                  <iframe
                    title="Client locations map"
                    width="100%"
                    height="280"
                    style={{ border: 0 }}
                    src={`https://www.google.com/maps/embed/v1/place?key=${mapEmbedKey}&q=place_id:${firstLocationWithPlaceId.gbp_place_id}`}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : firstLocationWithCoords ? (
                  <iframe
                    title="Client locations map"
                    width="100%"
                    height="280"
                    style={{ border: 0 }}
                    src={`https://www.google.com/maps/embed/v1/view?key=${mapEmbedKey}&center=${firstLocationWithCoords.coords.lat},${firstLocationWithCoords.coords.lng}&zoom=15`}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {locations.length === 0
                  ? 'Add a location to see it on the map.'
                  : 'Map unavailable — set NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY or add locations with coordinates.'}
              </p>
            )}
          </Card>
        )}

        <Card className="rounded-xl shadow-sm">
          <div className="px-6 py-5 border-b border-black/5 dark:border-white/10 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-xl font-medium tracking-tight">Locations</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {locations.length} location{locations.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Location
            </Button>
          </div>
          {locations.length === 0 ? (
            <div className="p-12 text-center">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No locations added yet</p>
              <Button variant="outline" size="sm" className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                Add Location
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-black/5 dark:divide-white/10">
              {locations.map((loc) => (
                <div key={loc.id} className="p-5 space-y-4">
                  <div className="flex items-start gap-4">
                    {loc.photos && loc.photos.length > 0 ? (
                      <div className="flex gap-2 flex-wrap">
                        {loc.photos.slice(0, 5).map((photoName, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setLightboxPhotos(loc.photos ?? [])
                              setLightboxInitialIndex(i)
                              setLightboxOpen(true)
                            }}
                            className="block rounded-lg overflow-hidden border border-black/10 dark:border-white/10 w-16 h-16 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          >
                            <img
                              src={placePhotoUrl(photoName)}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </button>
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
                      <div className="flex flex-wrap gap-2 mt-2 items-center">
                        <Badge variant="outline" className={loc.is_active ? 'text-green-700' : 'text-muted-foreground'}>
                          {loc.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {loc.primary_type && (
                          <Badge variant="secondary" className="capitalize text-xs">
                            {loc.primary_type.replace(/_/g, ' ')}
                          </Badge>
                        )}
                        {loc.gbp_place_id && (
                          <Badge variant="secondary" className="text-xs">
                            GBP claimed
                          </Badge>
                        )}
                        {gbpConnectedLocationIds.has(loc.id) && (
                          <Badge variant="secondary" className="text-xs">
                            GBP connected
                          </Badge>
                        )}
                        {whatsappByLocationId[loc.id]?.connected && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <MessageCircle className="w-3 h-3" />
                            WhatsApp {whatsappByLocationId[loc.id].twilio_phone && `(${whatsappByLocationId[loc.id].twilio_phone})`}
                          </Badge>
                        )}
                        {loc.gbp_place_id && (
                          <Badge variant="outline" className="font-mono text-xs truncate max-w-[180px]" title={loc.gbp_place_id}>
                            Place ID
                          </Badge>
                        )}
                        {loc.rating != null && loc.rating > 0 && (
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            {loc.rating.toFixed(1)}
                            {(loc.review_count ?? 0) > 0 && <span>({loc.review_count} reviews)</span>}
                          </span>
                        )}
                        {loc.price_level && (
                          <span className="text-sm font-medium text-muted-foreground">{priceLevelLabel(loc.price_level)}</span>
                        )}
                        {loc.business_status && loc.business_status !== 'OPERATIONAL' && (
                          <Badge variant="outline" className="text-amber-700 border-amber-200">
                            {loc.business_status.replace(/_/g, ' ')}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs"
                          disabled={!!gbpConnectLocationId}
                          onClick={() => handleConnectGbp(loc.id)}
                        >
                          {gbpConnectLocationId === loc.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Link2 className="w-3.5 h-3.5" />
                          )}
                          {gbpConnectedLocationIds.has(loc.id) ? 'Reconnect GBP' : 'Connect GBP'}
                        </Button>
                        {gbpConnectedLocationIds.has(loc.id) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs"
                            disabled={!!gbpSyncLocationId}
                            onClick={() => handleSyncGbp(loc.id)}
                          >
                            {gbpSyncLocationId === loc.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3.5 h-3.5" />
                            )}
                            Sync from GBP
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs"
                          onClick={() => handleConnectWhatsApp(loc.id)}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          {whatsappByLocationId[loc.id]?.connected ? 'Change WhatsApp' : 'Connect WhatsApp'}
                        </Button>
                        {whatsappByLocationId[loc.id]?.connected && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs text-muted-foreground"
                            disabled={!!whatsappDisconnectLocationId}
                            onClick={() => handleDisconnectWhatsApp(loc.id)}
                          >
                            {whatsappDisconnectLocationId === loc.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Phone className="w-3.5 h-3.5" />
                            )}
                            Disconnect WhatsApp
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  {loc.editorial_summary && (
                    <p className="text-sm text-muted-foreground italic">{loc.editorial_summary}</p>
                  )}
                  {loc.types && loc.types.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {loc.types.filter(t => t !== loc.primary_type).slice(0, 6).map((t) => (
                        <Badge key={t} variant="outline" className="text-xs capitalize font-normal">
                          {t.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {([loc.delivery, loc.takeout, loc.dine_in, loc.curbside_pickup, loc.reservable].some(Boolean)) && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-medium text-muted-foreground">Services</div>
                      <div className="flex flex-wrap gap-1.5">
                        {loc.delivery && <Badge variant="secondary" className="text-xs">Delivery</Badge>}
                        {loc.takeout && <Badge variant="secondary" className="text-xs">Takeout</Badge>}
                        {loc.dine_in && <Badge variant="secondary" className="text-xs">Dine-in</Badge>}
                        {loc.curbside_pickup && <Badge variant="secondary" className="text-xs">Curbside pickup</Badge>}
                        {loc.reservable && <Badge variant="secondary" className="text-xs">Reservations</Badge>}
                      </div>
                    </div>
                  )}
                  {([loc.serves_breakfast, loc.serves_lunch, loc.serves_dinner, loc.serves_beer, loc.serves_wine, loc.serves_cocktails, loc.serves_vegetarian_food].some(Boolean)) && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-medium text-muted-foreground">Menu</div>
                      <div className="flex flex-wrap gap-1.5">
                        {loc.serves_breakfast && <Badge variant="secondary" className="text-xs">Breakfast</Badge>}
                        {loc.serves_lunch && <Badge variant="secondary" className="text-xs">Lunch</Badge>}
                        {loc.serves_dinner && <Badge variant="secondary" className="text-xs">Dinner</Badge>}
                        {loc.serves_beer && <Badge variant="secondary" className="text-xs">Beer</Badge>}
                        {loc.serves_wine && <Badge variant="secondary" className="text-xs">Wine</Badge>}
                        {loc.serves_cocktails && <Badge variant="secondary" className="text-xs">Cocktails</Badge>}
                        {loc.serves_vegetarian_food && <Badge variant="secondary" className="text-xs">Vegetarian</Badge>}
                      </div>
                    </div>
                  )}
                  {([loc.outdoor_seating, loc.live_music, loc.good_for_children, loc.good_for_groups].some(Boolean)) && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-medium text-muted-foreground">Amenities</div>
                      <div className="flex flex-wrap gap-1.5">
                        {loc.outdoor_seating && <Badge variant="secondary" className="text-xs">Outdoor seating</Badge>}
                        {loc.live_music && <Badge variant="secondary" className="text-xs">Live music</Badge>}
                        {loc.good_for_children && <Badge variant="secondary" className="text-xs">Good for kids</Badge>}
                        {loc.good_for_groups && <Badge variant="secondary" className="text-xs">Good for groups</Badge>}
                      </div>
                    </div>
                  )}
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
                    {loc.google_maps_uri && (
                      <div className="sm:col-span-2">
                        <span className="text-muted-foreground">Map</span>{' '}
                        <a href={loc.google_maps_uri} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">View on Google Maps</a>
                      </div>
                    )}
                    {loc.business_hours && typeof loc.business_hours === 'object' && Object.keys(loc.business_hours as object).length > 0 && (
                      <div className="sm:col-span-2">
                        <button
                          type="button"
                          onClick={() => setExpandedHoursLocId(expandedHoursLocId === loc.id ? null : loc.id)}
                          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                        >
                          <span className="text-muted-foreground">Hours</span>
                          {expandedHoursLocId === loc.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {expandedHoursLocId === loc.id && (
                          <div className="mt-2 text-sm text-foreground">
                            {(loc.business_hours as { weekdayDescriptions?: string[] }).weekdayDescriptions?.length ? (
                              <ul className="list-none space-y-0.5">
                                {(loc.business_hours as { weekdayDescriptions?: string[] }).weekdayDescriptions!.map((line, i) => (
                                  <li key={i}>{line}</li>
                                ))}
                              </ul>
                            ) : (
                              <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(loc.business_hours, null, 2)}</pre>
                            )}
                          </div>
                        )}
                      </div>
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

        <Dialog open={whatsappDialogOpen} onOpenChange={(open) => { setWhatsappDialogOpen(open); if (!open) { setWhatsappDialogLocationId(null); setWhatsappDialogPhone(''); } }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Connect WhatsApp</DialogTitle>
              <DialogDescription>
                Enter the Twilio WhatsApp number (E.164 format, e.g. +14155551234) to link to this location. Inbound messages to this number will appear in the inbox.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="whatsapp-phone">Twilio WhatsApp number</Label>
                <Input
                  id="whatsapp-phone"
                  placeholder="+14155551234"
                  value={whatsappDialogPhone}
                  onChange={(e) => setWhatsappDialogPhone(e.target.value)}
                  disabled={whatsappDialogSubmitting}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setWhatsappDialogOpen(false)} disabled={whatsappDialogSubmitting}>
                Cancel
              </Button>
              <Button onClick={() => handleWhatsappDialogSubmit()} disabled={whatsappDialogSubmitting}>
                {whatsappDialogSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Connect'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <LocationPhotoLightbox
        photos={lightboxPhotos}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        initialIndex={lightboxInitialIndex}
      />
    </div>
  )
}
