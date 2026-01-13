'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Button } from '@farohq/ui'

// Simple dropdown implementation using native select for now
// Can be upgraded to use DropdownMenu component if available

interface Org {
  id: string
  name: string
  slug: string
  role: string
}

interface OrgSelectorProps {
  className?: string
}

const ACTIVE_ORG_KEY = 'farohq_active_org_id'

export function OrgSelector({ className }: OrgSelectorProps) {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [orgs, setOrgs] = useState<Org[]>([])
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoaded || !user) {
      return
    }

    async function loadOrgs() {
      try {
        setLoading(true)
        const response = await fetch('/api/v1/tenants/my-orgs', {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          const orgsList = data.orgs || []
          setOrgs(orgsList)

          // Get active org from localStorage or default to first org
          const storedActiveOrgId = localStorage.getItem(ACTIVE_ORG_KEY)
          if (storedActiveOrgId && orgsList.find((o: Org) => o.id === storedActiveOrgId)) {
            setActiveOrgId(storedActiveOrgId)
          } else if (orgsList.length > 0) {
            // Default to first org
            const firstOrg = orgsList[0]
            setActiveOrgId(firstOrg.id)
            localStorage.setItem(ACTIVE_ORG_KEY, firstOrg.id)
          }
        }
      } catch (error) {
        console.error('Failed to load orgs:', error)
      } finally {
        setLoading(false)
      }
    }

    loadOrgs()
  }, [isLoaded, user])

  const handleOrgChange = (orgId: string) => {
    localStorage.setItem(ACTIVE_ORG_KEY, orgId)
    setActiveOrgId(orgId)
    // Reload page to reflect org change
    router.refresh()
  }

  if (loading || orgs.length <= 1) {
    return null // Don't show selector if loading or <= 1 org
  }

  const activeOrg = orgs.find((o) => o.id === activeOrgId) || orgs[0]

  return (
    <div className={className}>
      <select
        value={activeOrgId || ''}
        onChange={(e) => handleOrgChange(e.target.value)}
        className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {orgs.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>
    </div>
  )
}
