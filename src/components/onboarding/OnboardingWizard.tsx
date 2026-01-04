'use client'

import { useState } from 'react'
import { BrandingForm } from './BrandingForm'
import { LocationForm } from './LocationForm'
import { SuccessScreen } from './SuccessScreen'
import { Card } from '@farohq/ui'
import { CheckCircle2 } from 'lucide-react'

export interface OnboardingData {
  // Step 1: Branding
  agencyName: string
  logoUrl?: string
  brandColor: string
  customDomain?: string
  
  // Step 2: Location
  businessName: string
  industry: string
  city: string
  phone: string
  gbpUrl?: string
  
  // Created resources
  tenantId?: string
  locationId?: string
}

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
    setStep(2)
  }

  const handleStep2Complete = (step2Data: Partial<OnboardingData>) => {
    updateData(step2Data)
    setStep(3)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress Indicator */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                step >= 1
                  ? 'bg-blue-600 text-white dark:bg-blue-500'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              {step > 1 ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                '1'
              )}
            </div>
            <div
              className={`h-0.5 transition-colors ${
                step >= 2 ? 'w-16 bg-blue-600 dark:bg-blue-500' : 'w-16 bg-slate-200 dark:bg-slate-700'
              }`}
            />
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                step >= 2
                  ? 'bg-blue-600 text-white dark:bg-blue-500'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              {step > 2 ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                '2'
              )}
            </div>
            <div
              className={`h-0.5 transition-colors ${
                step >= 3 ? 'w-16 bg-blue-600 dark:bg-blue-500' : 'w-16 bg-slate-200 dark:bg-slate-700'
              }`}
            />
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                step >= 3
                  ? 'bg-blue-600 text-white dark:bg-blue-500'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              3
            </div>
          </div>
        </div>

        {/* Step Content */}
        {step === 1 && (
          <BrandingForm
            data={data}
            onComplete={handleStep1Complete}
          />
        )}

        {step === 2 && (
          <LocationForm
            data={data}
            onComplete={handleStep2Complete}
          />
        )}

        {step === 3 && (
          <SuccessScreen data={data} />
        )}
      </div>
    </div>
  )
}






