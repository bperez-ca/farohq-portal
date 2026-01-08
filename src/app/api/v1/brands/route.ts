import { NextRequest, NextResponse } from 'next/server';
import { getBrandApi } from '@/lib/sdk-client';

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

