'use client'

import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/lib/ui'
import { ExternalLink } from 'lucide-react'
import type { OnboardingData } from '@/components/onboarding/OnboardingWizard'

interface ConnectGbpStepProps {
  data: OnboardingData
  onComplete: () => void
}

/** UX-001: Connect GBP step — placeholder for pilots; real OAuth later. */
export function ConnectGbpStep({ data, onComplete }: ConnectGbpStepProps) {
  const brandColor = data.brandColor || '#2563eb'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Connect Google Business Profile</CardTitle>
        <CardDescription>
          Link your business to sync listings, reviews, and leads. You can do this later in settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          For now, you can skip this step and connect Google when you&apos;re ready. We&apos;ll remind you from your dashboard.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onComplete}
            style={{ backgroundColor: brandColor }}
            className="flex-1"
          >
            Skip for now — continue
          </Button>
          <Button
            variant="outline"
            asChild
            className="flex-1"
          >
            <a href="/agency/settings/branding" target="_blank" rel="noopener noreferrer">
              Open settings
              <ExternalLink className="w-4 h-4 ml-2" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
