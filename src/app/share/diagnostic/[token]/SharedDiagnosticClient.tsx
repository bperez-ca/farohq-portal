'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { Card } from '@/lib/ui'
import { Button } from '@/lib/ui'
import { StatusChip } from '@/components/ui/StatusChip'
import { mockDiagnostics, mockProspects, mockBusinesses } from '@/lib/mock-data'
import { trackDiagnosticBookCall } from '@/lib/analytics'
import type { GrowthDiagnostic } from '@/lib/types'
import { AlertCircle, Clock, Star } from 'lucide-react'

/** UX-013: Shared Diagnostic — Presence/Reviews/Speed-to-lead, estimated loss, CTA. UX-015: Book call. */

const BOOK_CALL_URL = process.env.NEXT_PUBLIC_BOOK_CALL_URL || 'https://calendly.com'
const AGENCY_NAME = process.env.NEXT_PUBLIC_AGENCY_NAME || 'Your Agency'

function formatReplyTime(ms: number): string {
  const m = Math.round(ms / 60000)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const r = m % 60
  return r ? `${h}h ${r}m` : `${h}h`
}

interface SharedDiagnosticClientProps {
  token: string
}

export default function SharedDiagnosticClient({ token }: SharedDiagnosticClientProps) {
  const diagnostic = mockDiagnostics.find((d) => d.shareToken === token) as GrowthDiagnostic | undefined
  const prospect = mockProspects.find((p) => p.id === diagnostic?.prospectId)
  const business = mockBusinesses.find((b) => b.id === diagnostic?.prospectId)
  const businessName = prospect?.name || business?.name || 'Your Business'

  const trackBookCall = useCallback(() => {
    trackDiagnosticBookCall(token, diagnostic?.id)
  }, [token, diagnostic?.id])

  if (!diagnostic) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
        <Card className="p-8 max-w-md text-center rounded-xl shadow-sm">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Diagnostic Not Found</h1>
          <p className="text-muted-foreground">
            This diagnostic link may have expired or been removed.
          </p>
        </Card>
      </div>
    )
  }

  const estimatedLoss = Math.round(
    ((100 - diagnostic.presenceScore) * 10 +
      (100 - diagnostic.reviewsScore) * 12 +
      (100 - diagnostic.speedToLeadScore) * 15) *
      2
  )
  const avgReply = formatReplyTime(diagnostic.findings.speedToLead.avgReplyMs)
  const recommended = formatReplyTime(diagnostic.findings.speedToLead.recommendedMs)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-800 pb-20">
      <div className="bg-primary text-primary-foreground px-6 py-3 text-center text-sm">
        Shared by <span className="font-semibold">{AGENCY_NAME}</span>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">{businessName} Growth Diagnostic</h1>
          <p className="text-xl text-foreground mb-2">
            Quick wins to get you more calls this week.
          </p>
          <p className="text-muted-foreground">
            Presence, Reviews, and Speed-to-Lead show where to focus first.
          </p>
        </div>

        {estimatedLoss > 500 && (
          <Card className="p-6 mb-6 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900 rounded-xl">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2 text-orange-900 dark:text-orange-100">
                  Estimated ${estimatedLoss.toLocaleString()}/month left on the table
                </h3>
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  Based on slow response times, inconsistent listings, and missed review opportunities.
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">Online Presence</h2>
            <Card className="rounded-xl overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Listing Accuracy</h3>
                    <p className="text-sm text-muted-foreground">
                      {diagnostic.presenceScore >= 80
                        ? 'Your listings are mostly consistent'
                        : "Business info isn't consistent across platforms"}
                    </p>
                  </div>
                  <span
                    className={`text-3xl font-bold ${
                      diagnostic.presenceScore >= 80 ? 'text-green-600' : diagnostic.presenceScore >= 60 ? 'text-yellow-600' : 'text-orange-600'
                    }`}
                  >
                    {diagnostic.presenceScore}%
                  </span>
                </div>
              </div>
              <div className="divide-y">
                {diagnostic.findings.presence.map((item, i) => (
                  <div key={i} className="px-6 py-3 flex items-center justify-between">
                    <span className="font-medium">{item.platform}</span>
                    <StatusChip
                      variant={item.status === 'Consistent' ? 'synced' : 'needsAttention'}
                      label={item.status === 'Consistent' ? 'Synced' : 'Needs attention'}
                    />
                  </div>
                ))}
              </div>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Reviews & Trust</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <h3 className="font-semibold text-lg">Current Rating</h3>
                </div>
                <div className="text-4xl font-bold mb-2">{diagnostic.findings.reviews.currentRating.toFixed(1)}</div>
                <p className="text-sm text-muted-foreground">{diagnostic.findings.reviews.last30} reviews in the last 30 days</p>
              </Card>
              <Card className="p-6 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-orange-500" />
                  <h3 className="font-semibold text-lg">Opportunity</h3>
                </div>
                <div className="text-4xl font-bold mb-2 text-orange-600">{diagnostic.findings.reviews.goal.toFixed(1)}</div>
                <p className="text-sm text-muted-foreground">Potential rating if you ask happy customers for reviews</p>
              </Card>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Speed to Lead</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <h3 className="font-semibold text-lg">Your Avg Reply Time</h3>
                </div>
                <div className="text-4xl font-bold mb-2">{avgReply}</div>
                <StatusChip
                  variant={diagnostic.speedToLeadScore >= 80 ? 'synced' : diagnostic.speedToLeadScore >= 60 ? 'needsAttention' : 'notConnected'}
                  label={diagnostic.speedToLeadScore >= 80 ? 'Excellent' : diagnostic.speedToLeadScore >= 60 ? 'Good' : 'Needs work'}
                />
              </Card>
              <Card className="p-6 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-lg">Top Performers</h3>
                </div>
                <div className="text-4xl font-bold mb-2 text-green-600">{recommended}</div>
                <StatusChip variant="synced" label="Industry best" />
              </Card>
            </div>
            {diagnostic.speedToLeadScore < 80 && (
              <Card className="p-6 mt-4 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 rounded-xl">
                <h3 className="font-semibold mb-2 text-red-900 dark:text-red-100">The cost of waiting</h3>
                <p className="text-sm text-red-700 dark:text-red-200">
                  Replying within 5 minutes makes you 9x more likely to close. Every hour you wait, close rate drops.
                </p>
              </Card>
            )}
          </section>
        </div>

        <Card className="p-8 mt-8 text-center rounded-xl bg-primary/5 border-primary/20">
          <h2 className="text-2xl font-bold mb-4">Ready to fix this?</h2>
          <p className="text-muted-foreground mb-6">
            We'll help you sync listings, boost reviews, and respond to leads fast. Track every dollar in one dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <a href={BOOK_CALL_URL} target="_blank" rel="noopener noreferrer" onClick={trackBookCall}>
                Book intro call
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/">Learn more</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
