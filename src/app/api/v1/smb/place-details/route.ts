import { NextRequest, NextResponse } from 'next/server';
import { proxyApiRequest, getClerkToken } from '@/lib/server-api-client';
import { safeLogError } from '@/lib/log-sanitizer';

/**
 * GET /api/v1/smb/place-details?place_id=...
 * Proxies Google Place Details to core-app. Requires auth.
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getClerkToken();
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const placeId = url.searchParams.get('place_id');
    if (!placeId || !placeId.trim()) {
      return NextResponse.json(
        { error: 'query parameter place_id is required' },
        { status: 400 }
      );
    }

    const response = await proxyApiRequest('/api/v1/smb/place-details', request, { token });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Place details failed', details: data.details },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    safeLogError('Place details API error', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Place details failed', details: message },
      { status: 500 }
    );
  }
}
