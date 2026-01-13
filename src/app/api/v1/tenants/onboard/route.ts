import { NextRequest, NextResponse } from 'next/server';
import { serverApiRequest, getClerkToken } from '@/lib/server-api-client';

/**
 * POST /api/v1/tenants/onboard
 * Create a tenant (agency) with the current user as owner
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

    const body = await request.json();
    const { name, slug, website, primary_color, logo_url } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Call backend to create tenant with user as owner
    const response = await serverApiRequest('/api/v1/tenants/onboard', {
      method: 'POST',
      token: token,
      body: JSON.stringify({
        name,
        slug,
        website: website || '',
        primary_color: primary_color || '#2563eb',
        logo_url: logo_url || '',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      const status = response.status;
      
      // Handle specific error cases
      if (status === 409) {
        return NextResponse.json(
          { error: 'Agency with this slug already exists' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create agency', details: errorText },
        { status: status }
      );
    }

    const tenantData = await response.json();
    
    // TODO: Create brand record if branding fields provided
    // For now, we'll skip brand creation in onboarding
    // It can be created later in settings
    
    return NextResponse.json({
      id: tenantData.id,
      name: tenantData.name,
      slug: tenantData.slug,
      status: tenantData.status,
      created_at: tenantData.created_at,
    }, { status: 201 });
  } catch (error) {
    console.error('Onboard API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create agency', details: errorMessage },
      { status: 500 }
    );
  }
}
