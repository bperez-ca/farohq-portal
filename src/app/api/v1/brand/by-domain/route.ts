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

function getDefaultTheme(request?: NextRequest) {
  // Use local SVG files from public folder
  // These are served statically by Next.js and don't require external dependencies
  // Use request origin to get the correct base URL (works on any port)
  let baseUrl = '/';
  if (request) {
    const origin = request.nextUrl.origin;
    baseUrl = origin;
  } else {
    // Fallback for when request is not available
    baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }
  
  return {
    agency_id: 'dev-agency-id',
    domain: null,
    subdomain: null,
    domain_type: null,
    website: null,
    logo_url: `${baseUrl}/logo.svg`,
    favicon_url: `${baseUrl}/favicon.svg`,
    primary_color: '#2563eb',
    secondary_color: '#6b7280',
    hide_powered_by: false,
    can_hide_powered_by: false,
    can_configure_domain: false,
    email_domain: null,
    ssl_status: null,
    theme_json: {
      name: 'default-theme',
      version: '1.0.0',
      typography: {
        font_family: 'Inter, system-ui, sans-serif',
        font_size_base: '16px',
        line_height_base: '1.5',
      },
      colors: {
        brand: '#2563eb',
        brand_hover: '#1d4ed8',
        accent: '#10b981',
      },
    },
    verified_at: null,
    updated_at: new Date().toISOString(),
  };
}

