import { NextRequest, NextResponse } from 'next/server';
import { serverApiRequest, getClerkToken } from '@/lib/server-api-client';
import { safeLogError } from '@/lib/log-sanitizer';

/**
 * GET /api/v1/tenants/validate?tenantId=xxx
 * Validate that tenantId exists and user has access/role to it
 * Also checks X-Tenant-ID header if tenantId query param is not provided
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

    // Get tenantId from query params or headers
    const { searchParams } = new URL(request.url);
    const tenantIdFromQuery = searchParams.get('tenantId');
    const headersList = request.headers;
    const tenantIdFromHeader = headersList.get('x-tenant-id');
    
    const tenantId = tenantIdFromQuery || tenantIdFromHeader;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required. Provide tenantId query param or X-Tenant-ID header.' },
        { status: 400 }
      );
    }

    // First, get user's orgs to verify access
    const orgsResponse = await serverApiRequest('/api/v1/tenants/my-orgs', {
      method: 'GET',
      token: token,
    });

    if (!orgsResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch user orgs' },
        { status: orgsResponse.status }
      );
    }

    const orgsData = await orgsResponse.json();
    const orgs = orgsData.orgs || [];
    
    // Check if user has access to this tenant
    const hasAccess = orgs.some((org: any) => org.id === tenantId);
    
    if (!hasAccess) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'Access denied to this tenant',
          hasAccess: false,
          hasRole: false
        },
        { status: 403 }
      );
    }

    // Get the org details to return role information
    const org = orgs.find((org: any) => org.id === tenantId);
    
    // Verify tenant exists by fetching it
    const tenantResponse = await serverApiRequest(`/api/v1/tenants/${tenantId}`, {
      method: 'GET',
      token: token,
    });

    if (!tenantResponse.ok) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'Tenant not found',
          hasAccess: true,
          hasRole: false
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      tenantId: tenantId,
      hasAccess: true,
      hasRole: true,
      role: org?.role || null,
      tenant: await tenantResponse.json(),
    }, { status: 200 });
  } catch (error) {
    safeLogError('Validate tenant API error', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        valid: false,
        error: 'Failed to validate tenant', 
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}
