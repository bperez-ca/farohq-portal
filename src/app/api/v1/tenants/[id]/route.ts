import { NextRequest, NextResponse } from 'next/server';
import { getClerkToken, getValidatedTenantId } from '@/lib/server-api-client';
import { safeLogError } from '@/lib/log-sanitizer';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8080';

/**
 * GET /api/v1/tenants/{id}
 * Get tenant information by ID
 * Uses standard token validation pattern (validates user has access to tenant)
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

    // Validate user has access to this tenant (standard pattern)
    const validatedTenantId = await getValidatedTenantId(tenantId, token, request);

    // Fetch tenant information using direct fetch with Bearer token and X-Tenant-ID header
    const tenantResponse = await fetch(`${API_BASE_URL}/api/v1/tenants/${validatedTenantId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': validatedTenantId, // Backend requires X-Tenant-ID header for tenant resolution
        'Content-Type': 'application/json',
      },
    });

    if (!tenantResponse.ok) {
      const errorText = await tenantResponse.text().catch(() => 'Unknown error');
      return NextResponse.json(
        { error: 'Failed to fetch tenant', details: errorText },
        { status: tenantResponse.status }
      );
    }

    const data = await tenantResponse.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    safeLogError('Get tenant API error', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch tenant', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/tenants/{id}
 * Update tenant information
 * Uses standard token validation pattern (validates user has access to tenant)
 */
export async function PUT(
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

    // Validate user has access to this tenant (standard pattern)
    const validatedTenantId = await getValidatedTenantId(tenantId, token, request);

    const body = await request.text();

    // Update tenant using direct fetch with Bearer token
    const tenantResponse = await fetch(`${API_BASE_URL}/api/v1/tenants/${validatedTenantId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': validatedTenantId,
        'Content-Type': 'application/json',
      },
      body: body,
    });

    if (!tenantResponse.ok) {
      const errorText = await tenantResponse.text().catch(() => 'Unknown error');
      return NextResponse.json(
        { error: 'Failed to update tenant', details: errorText },
        { status: tenantResponse.status }
      );
    }

    const data = await tenantResponse.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    safeLogError('Update tenant API error', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update tenant', details: errorMessage },
      { status: 500 }
    );
  }
}
