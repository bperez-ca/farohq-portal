/**
 * Server-side API Client for Next.js Route Handlers
 * Includes Clerk token from request headers when proxying to backend
 */

import { auth } from '@clerk/nextjs/server';
import { headers } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8080';

/**
 * Get the Clerk session token from the request
 * For use in Next.js Server Components and Route Handlers
 */
export async function getClerkToken(): Promise<string | null> {
  try {
    const { getToken } = await auth();
    const token = await getToken();
    return token;
  } catch (error) {
    console.error('Failed to get Clerk token:', error);
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

  const response = await fetch(fullUrl, {
    method: request.method,
    headers: {
      ...createHeaders(token),
      // Forward relevant headers
      ...Object.fromEntries(
        Array.from(request.headers.entries()).filter(([key]) =>
          ['content-type', 'x-tenant-id', 'x-request-id'].includes(key.toLowerCase())
        )
      ),
    },
    body,
  });

  return response;
}





