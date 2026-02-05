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

/** Request body for creating a client: place_id path, manual path, or legacy name+slug+tier */
type CreateClientBody = {
  place_id?: string
  client_name_override?: string
  location_label?: string
  name?: string
  slug?: string
  tier?: string
  address?: Record<string, unknown>
  phone?: string
  website?: string
  social_links?: Record<string, string>
}

/**
 * POST /api/v1/tenants/{id}/clients
 * Create a new client (SMB) under the tenant.
 * Accepts: (1) place_id + optional client_name_override, location_label, tier
 *          (2) name + optional address, phone, website, social_links, slug, tier (manual)
 *          (3) name, slug, tier (legacy, client only)
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
    const body = (await request.json()) as CreateClientBody;

    // Legacy path: require name and slug if not using place_id or manual with fields
    if (!body.place_id && !(body.name && (body.address || body.phone || body.website))) {
      if (!body.name?.trim() || !(body.slug?.trim() || body.name?.trim())) {
        return NextResponse.json(
          { error: 'name and slug are required when not using place_id or full manual fields' },
          { status: 400 }
        );
      }
    }

    const tierValue = body.tier && ['starter', 'growth', 'scale'].includes(body.tier) ? body.tier : 'starter';
    const payload: CreateClientBody & { tier: string } = {
      ...body,
      tier: tierValue,
    };

    const clientResponse = await fetch(`${API_BASE_URL}/api/v1/tenants/${validatedTenantId}/clients`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': validatedTenantId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
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
