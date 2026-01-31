/**
 * UX-016: Onboarding funnel instrumentation.
 * UX-017: TTFV = time from account creation → first successful reply (review or lead).
 *   Emit first_review_reply_sent / first_inbox_reply_sent when user sends; compute TTFV
 *   from account_created_at (onboarding) and first_value_at (first reply) in analytics.
 */

export type FunnelEvent =
  | 'signup_started'
  | 'onboarding_step_completed'
  | 'gbp_connected'
  | 'gbp_skipped'
  | 'diagnostic_book_call_click'
  | 'first_review_reply_sent'
  | 'first_inbox_reply_sent'

export interface EventPayload {
  event: FunnelEvent
  [key: string]: unknown
}

/** Emit funnel event. Logs; optionally POSTs to /api/v1/events if implemented. */
export function trackEvent(event: FunnelEvent, props: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return
  const payload: EventPayload = { event, ...props }
  try {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[analytics]', payload)
    }
    fetch('/api/v1/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include',
    }).catch(() => {})
  } catch {
    // no-op
  }
}

export function trackSignupStarted(): void {
  trackEvent('signup_started')
}

export function trackOnboardingStep(step: number): void {
  trackEvent('onboarding_step_completed', { step })
}

export function trackGbpConnected(): void {
  trackEvent('gbp_connected')
}

export function trackGbpSkipped(): void {
  trackEvent('gbp_skipped')
}

export function trackDiagnosticBookCall(token: string, diagnosticId?: string): void {
  trackEvent('diagnostic_book_call_click', { token, diagnostic_id: diagnosticId })
}

export function trackFirstReviewReply(): void {
  trackEvent('first_review_reply_sent')
}

export function trackFirstInboxReply(): void {
  trackEvent('first_inbox_reply_sent')
}
