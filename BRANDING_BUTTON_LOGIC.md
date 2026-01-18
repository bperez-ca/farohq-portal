# Branding Settings - Save Button Logic

## Button Disabled Conditions

The "Save Changes" button in `/app/agency/settings/branding/page.tsx` is disabled when **ANY** of these conditions are true:

1. **`saving === true`** - Currently saving changes
2. **`isUploading === true`** - Currently uploading logo/favicon
3. **`!isDirty`** - Form hasn't been modified (no changes detected)
4. **`isValidatingSlug === true`** - Slug validation is in progress
5. **`!!slugError`** - Slug validation failed (slug is taken or invalid)

### Code Location
```typescript
// Line 893 in src/app/agency/settings/branding/page.tsx
disabled={saving || isUploading || !isDirty || isValidatingSlug || !!slugError}
```

## 403 Forbidden Error

The 403 error occurs **after** clicking the button, when the backend API rejects the request. This is **NOT** a button disabled condition - it's a backend permission/authorization issue.

### Possible Causes:

1. **Tier Restriction**: Some brand features may require a higher subscription tier
2. **Role/Permission Issue**: User may not have `owner` or `admin` role
3. **Tenant ID Mismatch**: The tenant ID sent doesn't match the brand's tenant
4. **Backend Validation**: Backend is rejecting the request for business logic reasons

### Debugging Steps:

1. Check browser console for the full error response
2. Check server logs for detailed error messages
3. Verify user's role in the tenant/organization
4. Verify the tenant ID matches the brand's `agency_id`
5. Check if any fields being updated require a higher tier

### API Route Location
- **Frontend Route**: `/api/v1/brands` (PUT method)
- **Backend Route**: `${API_BASE_URL}/api/v1/brands/${brandId}` (PUT method)

### Request Headers Sent:
- `Authorization: Bearer ${token}` - Clerk authentication token
- `X-Tenant-ID: ${finalTenantId}` - Tenant context
- `Content-Type: application/json`

### Error Response Format:
```json
{
  "error": "Error message from backend",
  "tier_required": true/false,
  "details": { ... },
  "suggestion": "Helpful suggestion message"
}
```

## To Enable the Button:

1. Make sure the form has been modified (`isDirty === true`)
2. Ensure no file uploads are in progress
3. Ensure slug validation has completed successfully
4. Ensure there are no slug validation errors

## To Fix 403 Error:

1. Verify user has `owner` or `admin` role in the tenant
2. Check if the feature requires a higher tier subscription
3. Verify the tenant ID in the request matches the brand's tenant
4. Check backend logs for the specific rejection reason
