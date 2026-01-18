'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'

interface PoweredByBadgeProps {
  hidePoweredBy?: boolean
  canHidePoweredBy?: boolean
  tier?: string
}

export function PoweredByBadge({ hidePoweredBy, canHidePoweredBy, tier: propTier }: PoweredByBadgeProps) {
  const [shouldHide, setShouldHide] = useState(false)
  const [brandData, setBrandData] = useState<{
    hide_powered_by?: boolean
    can_hide_powered_by?: boolean
    tier?: string
  } | null>(null)

  // Fetch brand data to get tier-based flags
  useEffect(() => {
    const fetchBrandData = async () => {
      try {
        const host = window.location.host
        const response = await axios.get(`/api/v1/brand/by-host?host=${host}`, {
          withCredentials: true,
        })

        if (response.data) {
          setBrandData({
            hide_powered_by: response.data.hide_powered_by,
            can_hide_powered_by: response.data.can_hide_powered_by,
            tier: response.data.tier,
          })
        }
      } catch (error) {
        console.error('Failed to fetch brand data for PoweredByBadge:', error)
        // Continue with default behavior (show badge)
      }
    }

    fetchBrandData()
  }, [])

  useEffect(() => {
    // Use brandData if available, otherwise use props
    const hidePoweredByValue = brandData?.hide_powered_by ?? hidePoweredBy ?? false
    const canHideValue = brandData?.can_hide_powered_by ?? canHidePoweredBy ?? false
    const tierValue = brandData?.tier ?? propTier

    // Only hide if:
    // 1. hide_powered_by is true AND
    // 2. tier allows hiding (Growth+ tiers)
    // 3. can_hide_powered_by flag is true (from backend)
    if (hidePoweredByValue && canHideValue && (tierValue === 'growth' || tierValue === 'scale')) {
      setShouldHide(true)
    } else {
      setShouldHide(false)
    }
  }, [hidePoweredBy, canHidePoweredBy, propTier, brandData])

  if (shouldHide) {
    return null
  }

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <a
        href="https://farohq.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 px-2 py-1 bg-background/80 backdrop-blur-sm rounded border border-border/50 shadow-sm"
      >
        Powered by <span className="font-semibold">Faro</span>
      </a>
    </div>
  )
}
