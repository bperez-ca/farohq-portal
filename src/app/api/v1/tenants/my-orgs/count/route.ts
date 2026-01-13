import { NextRequest, NextResponse } from 'next/server';
import { serverApiRequest, getClerkToken } from '@/lib/server-api-client';

/**
 * GET /api/v1/tenants/my-orgs/count
 * Get count of organizations/tenants for the current user
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

    const response = await serverApiRequest('/api/v1/tenants/my-orgs', {
      method: 'GET',
      token: token,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return NextResponse.json(
        { error: 'Failed to fetch user orgs', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    // Return just the count and orgs list
    return NextResponse.json({
      count: data.count || 0,
      orgs: data.orgs || [],
    }, { status: 200 });
  } catch (error) {
    console.error('My orgs count API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch user orgs count', details: errorMessage },
      { status: 500 }
    );
  }
}
