import { NextRequest, NextResponse } from 'next/server';
import { getClerkToken } from '@/lib/server-api-client';
import { safeLogError } from '@/lib/log-sanitizer';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8080';

/**
 * GET /api/v1/gbp/oauth/url?location_id=...&tenant_id=...
 * Returns the Google OAuth authorization URL for connecting GBP to a location.
 * Requires tenant_id so the proxy can send X-Tenant-ID to the backend.
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

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('location_id');
    const tenantId = searchParams.get('tenant_id');

    if (!locationId) {
      return NextResponse.json(
        { error: 'location_id is required' },
        { status: 400 }
      );
    }

    const url = new URL(`${API_BASE_URL}/api/v1/gbp/oauth/url`);
    url.searchParams.set('location_id', locationId);

    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    if (tenantId) {
      headers['X-Tenant-ID'] = tenantId;
    }

    const response = await fetch(url.toString(), { method: 'GET', headers });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message =
        (errorBody as { error?: string }).error ||
        'Failed to get GBP OAuth URL';
      return NextResponse.json(
        { error: message },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    safeLogError('GBP OAuth URL API error', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to get GBP OAuth URL', details: message },
      { status: 500 }
    );
  }
}
