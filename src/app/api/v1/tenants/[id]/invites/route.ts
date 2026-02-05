import { NextRequest, NextResponse } from 'next/server';
import { getClerkToken, getValidatedTenantId } from '@/lib/server-api-client';
import { safeLogError } from '@/lib/log-sanitizer';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8080';

/**
 * GET /api/v1/tenants/{id}/invites
 * List all invites for a tenant
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

    const invitesResponse = await fetch(`${API_BASE_URL}/api/v1/tenants/${validatedTenantId}/invites`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': validatedTenantId,
        'Content-Type': 'application/json',
      },
    });

    if (!invitesResponse.ok) {
      const errorText = await invitesResponse.text().catch(() => 'Unknown error');
      return NextResponse.json(
        { error: 'Failed to fetch invites', details: errorText },
        { status: invitesResponse.status }
      );
    }

    const data = await invitesResponse.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    safeLogError('Get invites API error', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Handle authentication errors specifically
    if (errorMessage.includes('Authentication required')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch invites', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/tenants/{id}/invites
 * Create a new invite
 * Uses standard token validation pattern (validates user has access to tenant)
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

    // Validate user has access to this tenant (standard pattern)
    const validatedTenantId = await getValidatedTenantId(tenantId, token, request);

    const body = await request.text();

    const inviteResponse = await fetch(`${API_BASE_URL}/api/v1/tenants/${validatedTenantId}/invites`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': validatedTenantId,
        'Content-Type': 'application/json',
      },
      body: body,
    });

    if (!inviteResponse.ok) {
      const errorText = await inviteResponse.text().catch(() => 'Unknown error');
      return NextResponse.json(
        { error: 'Failed to create invite', details: errorText },
        { status: inviteResponse.status }
      );
    }

    const data = await inviteResponse.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    safeLogError('Create invite API error', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Handle authentication errors specifically
    if (errorMessage.includes('Authentication required')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create invite', details: errorMessage },
      { status: 500 }
    );
  }
}
