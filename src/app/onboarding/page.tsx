'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'
import { useAuthSessionOptional } from '@/contexts/AuthSessionContext'

/** UX-001: Unified onboarding wizard — Agency → First Client → Connect GBP → Success. */
export default function OnboardingPage() {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const session = useAuthSessionOptional()

  useEffect(() => {
    if (!isLoaded || !user) return
    if (session?.loading) return

    if (session && session.orgCount > 0) {
      router.push('/agency/dashboard')
    }
  }, [isLoaded, user, session?.loading, session?.orgCount, router])

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
