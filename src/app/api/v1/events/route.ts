import { NextRequest, NextResponse } from 'next/server'

/**
 * UX-016 / UX-017: Funnel events. POST body: { event, ...props }.
 * Logs events; can forward to backend or analytics later.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { event, ...props } = body as { event?: string; [k: string]: unknown }
    if (event && typeof event === 'string') {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log('[events]', event, props)
      }
    }
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}
