'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/lib/ui'
import { CheckCircle2, Circle, ExternalLink } from 'lucide-react'
import type { OnboardingData } from '@/components/onboarding/OnboardingWizard'

interface SuccessScreenProps {
  data: OnboardingData
}

/** UX-001: Success + "What's next" checklist (UX-003). */
const WHATS_NEXT = [
  { id: 'gbp', label: 'Connect Google Business Profile', href: '/agency/settings/branding' },
  { id: 'lead', label: 'Respond to 1 lead', href: '/business/inbox' },
  { id: 'review', label: 'Reply to 1 review', href: '/business/reviews' },
  { id: 'request', label: 'Request 1 review', href: '/business/reviews' },
  { id: 'listing', label: 'Fix 1 listing', href: '/business/presence' },
] as const

export function SuccessScreen({ data }: SuccessScreenProps) {
  const router = useRouter()
  const brandColor = data.brandColor || '#2563eb'

  const goToDashboard = () => {
    if (data.tenantId && typeof window !== 'undefined') {
      localStorage.setItem('farohq_active_org_id', data.tenantId)
    }
    router.push('/agency/dashboard')
  }

  return (
    <Card className="text-center">
      <CardHeader>
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: `${brandColor}20` }}
        >
          <CheckCircle2 className="w-10 h-10" style={{ color: brandColor }} />
        </div>
        <CardTitle className="text-3xl">Your portal is live.</CardTitle>
        <CardDescription className="text-base mt-2">
          We created your dashboard and the first client profile. You&apos;re ready to
          share the report and show ROI.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={goToDashboard} style={{ backgroundColor: brandColor }}>
            Go to Dashboard
          </Button>
          <Link href="/agency/settings/invites">
            <Button size="lg" variant="outline">
              Invite Client Now
            </Button>
          </Link>
        </div>

        <div className="text-left border-t pt-6 mt-6">
          <h3 className="font-semibold mb-3">What&apos;s next?</h3>
          <ul className="space-y-2">
            {WHATS_NEXT.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-sm">
                <Circle className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                <Link
                  href={item.href}
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  {item.label}
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-muted-foreground">
          Invited clients get a link to log in and see only their data, under your brand.
        </p>
      </CardContent>
    </Card>
  )
}
