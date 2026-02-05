'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Label,
  Card,
} from '@/lib/ui'
import { Loader2, Zap } from 'lucide-react'
import { authenticatedFetch } from '@/lib/authenticated-fetch'

export type Plan = {
  id: string
  name: string
  features: string[]
}

type ActivateClientModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: string
  clientId: string
  clientName: string
  onSuccess: () => void
  brandColor?: string
}

export function ActivateClientModal({
  open,
  onOpenChange,
  orgId,
  clientId,
  clientName,
  onSuccess,
  brandColor = '#2563eb',
}: ActivateClientModalProps) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [selectedLayer, setSelectedLayer] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    setSelectedLayer('')
    let cancelled = false
    setLoadingPlans(true)
    authenticatedFetch('/api/v1/smb/plans', { headers: { 'X-Tenant-ID': orgId } })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        setPlans(data.plans || [])
        if (data.plans?.length && !selectedLayer) {
          setSelectedLayer(data.plans[0].id)
        }
      })
      .catch(() => {
        if (!cancelled) setPlans([])
      })
      .finally(() => {
        if (!cancelled) setLoadingPlans(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, orgId])

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLayer) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await authenticatedFetch(
        `/api/v1/tenants/${orgId}/clients/${clientId}/activate`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': orgId,
          },
          body: JSON.stringify({ layer: selectedLayer }),
        }
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 409) {
          setError('Client is already active.')
          onSuccess()
          onOpenChange(false)
          return
        }
        setError(data.error || data.details || 'Failed to activate')
        setSubmitting(false)
        return
      }
      onSuccess()
      onOpenChange(false)
    } catch {
      setError('Failed to activate client')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Activate client</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Choose a plan for <strong>{clientName}</strong>. This will enable features and can start billing.
          </p>
        </DialogHeader>
        <form onSubmit={handleActivate} className="space-y-4 py-2">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {loadingPlans ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Plan</Label>
              <div className="grid gap-2">
                {plans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`p-3 cursor-pointer transition-colors ${
                      selectedLayer === plan.id
                        ? 'ring-2 ring-primary'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedLayer(plan.id)}
                  >
                    <div className="font-medium">{plan.name}</div>
                    {plan.features?.length > 0 && (
                      <ul className="text-xs text-muted-foreground mt-1 list-disc list-inside">
                        {plan.features.slice(0, 4).map((f) => (
                          <li key={f}>{f.replace(/_/g, ' ')}</li>
                        ))}
                      </ul>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              style={{ backgroundColor: brandColor }}
              className="text-white"
              disabled={submitting || !selectedLayer || loadingPlans}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Activating...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Activate
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
