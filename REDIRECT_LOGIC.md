# Redirect Logic: Dashboard vs Onboarding

## How Redirects Work

### Dashboard Page (`/dashboard`)
- **Checks**: User's organization count via `/api/v1/tenants/my-orgs/count`
- **If `count === 0`**: Redirects to `/onboarding`
- **If `count > 0`**: User stays on dashboard ✅

### Onboarding Page (`/onboarding`)
- **Checks**: User's organization count via `/api/v1/tenants/my-orgs/count`
- **If `count > 0`**: Redirects to `/dashboard`
- **If `count === 0`**: User stays on onboarding

## What Being on Dashboard Means

**If you're on the dashboard, it means:**
- ✅ You have **at least 1 organization** (count > 0)
- ✅ The redirect check passed
- ✅ You're a member of at least one tenant/org

## Organization ID vs Organization Count

These are **different things**:

### Organization Count (used for redirects)
- Comes from: `/api/v1/tenants/my-orgs/count`
- Returns: `{ count: number, orgs: [...] }`
- Used for: Redirect logic, org selector visibility
- **Being on dashboard means: count > 0** ✅

### Organization ID (user's current/default org)
- Comes from: `/api/v1/auth/me` → `backendInfo.org_id`
- Returns: `{ org_id: string | null, org_slug: string | null, org_role: string | null, ... }`
- Used for: Displaying current org info
- **May be `null`** even if you have orgs (depends on backend API response)

## Summary

**If redirected to dashboard:**
- ✅ You have **at least 1 organization** (count > 0)
- ❓ You may or may not have an `org_id` in `backendInfo` (depends on `/api/v1/auth/me` response)
- ❓ You may or may not have `org_slug`, `org_role` (depends on backend API)

## Check Your Data

To see what organization data you have, check the dashboard page - it displays:
- `org_id` (from `backendInfo.org_id`)
- `org_slug` (from `backendInfo.org_slug`)
- `org_role` (from `backendInfo.org_role`)

If these are `null`, it means your backend `/api/v1/auth/me` endpoint doesn't return them yet (or you don't have a default/current org selected).
