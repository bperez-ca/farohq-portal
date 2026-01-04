import { NextRequest, NextResponse } from 'next/server';
import { proxyApiRequest } from '@/lib/server-api-client';

/**
 * Brand API endpoint that proxies to core-app backend
 * This is a public endpoint (no auth required) for brand theme resolution
 */
export async function GET(request: NextRequest) {
  const host = request.nextUrl.searchParams.get('host');
  
  // Normalize host - remove port if it doesn't match current port
  // This handles cases where host is localhost:3001 but app is on localhost:3000
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
    logo_url: `${baseUrl}/logo.svg`,
    favicon_url: `${baseUrl}/favicon.svg`,
    primary_color: '#2563eb',
    secondary_color: '#6b7280',
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
  };
}

