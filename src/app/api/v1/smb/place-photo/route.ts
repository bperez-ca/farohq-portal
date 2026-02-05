import { NextRequest, NextResponse } from 'next/server';
import { proxyApiRequest } from '@/lib/server-api-client';
import { getClerkToken } from '@/lib/server-api-client';
import { safeLogError } from '@/lib/log-sanitizer';

/**
 * GET /api/v1/smb/place-photo?name=...&max_px=...
 * Proxies to core-app; backend returns 302 to Google's short-lived image URL. We pass the redirect through.
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
    const name = url.searchParams.get('name');
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'query parameter name is required (photo resource name)' },
        { status: 400 }
      );
    }

    const response = await proxyApiRequest('/api/v1/smb/place-photo', request, { token });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('Location');
      if (location) {
        return NextResponse.redirect(location, 302);
      }
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: data.error || 'Place photo failed', details: data.details },
        { status: response.status }
      );
    }

    return response;
  } catch (error) {
    safeLogError('SMB place-photo API error', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Place photo failed', details: message },
      { status: 500 }
    );
  }
}
