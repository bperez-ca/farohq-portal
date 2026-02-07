import { NextRequest, NextResponse } from 'next/server';
import { getClerkToken } from '@/lib/server-api-client';
import { safeLogError } from '@/lib/log-sanitizer';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8080';

/**
 * GET /api/v1/conversations?tenant_id=...&location_id=...&status=...&limit=...&offset=...
 * Lists conversations for the tenant. Proxies to Core App with X-Tenant-ID.
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getClerkToken();
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');

    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    if (tenantId) headers['X-Tenant-ID'] = tenantId;

    const query = searchParams.toString();
    const url = query ? `${API_BASE_URL}/api/v1/conversations?${query}` : `${API_BASE_URL}/api/v1/conversations`;

    const response = await fetch(url, { method: 'GET', headers });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return NextResponse.json(
        { error: 'Failed to list conversations', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    safeLogError('Conversations list API error', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to list conversations', details: message },
      { status: 500 }
    );
  }
}
