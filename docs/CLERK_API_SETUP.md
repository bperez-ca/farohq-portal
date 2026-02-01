# Clerk API Authentication Setup

This document explains how the portal communicates with the FaroHQ backend API using Clerk authentication.

## Overview

The portal uses Clerk for authentication, and all API calls to the backend include Clerk JWT tokens in the `Authorization` header. The backend verifies these tokens using Clerk's JWKS endpoint.

## API Client Structure

### Client-Side API Calls (Client Components)

For use in React Client Components:

```tsx
'use client';

import { useAuthenticatedApi } from '@/lib/client-api-helpers';

export function MyComponent() {
  const { apiGet, apiPost } = useAuthenticatedApi();

  useEffect(() => {
    async function fetchData() {
      try {
        const tenants = await apiGet('/api/v1/tenants');
        // Use tenants data
      } catch (error) {
        console.error('Failed to fetch tenants:', error);
      }
    }
    fetchData();
  }, []);

  return <div>...</div>;
}
```

### Server-Side API Calls (Server Components & Route Handlers)

For use in Server Components or Route Handlers:

```ts
import { serverApiRequest } from '@/lib/server-api-client';

// In a Route Handler
export async function GET(request: Request) {
  const response = await serverApiRequest('/api/v1/tenants', {
    method: 'GET',
  });
  
  if (response.ok) {
    const data = await response.json();
    return NextResponse.json(data);
  }
  
  return NextResponse.json({ error: 'Failed' }, { status: response.status });
}

// Or use proxyApiRequest for full request proxying
import { proxyApiRequest } from '@/lib/server-api-client';

export async function GET(request: Request) {
  const response = await proxyApiRequest('/api/v1/tenants', request);
  return response; // Response is already formatted
}
```

## Authentication Flow

1. **User logs in via Clerk** - Clerk handles authentication UI and session management
2. **Clerk issues JWT tokens** - Tokens are stored in the user's session
3. **API calls include tokens** - The API client automatically includes tokens in `Authorization: Bearer <token>` header
4. **Backend verifies tokens** - Backend middleware verifies tokens using Clerk's JWKS endpoint
5. **Request proceeds** - If token is valid, request is processed; otherwise, 401 Unauthorized is returned

## Environment Variables

Required environment variables:

```env
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8080  # For client-side calls
API_URL=http://localhost:8080              # For server-side calls (optional, falls back to NEXT_PUBLIC_API_URL)
```

## Public vs Protected Endpoints

### Public Endpoints (No Auth Required)
- `/api/v1/brand/by-domain` - Brand theme resolution
- `/api/v1/brand/by-host` - Brand theme resolution by host

### Protected Endpoints (Auth Required)
- `/api/v1/tenants/*` - Tenant management
- `/api/v1/brands/*` - Brand management (CRUD operations)
- `/api/v1/files/*` - File management

The API client will include tokens for all requests, but the backend middleware will only require them for protected routes.

## Error Handling

The API client throws errors for non-OK responses. Handle them appropriately:

```tsx
try {
  const data = await apiGet('/api/v1/tenants');
} catch (error) {
  if (error.message.includes('401')) {
    // Unauthorized - user needs to log in
  } else if (error.message.includes('403')) {
    // Forbidden - user doesn't have permission
  } else {
    // Other error
  }
}
```

## Testing

To test the API integration:

1. Start the backend: `make dev` or `make dev-local`
2. Start the portal: `cd apps/portal && npm run dev`
3. Log in via Clerk
4. Make API calls from the portal
5. Check backend logs to verify token verification

## Troubleshooting

### Token Not Included
- Ensure you're using `useAuthenticatedApi()` hook in Client Components
- Ensure you're using `serverApiRequest()` or `proxyApiRequest()` in Route Handlers
- Check that Clerk is properly configured with environment variables

### 401 Unauthorized Errors
- Verify Clerk tokens are being generated (check browser DevTools Network tab)
- Verify backend has `CLERK_SECRET_KEY` configured
- Check backend logs for token verification errors
- Ensure JWKS endpoint is accessible from backend

### CORS Errors
- Ensure backend CORS configuration allows the portal origin
- Check that `NEXT_PUBLIC_API_URL` matches the backend URL





