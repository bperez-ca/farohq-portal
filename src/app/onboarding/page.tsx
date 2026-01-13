'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { AgencyOnboardingForm } from '@/components/onboarding/AgencyOnboardingForm'
import { OnboardingSuccess } from '@/components/onboarding/OnboardingSuccess'

export default function OnboardingPage() {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [step, setStep] = useState(1)
  const [agencyName, setAgencyName] = useState('')
  const [subdomain, setSubdomain] = useState<string | undefined>(undefined)

  // Check if user already has orgs - if yes, redirect to dashboard
  useEffect(() => {
    if (!isLoaded || !user) {
      return
    }

    async function checkOrgs() {
      try {
        const response = await fetch('/api/v1/tenants/my-orgs/count', {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          if (data.count > 0) {
            // User already has orgs, redirect to dashboard
            router.push('/dashboard')
          }
        }
      } catch (error) {
        console.error('Failed to check orgs:', error)
        // Continue with onboarding on error
      }
    }

    checkOrgs()
  }, [isLoaded, user, router])

  const handleComplete = async (data: {
    agencyName: string
    slug: string
    website?: string
    brandColor: string
    logoUrl?: string
  }) => {
    setAgencyName(data.agencyName)
    // Generate subdomain suggestion (same logic as in form)
    if (data.website) {
      const domain = data.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split(':')[0]
      const slug = domain.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      setSubdomain(`${slug}.app.farohq.com`)
    } else if (data.agencyName) {
      const slug = data.slug || data.agencyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      setSubdomain(`${slug}.app.farohq.com`)
    }
    setStep(2)
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {step === 1 && (
          <AgencyOnboardingForm onComplete={handleComplete} />
        )}        {step === 2 && (
          <OnboardingSuccess 
            agencyName={agencyName}
            subdomain={subdomain}
          />
        )}
      </div>
    </div>
  )
}
