'use client'

import { useRouter } from 'next/navigation'
import { useAuthSession } from '@/contexts/AuthSessionContext'

// Simple dropdown implementation using native select for now
// Can be upgraded to use DropdownMenu component if available

interface OrgSelectorProps {
  className?: string
}

export function OrgSelector({ className }: OrgSelectorProps) {
  const router = useRouter()
  const { orgs, activeOrgId, setActiveOrgId, loading } = useAuthSession()

  const handleOrgChange = (orgId: string) => {
    setActiveOrgId(orgId)
    router.refresh()
  }

  if (loading || orgs.length <= 1) {
    return null // Don't show selector if loading or <= 1 org
  }

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
