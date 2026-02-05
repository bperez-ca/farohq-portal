'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  Card,
} from '@/lib/ui'
import { Loader2, Search, MapPin, Building2 } from 'lucide-react'
import { authenticatedFetch } from '@/lib/authenticated-fetch'

export type PlaceCandidate = {
  place_id: string
  name: string
  formatted_address?: string
  phone?: string
  website?: string
}

type Step = 'search' | 'results' | 'form'

type AddClientFlowProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: string
  onSuccess: () => void
  brandColor?: string
}

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'client'
}

export function AddClientFlow({
  open,
  onOpenChange,
  orgId,
  onSuccess,
  brandColor = '#2563eb',
}: AddClientFlowProps) {
  const [step, setStep] = useState<Step>('search')
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [places, setPlaces] = useState<PlaceCandidate[]>([])
  const [selectedPlace, setSelectedPlace] = useState<PlaceCandidate | null>(null)
  const [manualName, setManualName] = useState('')
  const [manualAddress, setManualAddress] = useState('')
  const [manualPhone, setManualPhone] = useState('')
  const [manualWebsite, setManualWebsite] = useState('')
  const [locationLabel, setLocationLabel] = useState('')
  const [clientNameOverride, setClientNameOverride] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const reset = () => {
    setStep('search')
    setQuery('')
    setPlaces([])
    setSelectedPlace(null)
    setManualName('')
    setManualAddress('')
    setManualPhone('')
    setManualWebsite('')
    setLocationLabel('')
    setClientNameOverride('')
    setSearchError(null)
    setSubmitError(null)
  }

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) reset()
    onOpenChange(isOpen)
  }

  const handleSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    setSearchError(null)
    try {
      const res = await authenticatedFetch(
        `/api/v1/smb/search?q=${encodeURIComponent(query.trim())}`,
        { headers: { 'X-Tenant-ID': orgId } }
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSearchError(data.error || data.details || 'Search failed')
        setPlaces([])
        return
      }
      setPlaces(data.places || [])
      setStep('results')
    } catch (e) {
      setSearchError('Search failed')
      setPlaces([])
    } finally {
      setSearching(false)
    }
  }

  const handleSelectPlace = (place: PlaceCandidate) => {
    setSelectedPlace(place)
    setClientNameOverride(place.name)
    setManualName(place.name)
    setManualAddress(place.formatted_address || '')
    setManualPhone(place.phone || '')
    setManualWebsite(place.website || '')
    setStep('form')
  }

  const handleNotListed = () => {
    setSelectedPlace(null)
    setManualName('')
    setManualAddress('')
    setManualPhone('')
    setManualWebsite('')
    setClientNameOverride('')
    setStep('form')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError(null)
    try {
      const name = (selectedPlace ? clientNameOverride : manualName) || manualName
      if (!name.trim()) {
        setSubmitError('Business name is required')
        setSubmitting(false)
        return
      }
      const slug = slugFromName(name)

      const body = selectedPlace
        ? {
            place_id: selectedPlace.place_id,
            client_name_override: clientNameOverride || undefined,
            location_label: locationLabel || undefined,
            tier: 'starter',
          }
        : {
            name: name.trim(),
            slug,
            tier: 'starter',
            address: manualAddress.trim() ? { formatted_address: manualAddress.trim() } : undefined,
            phone: manualPhone.trim() || undefined,
            website: manualWebsite.trim() || undefined,
          }

      const res = await authenticatedFetch(`/api/v1/tenants/${orgId}/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': orgId,
        },
        body: JSON.stringify(body),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSubmitError(data.error || data.details || 'Failed to create client')
        setSubmitting(false)
        return
      }
      onSuccess()
      handleClose(false)
    } catch (e) {
      setSubmitError('Failed to create client')
    } finally {
      setSubmitting(false)
    }
  }

  const displayName = selectedPlace ? (clientNameOverride || selectedPlace.name) : manualName

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Client</DialogTitle>
        </DialogHeader>

        {step === 'search' && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Search for the business by name or address to prefill details.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Business name or address"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                disabled={searching}
              />
              <Button
                type="button"
                onClick={handleSearch}
                disabled={searching || !query.trim()}
                style={{ backgroundColor: brandColor }}
                className="text-white"
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
            {searchError && <p className="text-sm text-destructive">{searchError}</p>}
            <Button type="button" variant="ghost" className="w-full justify-center" onClick={handleNotListed}>
              My business isn&apos;t listed — enter manually
            </Button>
          </div>
        )}

        {step === 'results' && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Select a place or add manually.</p>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {places.map((place) => (
                <Card
                  key={place.place_id}
                  className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSelectPlace(place)}
                >
                  <div className="font-medium">{place.name}</div>
                  {place.formatted_address && (
                    <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {place.formatted_address}
                    </div>
                  )}
                  {(place.phone || place.website) && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {place.phone}
                      {place.phone && place.website && ' · '}
                      {place.website}
                    </div>
                  )}
                </Card>
              ))}
            </div>
            {places.length === 0 && !searchError && (
              <p className="text-sm text-muted-foreground">No results. Add the client manually.</p>
            )}
            <Button type="button" variant="outline" className="w-full" onClick={handleNotListed}>
              My business isn&apos;t listed
            </Button>
            <Button type="button" variant="ghost" onClick={() => setStep('search')}>
              Back to search
            </Button>
          </div>
        )}

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {submitError && <p className="text-sm text-destructive">{submitError}</p>}
            <div className="grid gap-2">
              <Label htmlFor="name">Business name</Label>
              <Input
                id="name"
                value={displayName}
                onChange={(e) =>
                  selectedPlace ? setClientNameOverride(e.target.value) : setManualName(e.target.value)
                }
                placeholder="Client business name"
                required
                disabled={submitting}
              />
            </div>
            {selectedPlace && (
              <div className="grid gap-2">
                <Label htmlFor="location_label">Location label (optional)</Label>
                <Input
                  id="location_label"
                  value={locationLabel}
                  onChange={(e) => setLocationLabel(e.target.value)}
                  placeholder="e.g. Main store"
                  disabled={submitting}
                />
              </div>
            )}
            {!selectedPlace && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="address">Address (optional)</Label>
                  <Input
                    id="address"
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    placeholder="Full address"
                    disabled={submitting}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    placeholder="Phone"
                    disabled={submitting}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="website">Website (optional)</Label>
                  <Input
                    id="website"
                    value={manualWebsite}
                    onChange={(e) => setManualWebsite(e.target.value)}
                    placeholder="https://..."
                    disabled={submitting}
                  />
                </div>
              </>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStep(selectedPlace ? 'results' : 'search')} disabled={submitting}>
                Back
              </Button>
              <Button
                type="submit"
                style={{ backgroundColor: brandColor }}
                className="text-white"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Building2 className="w-4 h-4 mr-2" />
                    Add Client
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
