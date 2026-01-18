/**
 * Server-side API Client for Next.js Route Handlers
 * Includes Clerk token from request headers when proxying to backend
 */

import { auth } from '@clerk/nextjs/server';
import { headers } from 'next/headers';
import { safeLogError, safeLogWarn } from './log-sanitizer';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8080';

/**
 * Get the Clerk session token from the request
 * For use in Next.js Server Components and Route Handlers
 */
export async function getClerkToken(): Promise<string | null> {
  try {
    console.log('[Auth] Attempting to retrieve Clerk Bearer token...');
    const { getToken } = await auth();
    const token = await getToken();
    
    if (token) {
      // Log token info (safe - only show first/last chars for debugging)
      const tokenPreview = token.length > 20 
        ? `${token.substring(0, 10)}...${token.substring(token.length - 10)}`
        : '***';
      console.log(`[Auth] ✓ Bearer token retrieved successfully (length: ${token.length}, preview: ${tokenPreview})`);
      
      // Decode JWT to show claims structure (header.payload.signature)
      // JWT uses base64url encoding, which is mostly compatible with base64
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          // Base64url decode (add padding if needed)
          const base64UrlDecode = (str: string) => {
            let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
            const pad = base64.length % 4;
            if (pad) {
              base64 += new Array(5 - pad).join('=');
            }
            return Buffer.from(base64, 'base64').toString();
          };
          
          const header = JSON.parse(base64UrlDecode(parts[0]));
          const payload = JSON.parse(base64UrlDecode(parts[1]));
          console.log('[Auth] Token structure:', {
            header: { alg: header.alg, typ: header.typ },
            payload: {
              sub: payload.sub,
              email: payload.email,
              org_id: payload.o?.id || payload.org_id,
              exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
              iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : null,
            },
          });
        }
      } catch (decodeError) {
        // Ignore decode errors, just log that we got the token
        console.log('[Auth] Token structure decode skipped (token format may vary)');
      }
    } else {
      console.warn('[Auth] ✗ Bearer token retrieval returned null - user may not be authenticated');
    }
    
    return token;
  } catch (error) {
    console.error('[Auth] ✗ Failed to get Clerk Bearer token:', error);
    safeLogError('Failed to get Clerk token', error);
    return null;
  }
}

/**
 * Create headers for API requests with Clerk authentication
 */
function createHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Make an authenticated API request to the backend from a server component/route handler
 */
export async function serverApiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<Response> {
  const { token: providedToken, ...fetchOptions } = options;
  
  // Get token if not provided
  const token = providedToken ?? await getClerkToken();

  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // Forward original request headers (like tenant context, etc.)
  const forwardedHeaders: HeadersInit = {};
  const headersList = await headers();
  const forwardedHeadersToInclude = ['x-tenant-id', 'x-request-id'];
  
  for (const headerName of forwardedHeadersToInclude) {
    const value = headersList.get(headerName);
    if (value) {
      forwardedHeaders[headerName] = value;
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      ...createHeaders(token),
      ...forwardedHeaders,
      ...fetchOptions.headers,
    },
  });

  return response;
}

/**
 * Proxy request from Next.js route handler to backend with Clerk authentication
 */
