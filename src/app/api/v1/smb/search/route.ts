import { NextRequest, NextResponse } from 'next/server';
import { proxyApiRequest } from '@/lib/server-api-client';
import { getClerkToken } from '@/lib/server-api-client';
import { safeLogError } from '@/lib/log-sanitizer';

/**
 * GET /api/v1/smb/search?q=...
 * Proxies SMB (Google Places) search to core-app. Requires auth.
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
    const q = url.searchParams.get('q');
    if (!q || !q.trim()) {
      return NextResponse.json(
        { error: 'query parameter q is required' },
        { status: 400 }
      );
    }

    const response = await proxyApiRequest('/api/v1/smb/search', request, { token });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'SMB search failed', details: data.details },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    safeLogError('SMB search API error', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'SMB search failed', details: message },
      { status: 500 }
    );
  }
}
