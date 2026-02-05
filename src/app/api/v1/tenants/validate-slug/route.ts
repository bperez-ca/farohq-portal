import { NextRequest, NextResponse } from 'next/server';
import { serverApiRequest, getClerkToken } from '@/lib/server-api-client';

/**
 * GET /api/v1/tenants/validate-slug?slug=xxx
 * Check if a slug is available for use
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      );
    }

    // Validate slug format
    if (!/^[a-z0-9-]{3,}$/.test(slug)) {
      return NextResponse.json(
        { available: false, slug, error: 'Invalid slug format' },
        { status: 400 }
      );
    }

    const token = await getClerkToken();
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Call backend to check if slug exists
    const response = await serverApiRequest(`/api/v1/tenants/validate-slug?slug=${encodeURIComponent(slug)}`, {
      method: 'GET',
      token: token,
    });

    if (!response.ok) {
      await response.text().catch(() => 'Unknown error');
      // On error, assume available (fail open)
      return NextResponse.json({ available: true, slug }, { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json({ available: data.available, slug: data.slug }, { status: 200 });
  } catch (error) {
    console.error('Validate slug API error:', error);
    // On error, assume available (fail open)
    const slug = request.nextUrl.searchParams.get('slug') || '';
    return NextResponse.json({ available: true, slug }, { status: 200 });
  }
}
