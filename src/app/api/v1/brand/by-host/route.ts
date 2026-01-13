import { NextRequest, NextResponse } from 'next/server';
import { proxyApiRequest, serverApiRequest, getClerkToken } from '@/lib/server-api-client';

/**
 * Brand API endpoint that proxies to core-app backend
 * Supports both host-based (public) and org-based (authenticated) brand resolution
 */
export async function GET(request: NextRequest) {
  const host = request.nextUrl.searchParams.get('host');
  const orgId = request.nextUrl.searchParams.get('org-id') || request.nextUrl.searchParams.get('orgId');
  const slug = request.nextUrl.searchParams.get('slug');
  
  // If org-id or slug is provided, use authenticated org-based fetching
  if (orgId || slug) {
    try {
      const token = await getClerkToken();
      if (!token) {
        // If no token but org requested, return default theme
        return NextResponse.json(getDefaultTheme(request));
      }

      // Get user's organizations
      const orgsResponse = await serverApiRequest('/api/v1/tenants/my-orgs', {
        method: 'GET',
        token: token,
      });

      if (!orgsResponse.ok) {
        return NextResponse.json(getDefaultTheme(request));
      }

      const orgsData = await orgsResponse.json();
      const orgs = orgsData.orgs || [];
      
      if (orgs.length === 0) {
        return NextResponse.json(getDefaultTheme(request));
      }

      // Find the requested org
      let activeOrg = orgs[0];
      if (orgId) {
        activeOrg = orgs.find((org: any) => org.id === orgId) || orgs[0];
      } else if (slug) {
        activeOrg = orgs.find((org: any) => org.slug === slug) || orgs[0];
      }

      // Fetch brand using tenant ID
      const brandResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8080'}/api/v1/brands`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': activeOrg.id,
          'Content-Type': 'application/json',
        },
      });

      if (brandResponse.ok) {
        const brands = await brandResponse.json();
        const brand = Array.isArray(brands) && brands.length > 0 ? brands[0] : brands;
        if (brand) {
          return NextResponse.json(brand);
        }
      }
    } catch (error) {
      console.warn('Failed to fetch brand by org, falling back to default:', error);
    }
  }
  
  // Host-based resolution (original logic)
  // Normalize host - remove port if it doesn't match current port
  let normalizedHost = host || '';
  if (normalizedHost && normalizedHost.includes(':')) {
    const [hostname, port] = normalizedHost.split(':');
    // If it's localhost with a port, use just localhost (or keep original if not localhost)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      normalizedHost = hostname; // Remove port for localhost
    }
  }
  
  const endpoint = `/api/v1/brand/by-host?host=${encodeURIComponent(normalizedHost || 'localhost')}`;

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
  // Use relative paths or construct from request origin
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

