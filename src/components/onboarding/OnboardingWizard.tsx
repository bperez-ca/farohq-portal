'use client'

import { useState, useEffect } from 'react'
import { BrandingForm } from '@/components/onboarding/BrandingForm'
import { LocationForm } from '@/components/onboarding/LocationForm'
import { ConnectGbpStep } from '@/components/onboarding/ConnectGbpStep'
import { SuccessScreen } from '@/components/onboarding/SuccessScreen'
import { trackOnboardingStep } from '@/lib/analytics'
import { CheckCircle2 } from 'lucide-react'

export interface OnboardingData {
  // Step 1: Branding
  agencyName: string
  logoUrl?: string
  faviconUrl?: string
  brandColor: string
  secondaryColor?: string
  website?: string
  customDomain?: string
  subdomain?: string

  // Step 2: First Client
  businessName: string
  industry: string
  city: string
  phone: string
  gbpUrl?: string

  // Created resources
  tenantId?: string
  clientId?: string
  locationId?: string
  tier?: string
}

const STEP_LABELS = ['Agency', 'First client', 'Connect GBP', 'Done'] as const

export function OnboardingWizard() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<OnboardingData>({
    agencyName: '',
    brandColor: '#2563eb',
    businessName: '',
    industry: '',
    city: '',
    phone: '',
  })

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }

  const handleStep1Complete = (step1Data: Partial<OnboardingData>) => {
    updateData(step1Data)
    trackOnboardingStep(1)
    setStep(2)
  }

  const handleStep2Complete = (step2Data: Partial<OnboardingData>) => {
    updateData(step2Data)
    trackOnboardingStep(2)
    setStep(3)
  }

  const handleStep3Complete = () => {
    trackOnboardingStep(3)
    setStep(4)
  }

  useEffect(() => {
    if (step === 4) trackOnboardingStep(4)
  }, [step])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress indicator — UX-001: 4 steps */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-1 sm:gap-2 text-sm text-muted-foreground mb-2">
            {STEP_LABELS.map((label, i) => (
              <span key={label} className="sr-only sm:not-sr-only sm:inline">
                {i > 0 && <span className="text-slate-300 dark:text-slate-600 mx-0.5">·</span>}
                <span className={step >= i + 1 ? 'font-medium' : ''}>{label}</span>
              </span>
            ))}
          </div>
          <div className="flex items-center justify-center gap-0.5 sm:gap-1">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors text-sm ${
                    step >= s
                      ? 'bg-brand text-white'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  {step > s ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={`h-0.5 w-3 sm:w-4 transition-colors ${
                      step > s ? 'bg-brand' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {step === 1 && (
          <BrandingForm data={data} onComplete={handleStep1Complete} />
        )}
        {step === 2 && (
          <LocationForm data={data} onComplete={handleStep2Complete} />
        )}
        {step === 3 && (
          <ConnectGbpStep data={data} onComplete={handleStep3Complete} />
        )}
        {step === 4 && <SuccessScreen data={data} />}
      </div>
    </div>
  )
}
