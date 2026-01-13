import { NextRequest, NextResponse } from 'next/server';
import { serverApiRequest, getClerkToken } from '@/lib/server-api-client';
import { safeLogError } from '@/lib/log-sanitizer';

/**
 * GET /api/v1/tenants/{id}
 * Get tenant information by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both Next.js 15 (Promise) and Next.js 14 (direct) params
    const resolvedParams = params instanceof Promise ? await params : params;
    const tenantId = resolvedParams.id;

    const token = await getClerkToken();
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // First try to get from my-orgs to verify user has access
    const orgsResponse = await serverApiRequest('/api/v1/tenants/my-orgs', {
      method: 'GET',
      token: token,
    });

    if (orgsResponse.ok) {
      const orgsData = await orgsResponse.json();
      const orgs = orgsData.orgs || [];
      
      // Check if user has access to this tenant
      const hasAccess = orgs.some((org: any) => org.id === tenantId);
      
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Access denied to this tenant' },
          { status: 403 }
        );
      }
    }

    const response = await serverApiRequest(`/api/v1/tenants/${tenantId}`, {
      method: 'GET',
      token: token,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return NextResponse.json(
        { error: 'Failed to fetch tenant', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
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
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getClerkToken();
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const response = await serverApiRequest(`/api/v1/tenants/${params.id}`, {
      method: 'PUT',
      token: token,
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return NextResponse.json(
        { error: 'Failed to update tenant', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
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
