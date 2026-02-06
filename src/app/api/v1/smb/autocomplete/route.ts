import { NextRequest, NextResponse } from 'next/server';
import { serverApiRequest, getClerkToken } from '@/lib/server-api-client';
import { headers } from 'next/headers';
import { safeLogError } from '@/lib/log-sanitizer';

/**
 * POST /api/v1/smb/autocomplete
 * Body: { query: string, sessionToken?: string, lat?: number, lng?: number, radius?: number }
 * Proxies to core-app Places Autocomplete (New) API. Requires auth.
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getClerkToken();
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const query = typeof body.query === 'string' ? body.query.trim() : '';
    if (!query) {
      return NextResponse.json(
        { error: 'query is required' },
        { status: 400 }
      );
    }

    const headersList = await headers();
    const xTenantId = headersList.get('x-tenant-id');
    const headersInit: HeadersInit = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
    if (xTenantId) headersInit['X-Tenant-ID'] = xTenantId;

    const response = await serverApiRequest('/api/v1/smb/autocomplete', {
      method: 'POST',
      headers: headersInit,
      body: JSON.stringify({
        query,
        sessionToken: body.sessionToken || undefined,
        lat: typeof body.lat === 'number' ? body.lat : undefined,
        lng: typeof body.lng === 'number' ? body.lng : undefined,
        radius: typeof body.radius === 'number' ? body.radius : undefined,
      }),
      token,
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Autocomplete failed', details: data.details },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    safeLogError('SMB autocomplete API error', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Autocomplete failed', details: message },
      { status: 500 }
    );
  }
}
