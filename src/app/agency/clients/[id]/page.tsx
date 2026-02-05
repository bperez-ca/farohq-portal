'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card } from '@/lib/ui'
import { Button } from '@/lib/ui'
import { Badge } from '@/components/ui/badge'
import { useBrandTheme } from '@/components/branding/BrandThemeProvider'
import { Loader2, MapPin, ChevronLeft } from 'lucide-react'
import { authenticatedFetch } from '@/lib/authenticated-fetch'

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

interface Location {
  id: string
  client_id: string
  name: string
  address?: Record<string, unknown>
  phone?: string
  business_hours?: Record<string, unknown>
  categories?: string[]
  is_active: boolean
  created_at: string
  updated_at: string
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
          <Button
            variant="outline"
            onClick={() => router.push('/agency/clients')}
            className="h-10 px-4 font-medium text-sm"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Clients
          </Button>
        }
      />

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <Card className="p-6">
          <h3 className="font-medium text-base mb-4">Client Details</h3>
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline">{client.tier}</Badge>
            <Badge
              variant="outline"
              className={
                client.status === 'active'
                  ? 'text-green-700 dark:text-green-400 border-green-200'
                  : ''
              }
            >
              {client.status}
            </Badge>
          </div>
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
                <div
                  key={loc.id}
                  className="p-5 flex items-center gap-4"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0"
                    style={{ backgroundColor: brandColor }}
                  >
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{loc.name}</div>
                    {loc.phone && (
                      <div className="text-sm text-muted-foreground">{loc.phone}</div>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={loc.is_active ? 'text-green-700' : 'text-muted-foreground'}
                  >
                    {loc.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
