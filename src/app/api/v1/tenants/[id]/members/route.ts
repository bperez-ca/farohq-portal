import { NextRequest, NextResponse } from 'next/server';
import { getClerkToken, getValidatedTenantId } from '@/lib/server-api-client';
import { safeLogError } from '@/lib/log-sanitizer';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8080';

/**
 * GET /api/v1/tenants/{id}/members
 * List members of a tenant (for assignment dropdown, etc.).
 * Validates user has access to the tenant.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params;

    const token = await getClerkToken();
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const validatedTenantId = await getValidatedTenantId(tenantId, token, request);

    const response = await fetch(`${API_BASE_URL}/api/v1/tenants/${validatedTenantId}/members`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Tenant-ID': validatedTenantId,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return NextResponse.json(
        { error: 'Failed to fetch members', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    safeLogError('List members API error', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Authentication required') || message.includes('access')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Failed to fetch members', details: message },
      { status: 500 }
    );
  }
}
