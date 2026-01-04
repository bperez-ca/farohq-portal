'use client'

import Link from 'next/link'
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@farohq/ui'
import { CheckCircle2 } from 'lucide-react'
import type { OnboardingData } from './OnboardingWizard'

interface SuccessScreenProps {
  data: OnboardingData
}

export function SuccessScreen({ data }: SuccessScreenProps) {
  const brandColor = data.brandColor || '#2563eb'

  return (
    <Card className="text-center">
      <CardHeader>
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: `${brandColor}20` }}
        >
          <CheckCircle2
            className="w-10 h-10"
            style={{ color: brandColor }}
          />
        </div>
        <CardTitle className="text-3xl">Your portal is live.</CardTitle>
        <CardDescription className="text-base mt-2">
          We created your dashboard and the first client profile. You're ready to
          share the report and show ROI.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link href="/agency/dashboard">
            <Button size="lg" style={{ backgroundColor: brandColor }}>
              View My Agency Dashboard
            </Button>
          </Link>
          <Link href="/snapshot">
            <Button size="lg" variant="outline">
              Invite Client Now
            </Button>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground mt-6">
          They'll get a link to log in and see only their data, under your brand.
        </p>
      </CardContent>
    </Card>
  )
}






