import { NextRequest, NextResponse } from 'next/server';
import { serverApiRequest, getClerkToken } from '@/lib/server-api-client';

/**
 * POST /api/v1/files/sign
 * Generate presigned URL for file upload
 * 
 * In local development: Returns a mock response indicating local upload should be used
 * In production: Proxies to backend GCS/S3 presigned URL generation
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getClerkToken();
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get request body to extract agency_id
    const body = await request.json();
    const agencyId = body.agency_id;
    const assetType = body.asset;

    // Get tenant ID from header or body
    const headersList = request.headers;
    const tenantIdHeader = headersList.get('x-tenant-id');
    
    // Determine tenant ID: header > body agency_id > fetch from orgs
    let tenantId = tenantIdHeader || agencyId;

    // If no tenant ID, get from user's orgs
    if (!tenantId) {
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
        console.warn('Could not fetch orgs for tenant context:', orgError);
      }
    }

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required. Provide agency_id in body or X-Tenant-ID header.' },
        { status: 400 }
      );
    }

    // Check if we're in local development mode
    const isLocalDev = process.env.NODE_ENV === 'development' || 
                       !process.env.GOOGLE_APPLICATION_CREDENTIALS ||
                       process.env.USE_LOCAL_STORAGE === 'true';

    if (isLocalDev) {
      // Return mock response for local development
      // The frontend will use the /api/v1/files/upload endpoint instead
      return NextResponse.json({
        url: null, // Indicates local upload should be used
        key: `uploads/${tenantId}/branding/${assetType}/`,
        use_local_upload: true,
        upload_endpoint: '/api/v1/files/upload',
      }, { status: 200 });
    }

    // Production: Make direct request to backend with tenant context for GCS/S3
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8080';
    
    // Get request body
    const requestBody = JSON.stringify(body);
    
    const response = await fetch(`${API_BASE_URL}/api/v1/files/sign`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId,
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });
    
    const responseData = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      return NextResponse.json(
        { error: responseData.error || 'Failed to generate presigned URL', details: responseData },
        { status: response.status }
      );
    }

    return NextResponse.json(responseData, { status: response.status });
  } catch (error) {
    console.error('Files sign API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to generate presigned URL', details: errorMessage },
      { status: 500 }
    );
  }
}
