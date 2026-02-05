import { NextRequest, NextResponse } from 'next/server';
import { proxyApiRequest } from '@/lib/server-api-client';

/**
 * Brand API endpoint that proxies to core-app backend
 * This is a public endpoint (no auth required) for brand theme resolution
 */
export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get('domain');
  const endpoint = `/api/v1/brand/by-domain?domain=${encodeURIComponent(domain || '')}`;

  // Try to proxy to backend (this endpoint is public, so no token needed)
  try {
    const response = await proxyApiRequest(endpoint, request, { token: null });
    
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    // If 404, return default theme (no brand found)
    if (response.status === 404) {
      return NextResponse.json(getDefaultTheme(request));
    }

    // For other errors, return default theme
    return NextResponse.json(getDefaultTheme(request));
  } catch (error) {
    // Backend not available - fall back to default theme for development
    console.warn('Backend not available, using default brand theme:', error);
    return NextResponse.json(getDefaultTheme(request));
  }
}

function getDefaultTheme(_request?: NextRequest) {
  // Return loading state theme with gray colors and no logo
  return {
    agency_id: 'dev-agency-id',
    domain: null,
    subdomain: null,
    domain_type: null,
    website: null,
    logo_url: null,
    favicon_url: null,
    primary_color: '#6b7280',
    secondary_color: '#9ca3af',
    hide_powered_by: false,
    can_hide_powered_by: false,
    can_configure_domain: false,
    email_domain: null,
    ssl_status: null,
    theme_json: {
      name: 'loading-theme',
      version: '1.0.0',
      typography: {
        font_family: 'Inter, system-ui, sans-serif',
        font_size_base: '16px',
        line_height_base: '1.5',
      },
      colors: {
        brand: '#6b7280',
        brand_hover: '#4b5563',
        accent: '#9ca3af',
      },
    },
    verified_at: null,
    updated_at: new Date().toISOString(),
  };
}

