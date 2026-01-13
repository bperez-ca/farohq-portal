import { NextRequest, NextResponse } from 'next/server';
import { proxyApiRequest } from '@/lib/server-api-client';

/**
 * GET /api/v1/brands
 * List brands using the typed SDK
 */
export async function GET(request: NextRequest) {
  try {
    const brandApi = await getBrandApi();
    const brands = await brandApi.apiV1BrandsGet();
    
    return NextResponse.json(brands, { status: 200 });
  } catch (error) {
    console.error('Brands API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Handle SDK errors
    if (error && typeof error === 'object' && 'status' in error) {
      const status = error.status as number;
      const body = 'body' in error ? error.body : errorMessage;
      return NextResponse.json(
        { error: `Backend error: ${status}`, details: body },
        { status }
      );
    }
    
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
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Brands POST API error:', error);
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
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId') || searchParams.get('id');
    
    if (!brandId) {
      return NextResponse.json(
        { error: 'Brand ID is required (brandId query parameter)' },
        { status: 400 }
      );
    }
    
    // Proxy to backend PUT /api/v1/brands/{brandId}
    const response = await proxyApiRequest(`/api/v1/brands/${brandId}`, request);
    const data = await response.json();
    
    // Handle tier-related errors (403 Forbidden)
    if (response.status === 403) {
      return NextResponse.json(
        { error: data.error || 'Forbidden', tier_required: true },
        { status: 403 }
      );
    }
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Brands PUT API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update brand', details: errorMessage },
      { status: 500 }
    );
  }
}