'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'

/** UX-001: Unified onboarding wizard — Agency → First Client → Connect GBP → Success. */
export default function OnboardingPage() {
  const router = useRouter()
  const { user, isLoaded } = useUser()

  useEffect(() => {
    if (!isLoaded || !user) return

    async function checkOrgs() {
      try {
        const res = await fetch('/api/v1/tenants/my-orgs/count', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          if (data.count > 0) router.push('/agency/dashboard')
        }
      } catch {
        // continue with onboarding
      }
    }
    checkOrgs()
  }, [isLoaded, user, router])

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return <OnboardingWizard />
}
