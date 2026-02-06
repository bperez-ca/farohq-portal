'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
import { Loader2, MapPin, Building2, Star, ChevronDown, ChevronUp, ExternalLink, PlusCircle, LayoutDashboard } from 'lucide-react'
import { authenticatedFetch } from '@/lib/authenticated-fetch'

export type PlaceCandidate = {
  place_id: string
  name: string
  formatted_address?: string
  phone?: string
  website?: string
}

export type AutocompleteSuggestion = {
  placeId: string
  name: string
  address: string
  fullText: string
  types?: string[]
  distanceMeters?: number
}

export type PlaceDetails = {
  place_id: string
  name: string
  formatted_address?: string
  formatted_phone?: string
  website?: string
  address_components?: {
    latitude?: number
    longitude?: number
    weekdayDescriptions?: string[]
    openNow?: boolean
  }
  photos?: string[]
  rating?: number
  user_rating_count?: number
  primary_type?: string
  primary_type_display_name?: string
  google_maps_uri?: string
  national_phone_number?: string
  regular_opening_hours?: {
    open_now?: boolean
    weekday_descriptions?: string[]
  }
}

type Step = 'search' | 'confirm' | 'activate'

const DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 2

function generateSessionToken(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

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
  const [suggestionsLoading, setSuggestionsLoading] = useState(false) // autocomplete fetch (do not disable input)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<PlaceCandidate | null>(null)
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [manualName, setManualName] = useState('')
  const [manualAddress, setManualAddress] = useState('')
  const [manualPhone, setManualPhone] = useState('')
  const [manualWebsite, setManualWebsite] = useState('')
  const [locationLabel, setLocationLabel] = useState('')
  const [clientNameOverride, setClientNameOverride] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [createdClientId, setCreatedClientId] = useState<string | null>(null)
  const [locationBias, setLocationBias] = useState<{ lat: number; lng: number } | null>(null)

  const sessionTokenRef = useRef<string>('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputContainerRef = useRef<HTMLDivElement>(null)
  const geoRequestedRef = useRef(false)

  // New session token when dialog opens; optional geolocation for autocomplete bias
  useEffect(() => {
    if (open) {
      sessionTokenRef.current = generateSessionToken()
      if (!geoRequestedRef.current && typeof navigator !== 'undefined' && navigator.geolocation) {
        geoRequestedRef.current = true
        navigator.geolocation.getCurrentPosition(
          (pos) => setLocationBias({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => {},
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
        )
      }
    }
  }, [open])

  const reset = () => {
    setStep('search')
    setQuery('')
    setSuggestions([])
    setShowSuggestions(false)
    setSelectedPlace(null)
    setPlaceDetails(null)
    setManualName('')
    setManualAddress('')
    setManualPhone('')
    setManualWebsite('')
    setLocationLabel('')
    setClientNameOverride('')
    setSearchError(null)
    setSubmitError(null)
    setCreatedClientId(null)
  }

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) reset()
    onOpenChange(isOpen)
  }

  const fetchAutocomplete = useCallback(
    async (q: string) => {
      if (!q.trim() || q.trim().length < MIN_QUERY_LENGTH) {
        setSuggestions([])
        return
      }
      setSuggestionsLoading(true)
      setSearchError(null)
      try {
        const body: { query: string; sessionToken?: string; lat?: number; lng?: number; radius?: number } = {
          query: q.trim(),
          sessionToken: sessionTokenRef.current || undefined,
        }
        if (locationBias) {
          body.lat = locationBias.lat
          body.lng = locationBias.lng
          body.radius = 5000
        }
        const res = await authenticatedFetch('/api/v1/smb/autocomplete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': orgId,
          },
          body: JSON.stringify(body),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setSearchError(data.error || data.details || 'Search failed')
          setSuggestions([])
          return
        }
        setSuggestions(data.suggestions || [])
        setShowSuggestions(true)
      } catch {
        setSearchError('Search failed')
        setSuggestions([])
      } finally {
        setSuggestionsLoading(false)
      }
    },
    [orgId, locationBias]
  )

  // Debounced autocomplete on query change
  useEffect(() => {
    if (!open || step !== 'search') return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < MIN_QUERY_LENGTH) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    debounceRef.current = setTimeout(() => {
      fetchAutocomplete(query)
      debounceRef.current = null
    }, DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, open, step, fetchAutocomplete])

  // Click outside to close suggestions
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (inputContainerRef.current && !inputContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    if (open) document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const router = useRouter()

  const fetchPlaceDetails = useCallback(
    async (placeId: string): Promise<PlaceDetails | null> => {
      const params = new URLSearchParams({ place_id: placeId })
      if (sessionTokenRef.current) params.set('session_token', sessionTokenRef.current)
      const res = await authenticatedFetch(`/api/v1/smb/place-details?${params.toString()}`, {
        headers: { 'X-Tenant-ID': orgId },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) return null
      return data as PlaceDetails
    },
    [orgId]
  )

  const goToConfirm = (details: PlaceDetails | null, candidate: PlaceCandidate | null) => {
    setPlaceDetails(details)
    setSelectedPlace(candidate)
    if (candidate) {
      setClientNameOverride(candidate.name)
      setManualName(candidate.name)
      setManualAddress(candidate.formatted_address || '')
      setManualPhone(candidate.phone || '')
      setManualWebsite(candidate.website || '')
    }
    setStep('confirm')
  }

  const handleSelectSuggestion = async (suggestion: AutocompleteSuggestion) => {
    setShowSuggestions(false)
    setLoadingDetails(true)
    setSearchError(null)
    try {
      const details = await fetchPlaceDetails(suggestion.placeId)
      if (!details) {
        setSearchError('Could not load place details')
        return
      }
      const candidate: PlaceCandidate = {
        place_id: details.place_id,
        name: details.name || suggestion.name,
        formatted_address: details.formatted_address ?? suggestion.address,
        phone: details.formatted_phone,
        website: details.website,
      }
      goToConfirm(details, candidate)
    } catch {
      setSearchError('Could not load place details')
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleNotListed = () => {
    setSelectedPlace(null)
    setPlaceDetails(null)
    setManualName('')
    setManualAddress('')
    setManualPhone('')
    setManualWebsite('')
    setClientNameOverride('')
    setStep('confirm')
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
      const clientId = data.id as string | undefined
      if (clientId) setCreatedClientId(clientId)
      onSuccess()
      setStep('activate')
    } catch {
      setSubmitError('Failed to create client')
    } finally {
      setSubmitting(false)
    }
  }

  // Auto-redirect to client dashboard after activate
  useEffect(() => {
    if (step !== 'activate' || !createdClientId) return
    const t = setTimeout(() => {
      router.push(`/agency/clients/${createdClientId}`)
      onOpenChange(false)
    }, 3000)
    return () => clearTimeout(t)
  }, [step, createdClientId, router, onOpenChange])

  const displayName = selectedPlace ? (clientNameOverride || selectedPlace.name) : manualName

  const mapEmbedKey =
    typeof process !== 'undefined'
      ? (process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY || '')
      : ''
  const showEmbeddedMap = step === 'confirm' && placeDetails?.place_id && mapEmbedKey

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
            <div ref={inputContainerRef} className="relative">
              <Input
                placeholder="Business name or address (min 2 characters)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (suggestions.length > 0) {
                      handleSelectSuggestion(suggestions[0])
                    } else {
                      setSearchError('Type to see suggestions, then select one from the list.')
                    }
                  }
                }}
                disabled={loadingDetails}
                className="w-full"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 border bg-background rounded-md shadow-lg max-h-56 overflow-y-auto">
                  {suggestions.map((s) => (
                    <button
                      key={s.placeId}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-muted/80 flex flex-col gap-0.5"
                      onClick={() => handleSelectSuggestion(s)}
                    >
                      <span className="font-medium text-sm">{s.name || s.fullText}</span>
                      {s.address && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {s.address}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {suggestionsLoading && (
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Finding suggestions...
              </p>
            )}
            {loadingDetails && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading place details...
              </p>
            )}
            {searchError && <p className="text-sm text-destructive">{searchError}</p>}
            <p className="text-xs text-muted-foreground">
              Type to see suggestions, then select one.
            </p>
            <Button type="button" variant="ghost" className="w-full justify-center" onClick={handleNotListed}>
              My business isn&apos;t listed — enter manually
            </Button>
          </div>
        )}

        {step === 'confirm' && (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {placeDetails ? (
              <>
                {showEmbeddedMap && (
                  <div className="rounded-md overflow-hidden border border-black/10 dark:border-white/10 bg-muted/30">
                    <iframe
                      title="Location map"
                      width="100%"
                      height="200"
                      style={{ border: 0 }}
                      src={`https://www.google.com/maps/embed/v1/place?key=${mapEmbedKey}&q=place_id:${placeDetails.place_id}`}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                )}
                <Card className="p-4 space-y-3 text-sm">
                  <div className="font-medium text-base">{placeDetails.name}</div>
                  {placeDetails.formatted_address && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{placeDetails.formatted_address}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 items-center">
                    {(placeDetails.rating != null && placeDetails.rating > 0) && (
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        {placeDetails.rating.toFixed(1)}
                        {(placeDetails.user_rating_count ?? 0) > 0 && (
                          <span className="text-muted-foreground">({placeDetails.user_rating_count} reviews)</span>
                        )}
                      </span>
                    )}
                    {(placeDetails.primary_type || placeDetails.primary_type_display_name) && (
                      <span className="px-2 py-0.5 rounded bg-muted text-xs capitalize">
                        {placeDetails.primary_type_display_name || placeDetails.primary_type?.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  {(placeDetails.formatted_phone || placeDetails.national_phone_number) && (
                    <div>Phone: {placeDetails.formatted_phone || placeDetails.national_phone_number}</div>
                  )}
                  {placeDetails.website && (
                    <div>
                      Website:{' '}
                      <a href={placeDetails.website.startsWith('http') ? placeDetails.website : `https://${placeDetails.website}`} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                        {placeDetails.website}
                      </a>
                    </div>
                  )}
                  {placeDetails.regular_opening_hours?.weekday_descriptions && placeDetails.regular_opening_hours.weekday_descriptions.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground flex items-center gap-1">
                        Hours
                        <ChevronDown className="w-4 h-4" />
                      </summary>
                      <ul className="list-none mt-1 space-y-0.5 text-muted-foreground">
                        {placeDetails.regular_opening_hours.weekday_descriptions.map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                  {placeDetails.google_maps_uri && (
                    <a href={placeDetails.google_maps_uri} target="_blank" rel="noopener noreferrer" className="text-primary text-xs flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      {showEmbeddedMap ? 'Open in Google Maps' : 'View on Google Maps'}
                    </a>
                  )}
                </Card>
              </>
            ) : (
              <Card className="p-4 space-y-2 text-sm">
                <div className="font-medium">Manual entry</div>
                <p className="text-muted-foreground">You’ll enter business details below.</p>
              </Card>
            )}

            <div className="grid gap-2">
              <Label htmlFor="confirm_name">Display name (client name)</Label>
              <Input
                id="confirm_name"
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
                  <Input id="address" value={manualAddress} onChange={(e) => setManualAddress(e.target.value)} placeholder="Full address" disabled={submitting} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input id="phone" value={manualPhone} onChange={(e) => setManualPhone(e.target.value)} placeholder="Phone" disabled={submitting} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="website">Website (optional)</Label>
                  <Input id="website" value={manualWebsite} onChange={(e) => setManualWebsite(e.target.value)} placeholder="https://..." disabled={submitting} />
                </div>
              </>
            )}
            {submitError && <p className="text-sm text-destructive">{submitError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStep('search')} disabled={submitting}>
                Back
              </Button>
              <Button type="submit" style={{ backgroundColor: brandColor }} className="text-white" disabled={submitting}>
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : <><Building2 className="w-4 h-4 mr-2" />Add Client</>}
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === 'activate' && (
          <div className="space-y-4 py-2">
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full text-white mb-4" style={{ backgroundColor: brandColor }}>
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg">Client added</h3>
              <p className="text-sm text-muted-foreground mt-1">Redirecting to client dashboard in a few seconds...</p>
            </div>
            <div className="flex flex-col gap-2">
              {createdClientId && (
                <>
                  <Button
                    type="button"
                    style={{ backgroundColor: brandColor }}
                    className="text-white w-full"
                    onClick={() => { router.push(`/agency/clients/${createdClientId}`); handleClose(false); }}
                  >
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Go to Client Dashboard
                  </Button>
                  <Button type="button" variant="outline" className="w-full" onClick={() => { setStep('search'); setCreatedClientId(null); onSuccess(); }}>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add another location
                  </Button>
                </>
              )}
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Connect Google Business Profile from the client dashboard for full sync.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
