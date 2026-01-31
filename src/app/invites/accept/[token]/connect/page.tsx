'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/lib/ui'
import { Button } from '@/lib/ui'
import { ExternalLink } from 'lucide-react'
import { trackGbpSkipped } from '@/lib/analytics'

/** UX-002: Invite-first SMB — Connect Google/WhatsApp stepper, "Skip for now" + reminders. */
const SKIPPED_KEY = 'farohq_connect_skipped'

export default function InviteConnectPage() {
  const router = useRouter()
  const params = useParams()
  const token = params?.token as string

  useEffect(() => {
    if (!token) router.replace('/dashboard')
  }, [token, router])

  const handleSkip = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SKIPPED_KEY, 'true')
    }
    trackGbpSkipped()
    router.push('/dashboard')
  }

  const handleConnectGoogle = () => {
    router.push('/agency/settings/branding')
  }

  if (!token) return null

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Connect your channels</CardTitle>
            <CardDescription>
              Link Google Business Profile and WhatsApp to sync leads and reviews. You can do this later in settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <span className="font-medium text-sm">Google Business Profile</span>
                <Button size="sm" variant="outline" onClick={handleConnectGoogle}>
                  Connect
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <span className="font-medium text-sm">WhatsApp</span>
                <span className="text-xs text-muted-foreground">Coming soon</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button className="w-full" onClick={handleSkip}>
                Skip for now — go to dashboard
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href="/agency/settings/branding">
                  Open settings
                  <ExternalLink className="w-3.5 h-3.5 ml-2" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