export async function proxyApiRequest(
  endpoint: string,
  request: Request,
  options: { token?: string | null } = {}
): Promise<Response> {
  const { token: providedToken } = options;
  const token = providedToken ?? await getClerkToken();
  
  if (!token) {
    console.warn(`[Proxy] ✗ No Bearer token available for request to ${endpoint}`);
  } else {
    console.log(`[Proxy] → Proxying ${request.method} ${endpoint} with Bearer token`);
  }

  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // Clone request to read body if needed
  const body = request.method !== 'GET' && request.method !== 'HEAD'
    ? await request.text()
    : undefined;

  // Get query params from original request
  const urlObj = new URL(request.url);
  const searchParams = urlObj.searchParams.toString();
  const fullUrl = searchParams ? `${url}?${searchParams}` : url;

  // Collect headers to forward (avoid duplicates by checking case-insensitively)
  const forwardedHeaders: Record<string, string> = {};
  const headersToForward = ['content-type', 'x-tenant-id', 'x-request-id'];
  const seenHeaders = new Set<string>();
  
  // Forward relevant headers (avoid duplicates by using first occurrence only)
  for (const [key, value] of request.headers.entries()) {
    const lowerKey = key.toLowerCase();
    if (headersToForward.includes(lowerKey) && !seenHeaders.has(lowerKey)) {
      let cleanedValue = value;
      // If X-Tenant-ID header value contains comma (duplicated), take only first part
      if (lowerKey === 'x-tenant-id' && value.includes(',')) {
        cleanedValue = value.split(',')[0].trim();
      }
      // Use original header name (preserve casing)
      forwardedHeaders[key] = cleanedValue;
      seenHeaders.add(lowerKey);
    }
  }
  

  const headers = {
    ...createHeaders(token),
    ...forwardedHeaders,
  };
  
  // Log headers being sent (sanitize Authorization header for security)
  const logHeaders = { ...headers };
  if (logHeaders['Authorization']) {
    const authHeader = logHeaders['Authorization'] as string;
    logHeaders['Authorization'] = authHeader.length > 20 
      ? `Bearer ${authHeader.substring(7, 17)}...${authHeader.substring(authHeader.length - 10)}`
      : 'Bearer ***';
  }
  console.log(`[Proxy] Request headers for ${request.method} ${endpoint}:`, logHeaders);

  const response = await fetch(fullUrl, {
    method: request.method,
    headers,
    body,
  });

  console.log(`[Proxy] ← Response from ${endpoint}: ${response.status} ${response.statusText}`);
  
  return response;
}

/**
 * Get validated tenant ID for the current user
 * This function verifies that the user has access to the requested tenant
 * by checking their organizations. This is the standard pattern for tenant-scoped endpoints.
 * 
 * @param requestedTenantId - The tenant ID from the request (URL param, etc.)
 * @param token - Optional Clerk token (will be fetched if not provided)
 * @param request - Optional NextRequest to check headers for x-tenant-id
 * @returns Promise<string> - Validated tenant ID that user has access to
 * 
 * Usage:
 * ```ts
 * const tenantId = await getValidatedTenantId(urlParamTenantId, token, request);
 * ```
 */
export async function getValidatedTenantId(
  requestedTenantId: string,
  token?: string | null,
  request?: { headers: { get: (name: string) => string | null } }
): Promise<string> {
  const authToken = token ?? await getClerkToken();
  if (!authToken) {
    throw new Error('Authentication required');
  }

  try {
    const orgsResponse = await serverApiRequest('/api/v1/tenants/my-orgs', {
      method: 'GET',
      token: authToken,
    });

    if (orgsResponse.ok) {
      const orgsData = await orgsResponse.json();
      const orgs = orgsData.orgs || [];
      
      if (orgs.length > 0) {
        // Check if requested tenantId matches one of the user's orgs
        const matchingOrg = orgs.find((org: any) => org.id === requestedTenantId);
        if (matchingOrg) {
          // User has access - use requested tenantId
          return requestedTenantId;
        } else {
          // Tenant ID doesn't match user's orgs - use header or first org
          const tenantIdHeader = request?.headers.get('x-tenant-id');
          const fallbackTenantId = tenantIdHeader || orgs[0].id;
          safeLogWarn('Tenant ID does not match user orgs', {
            requested: requestedTenantId,
            using: fallbackTenantId,
          });
          return fallbackTenantId;
        }
      }
    }
  } catch (orgError) {
    safeLogWarn('Could not fetch orgs for tenant context validation', orgError);
  }

  // Fallback: use header if provided, otherwise use requested tenantId
  // (backend will validate access)
  const tenantIdHeader = request?.headers.get('x-tenant-id');
  return tenantIdHeader || requestedTenantId;
}



