import { NextRequest, NextResponse } from 'next/server';
import { getClerkToken, getValidatedTenantId } from '@/lib/server-api-client';
import { safeLogError } from '@/lib/log-sanitizer';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8080';

/**
 * DELETE /api/v1/tenants/{id}/invites/{invite_id}
 * Revoke an invite
 * Uses standard token validation pattern (validates user has access to tenant)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; invite_id: string }> }
) {
  try {
    const { id: tenantId, invite_id: inviteId } = await params;

    const token = await getClerkToken();
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate user has access to this tenant (standard pattern)
    const validatedTenantId = await getValidatedTenantId(tenantId, token, request);

    const revokeResponse = await fetch(`${API_BASE_URL}/api/v1/tenants/${validatedTenantId}/invites/${inviteId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': validatedTenantId,
        'Content-Type': 'application/json',
      },
    });

    if (!revokeResponse.ok) {
      const errorText = await revokeResponse.text().catch(() => 'Unknown error');
      return NextResponse.json(
        { error: 'Failed to revoke invite', details: errorText },
        { status: revokeResponse.status }
      );
    }

    const data = await revokeResponse.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    safeLogError('Revoke invite API error', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Handle authentication errors specifically
    if (errorMessage.includes('Authentication required')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to revoke invite', details: errorMessage },
      { status: 500 }
    );
  }
}
