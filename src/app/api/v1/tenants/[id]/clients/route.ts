import { NextRequest, NextResponse } from 'next/server';
import { getClerkToken, getValidatedTenantId } from '@/lib/server-api-client';
import { safeLogError } from '@/lib/log-sanitizer';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8080';

/**
 * GET /api/v1/tenants/{id}/clients
 * List clients for a tenant (agency). Returns only the tenant's clients.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params;

    const token = await getClerkToken();
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const validatedTenantId = await getValidatedTenantId(tenantId, token, request);

    const response = await fetch(`${API_BASE_URL}/api/v1/tenants/${validatedTenantId}/clients`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': validatedTenantId,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return NextResponse.json(
        { error: 'Failed to list clients', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    safeLogError('List clients API error', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to list clients', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/tenants/{id}/clients
 * Create a new client (SMB) under the tenant. Used in onboarding "First Client" step (UX-001).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params;

    const token = await getClerkToken();
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const validatedTenantId = await getValidatedTenantId(tenantId, token, request);
    const body = await request.json();
    const { name, slug, tier } = body as { name?: string; slug?: string; tier?: string };

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'name and slug are required' },
        { status: 400 }
      );
    }

    const tierValue = tier && ['starter', 'growth', 'scale'].includes(tier) ? tier : 'starter';

    const clientResponse = await fetch(`${API_BASE_URL}/api/v1/tenants/${validatedTenantId}/clients`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': validatedTenantId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, slug, tier: tierValue }),
    });

    if (!clientResponse.ok) {
      const errorText = await clientResponse.text().catch(() => 'Unknown error');
      return NextResponse.json(
        { error: 'Failed to create client', details: errorText },
        { status: clientResponse.status }
      );
    }

    const data = await clientResponse.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    safeLogError('Create client API error', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create client', details: errorMessage },
      { status: 500 }
    );
  }
}
