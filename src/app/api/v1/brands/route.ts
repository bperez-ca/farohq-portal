import { NextRequest, NextResponse } from 'next/server';
import { proxyApiRequest, serverApiRequest, getClerkToken } from '@/lib/server-api-client';
import { safeLogError, safeLogWarn } from '@/lib/log-sanitizer';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8080';

/**
 * GET /api/v1/brands
 * Get brand information for the current user's organization
 * Uses the user's org-id or slug from Clerk/tenant context to fetch brand and tenant data
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

    // Get user's organizations to determine tenant context
    const orgsResponse = await serverApiRequest('/api/v1/tenants/my-orgs', {
      method: 'GET',
      token: token,
    });

    if (!orgsResponse.ok) {
      const errorText = await orgsResponse.text().catch(() => 'Unknown error');
      return NextResponse.json(
        { error: 'Failed to fetch user organizations', details: errorText },
        { status: orgsResponse.status }
      );
    }

    const orgsData = await orgsResponse.json();
    const orgs = orgsData.orgs || [];
    
    if (orgs.length === 0) {
      return NextResponse.json(
        { error: 'No organizations found for user' },
        { status: 404 }
      );
    }

    // Get the active org from query params (slug or id) or header (x-tenant-id) or use first org
    const { searchParams } = new URL(request.url);
    const orgIdParam = searchParams.get('org-id') || searchParams.get('orgId');
    const orgSlugParam = searchParams.get('slug');
    const headersList = request.headers;
    const tenantIdHeader = headersList.get('x-tenant-id');
    
    let activeOrg = orgs[0];
    
    // Priority: query param org-id > header x-tenant-id > query param slug > first org
    if (orgIdParam) {
      activeOrg = orgs.find((org: any) => org.id === orgIdParam) || orgs[0];
    } else if (tenantIdHeader) {
      activeOrg = orgs.find((org: any) => org.id === tenantIdHeader) || orgs[0];
    } else if (orgSlugParam) {
      activeOrg = orgs.find((org: any) => org.slug === orgSlugParam) || orgs[0];
    }

    // Fetch brand information using the tenant ID (agency_id = tenant_id)
    const brandResponse = await fetch(`${API_BASE_URL}/api/v1/brands`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': activeOrg.id,
        'Content-Type': 'application/json',
      },
    });

    if (!brandResponse.ok) {
      const errorText = await brandResponse.text().catch(() => 'Unknown error');
      return NextResponse.json(
        { error: 'Failed to fetch brand', details: errorText },
        { status: brandResponse.status }
      );
    }

    const brands = await brandResponse.json();
    
    // Handle case where no brands exist yet (empty array or null)
    if (!brands || (Array.isArray(brands) && brands.length === 0)) {
      // Return empty array - the frontend should handle this gracefully
      return NextResponse.json([], { status: 200 });
    }
    
    // Also fetch tenant information
    const tenantResponse = await fetch(`${API_BASE_URL}/api/v1/tenants/${activeOrg.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    let tenantData = null;
    if (tenantResponse.ok) {
      tenantData = await tenantResponse.json();
    }

    // Combine brand and tenant information
    const result = Array.isArray(brands) ? brands : [brands];
    const enrichedBrands = result.map((brand: any) => ({
      ...brand,
      tenant: tenantData ? {
        id: tenantData.id,
        name: tenantData.name,
        slug: tenantData.slug,
        status: tenantData.status,
      } : null,
    }));

    return NextResponse.json(enrichedBrands, { status: 200 });
  } catch (error) {
    safeLogError('Brands API error', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: 'Failed to fetch brands', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/brands
 * Create brand (handled by backend with tenant context)
 */
export async function POST(request: NextRequest) {
  try {
    const response = await proxyApiRequest('/api/v1/brands', request);
    
    // Handle both JSON and plain text responses (backend returns plain text on error)
    const contentType = response.headers.get('content-type');
    let data: any = {};
    
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (jsonError) {
        // If JSON parsing fails, try to get text
        const text = await response.text();
        data = { error: text || 'Unknown error' };
      }
    } else {
      // Plain text response (error message from backend)
      const text = await response.text();
      data = { error: text || 'Unknown error' };
    }
    
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to create brand', details: data },
        { status: response.status }
      );
    }
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    safeLogError('Brands POST API error', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create brand', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/brands
 * Update brand with tier validation (brandId in body or query param)
 */
export async function PUT(request: NextRequest) {
  try {
    const token = await getClerkToken();
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId') || searchParams.get('id');
    if (!brandId) {
      return NextResponse.json(
        { error: 'Brand ID is required (brandId query parameter)' },
        { status: 400 }
      );
    }

    // Get tenant ID from header or fetch from orgs
    const headersList = request.headers;
    const tenantIdHeader = headersList.get('x-tenant-id');
    let tenantId = tenantIdHeader || brandId; // Use brandId as fallback since agency_id = brand_id = tenant_id

    // If no tenant ID, get from user's orgs
    if (!tenantId || tenantId === brandId) {
      try {
        const orgsResponse = await serverApiRequest('/api/v1/tenants/my-orgs', {
          method: 'GET',
          token: token,
        });

        if (orgsResponse.ok) {
          const orgsData = await orgsResponse.json();
          const orgs = orgsData.orgs || [];
          if (orgs.length > 0) {
            tenantId = orgs[0].id;
          }
        }
      } catch (orgError) {
        safeLogWarn('Could not fetch orgs for tenant context', orgError);
      }
    }

    // Make direct request to backend with tenant context
    // Get request body
    const body = await request.text();
    const response = await fetch(`${API_BASE_URL}/api/v1/brands/${brandId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId,
        'Content-Type': 'application/json',
      },
      body: body,
    });
    // Handle both JSON and plain text responses
    let responseData: any = {};
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        responseData = await response.json();
      } catch (jsonError) {
        // If JSON parsing fails, try to get text
        const text = await response.text();
        responseData = { error: text || 'Unknown error' };
      }
    } else {
      // Plain text response (error message)
      const text = await response.text();
      responseData = { error: text || 'Unknown error' };
    }
    
    // Handle tier-related errors (403 Forbidden)
    if (response.status === 403) {
      return NextResponse.json(
        { error: responseData.error || 'Forbidden', tier_required: true },
        { status: 403 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: responseData.error || 'Failed to update brand', details: responseData },
        { status: response.status }
      );
    }
    return NextResponse.json(responseData, { status: response.status });
  } catch (error) {
    safeLogError('Brands PUT API error', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update brand', details: errorMessage },
      { status: 500 }
    );
  }
}