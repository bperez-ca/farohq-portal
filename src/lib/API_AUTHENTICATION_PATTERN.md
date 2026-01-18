# API Authentication Pattern (Standard)

This document describes the standard authentication pattern used across all tenant-scoped API routes in the FaroHQ Portal.

## Overview

All tenant-scoped API endpoints follow the same authentication pattern to ensure:
1. User is authenticated (has valid Clerk token)
2. User has access to the requested tenant/organization
3. Consistent error handling and logging

## Pattern Components

### 1. Token Retrieval
```typescript
import { getClerkToken } from '@/lib/server-api-client';

const token = await getClerkToken();
if (!token) {
  return NextResponse.json(
    { error: 'Authentication required' },
    { status: 401 }
  );
}
```

### 2. Tenant Validation
```typescript
import { getValidatedTenantId } from '@/lib/server-api-client';

// Validates that user has access to the requested tenant
const validatedTenantId = await getValidatedTenantId(tenantId, token, request);
```

The `getValidatedTenantId` helper:
- Fetches user's organizations via `/api/v1/tenants/my-orgs`
- Verifies the requested tenant ID is in the user's orgs
- Falls back to `X-Tenant-ID` header or first org if validation fails
- Logs warnings for security monitoring

### 3. Backend Request
```typescript
const response = await fetch(`${API_BASE_URL}/api/v1/tenants/${validatedTenantId}/...`, {
  method: 'GET', // or POST, PUT, DELETE
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': validatedTenantId,
    'Content-Type': 'application/json',
  },
  body: body, // for POST/PUT
});
```

## Standard Endpoint Template

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getClerkToken, getValidatedTenantId } from '@/lib/server-api-client';
import { safeLogError } from '@/lib/log-sanitizer';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8080';

/**
 * [METHOD] /api/v1/tenants/{id}/[resource]
 * [Description]
 * Uses standard token validation pattern (validates user has access to tenant)
 */
export async function [METHOD](
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const tenantId = resolvedParams.id;

    // 1. Get token
    const token = await getClerkToken();
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Validate tenant access
    const validatedTenantId = await getValidatedTenantId(tenantId, token, request);

    // 3. Make backend request
    const response = await fetch(`${API_BASE_URL}/api/v1/tenants/${validatedTenantId}/...`, {
      method: '[METHOD]',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': validatedTenantId,
        'Content-Type': 'application/json',
      },
      body: body, // for POST/PUT
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return NextResponse.json(
        { error: 'Failed to [action]', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    safeLogError('[Action] API error', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Handle authentication errors specifically
    if (errorMessage.includes('Authentication required')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to [action]', details: errorMessage },
      { status: 500 }
    );
  }
}
```

## Examples

### Example 1: List Invites (GET)
```typescript
// /api/v1/tenants/[id]/invites/route.ts
export async function GET(request: NextRequest, { params }) {
  const token = await getClerkToken();
  if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const validatedTenantId = await getValidatedTenantId(params.id, token, request);

  const response = await fetch(`${API_BASE_URL}/api/v1/tenants/${validatedTenantId}/invites`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Tenant-ID': validatedTenantId,
      'Content-Type': 'application/json',
    },
  });

  // ... handle response
}
```

### Example 2: Create Invite (POST)
```typescript
// /api/v1/tenants/[id]/invites/route.ts
export async function POST(request: NextRequest, { params }) {
  const token = await getClerkToken();
  if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const validatedTenantId = await getValidatedTenantId(params.id, token, request);
  const body = await request.text();

  const response = await fetch(`${API_BASE_URL}/api/v1/tenants/${validatedTenantId}/invites`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Tenant-ID': validatedTenantId,
      'Content-Type': 'application/json',
    },
    body: body,
  });

  // ... handle response
}
```

## Backend Validation

The backend (`farohq-core-app`) validates tokens using:
- **RequireAuth middleware** (`internal/platform/httpserver/auth.go`):
  - Validates Clerk JWT tokens via JWKS
  - Extracts user ID, email, and org information from token
  - Adds claims to request context

- **RequireTenantContext middleware**:
  - Validates `X-Tenant-ID` header matches tenant in request path
  - Ensures user has access to the tenant
  - Enforces multi-tenancy isolation

## Benefits

1. **Security**: Validates user has access before making backend requests
2. **Consistency**: Same pattern across all endpoints
3. **Error Handling**: Consistent error responses
4. **Logging**: Sanitized logging of auth failures
5. **Maintainability**: Single helper function for tenant validation

## Migration Guide

When updating existing endpoints to use this pattern:

1. Replace direct tenant ID usage with `getValidatedTenantId()`
2. Update error handling to check for auth errors
3. Ensure `X-Tenant-ID` header is set in all backend requests
4. Update comments to reference "standard token validation pattern"

## Files Using This Pattern

- ✅ `/api/v1/tenants/[id]/invites/route.ts` (GET, POST)
- ✅ `/api/v1/tenants/[id]/invites/[invite_id]/route.ts` (DELETE)
- ✅ `/api/v1/tenants/[id]/route.ts` (GET, PUT)
- ✅ `/api/v1/brands/route.ts` (GET, PUT) - Uses similar pattern with org validation

## Related Files

- `src/lib/server-api-client.ts` - Contains `getClerkToken()` and `getValidatedTenantId()` helpers
- `src/lib/log-sanitizer.ts` - Safe logging utilities
- Backend: `internal/platform/httpserver/auth.go` - Backend auth middleware
