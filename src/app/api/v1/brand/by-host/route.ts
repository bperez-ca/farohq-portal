import { NextRequest, NextResponse } from 'next/server';
import { proxyApiRequest, serverApiRequest, getClerkToken } from '@/lib/server-api-client';
import { safeLogError, safeLogWarn } from '@/lib/log-sanitizer';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8080';

/**
 * Brand API endpoint that resolves brand by host or authenticated user
 * Priority: Token-based (authenticated) > Host-based (public) > Default theme
 */
export async function GET(request: NextRequest) {
  const host = request.nextUrl.searchParams.get('host');
  const orgId = request.nextUrl.searchParams.get('org-id') || request.nextUrl.searchParams.get('orgId');
  const slug = request.nextUrl.searchParams.get('slug');
  const tenantIdHeader = request.headers.get('x-tenant-id');

  // PRIORITY 1: Token-based resolution (authenticated users)
  // Try to get token and resolve brand via user's tenant
  try {
    const token = await getClerkToken();
    
    if (token) {
      // Get user's organizations to determine tenant context
      const orgsResponse = await serverApiRequest('/api/v1/tenants/my-orgs', {
        method: 'GET',
        token: token,
      });

      if (orgsResponse.ok) {
        const orgsData = await orgsResponse.json();
        const orgs = orgsData.orgs || [];
        
        if (orgs.length > 0) {
          // Determine which org to use
          // Priority: query param org-id > header x-tenant-id > query param slug > first org
          let activeOrg = orgs[0];
          
          if (orgId) {
            activeOrg = orgs.find((org: any) => org.id === orgId) || orgs[0];
          } else if (tenantIdHeader) {
            activeOrg = orgs.find((org: any) => org.id === tenantIdHeader) || orgs[0];
          } else if (slug) {
            activeOrg = orgs.find((org: any) => org.slug === slug) || orgs[0];
          }

          // Fetch brand using tenant ID
          const brandResponse = await fetch(`${API_BASE_URL}/api/v1/brands`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Tenant-ID': activeOrg.id,
              'Content-Type': 'application/json',
            },
          });

          if (brandResponse.ok) {
            const brands = await brandResponse.json();
            
            // Handle array or single object response
            let brand = null;
            if (Array.isArray(brands) && brands.length > 0) {
              brand = brands[0];
            } else if (brands && !Array.isArray(brands)) {
              brand = brands;
            }

            if (brand) {
              // Also fetch tenant information to enrich the response
              try {
                const tenantResponse = await fetch(`${API_BASE_URL}/api/v1/tenants/${activeOrg.id}`, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Tenant-ID': activeOrg.id,
                    'Content-Type': 'application/json',
                  },
                });

                if (tenantResponse.ok) {
                  const tenantData = await tenantResponse.json();
                  // Enrich brand with tenant information
                  return NextResponse.json({
                    ...brand,
                    tenant: {
                      id: tenantData.id,
                      name: tenantData.name,
                      slug: tenantData.slug,
                      status: tenantData.status,
                    },
                    tenant_name: tenantData.name,
                  });
                }
              } catch (tenantError) {
                safeLogWarn('Failed to fetch tenant data for brand enrichment', tenantError);
                // Return brand without tenant enrichment
              }

              // Return brand with tenant_name if available
              return NextResponse.json({
                ...brand,
                tenant_name: brand.tenant?.name || brand.tenant_name,
              });
            }
          }
        }
      }
    }
  } catch (tokenError) {
    safeLogWarn('Token-based brand resolution failed, trying host-based fallback', tokenError);
    // Continue to host-based resolution
  }

  // PRIORITY 2: Host-based resolution (public/unauthenticated)
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

    // If 404 or other error, fall through to default theme
    safeLogWarn(`Host-based brand resolution failed with status ${response.status}`);
  } catch (error) {
    safeLogWarn('Host-based brand resolution failed', error);
    // Continue to default theme
  }

  // PRIORITY 3: Default theme fallback
  return NextResponse.json(getDefaultTheme(request));
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

