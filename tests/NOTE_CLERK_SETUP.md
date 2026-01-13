# ⚠️ Clerk Authentication Setup Required for E2E Tests

## Overview

The E2E tests require **actual Clerk authentication** to run. All tests will fail at the `signInUser` step if Clerk is not properly configured.

## Required Setup

### 1. Environment Variables

Set the following environment variables:

```bash
export NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
export CLERK_SECRET_KEY="sk_test_..."
export TEST_USER_EMAIL="test@example.com"
export TEST_USER_PASSWORD="your-test-password"
```

### 2. Test Users

Create test users in your Clerk instance:

1. Go to your Clerk Dashboard
2. Create a test user with email matching `TEST_USER_EMAIL`
3. Set the password to match `TEST_USER_PASSWORD`
4. Ensure the user is active and can sign in

### 3. Clerk Test Mode (Optional but Recommended)

For E2E testing, consider using Clerk's test mode:

- See: https://clerk.com/docs/testing/overview
- Test mode allows easier authentication in automated tests
- May require additional configuration

## Why Tests Fail

If you see errors like:

```
TimeoutError: page.waitForURL: Timeout 15000ms exceeded
at signInUser
```

This means:
1. Clerk credentials are not configured, OR
2. Test users don't exist, OR
3. Clerk authentication is failing

## Quick Fix

1. **Check Environment Variables**:
   ```bash
   echo $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
   echo $CLERK_SECRET_KEY
   ```

2. **Create Test User in Clerk**:
   - Use the email/password from `TEST_USER_EMAIL` and `TEST_USER_PASSWORD`
   - Ensure user exists and is active

3. **Run Tests Again**:
   ```bash
   npm run test:e2e
   ```

## Alternative: Skip Authentication Tests

If you don't have Clerk set up yet, you can:
1. Comment out authentication-dependent tests
2. Focus on non-authentication tests first
3. Set up Clerk later

However, **most E2E tests require authentication**, so this is not recommended for full test coverage.

## Resources

- [Clerk Testing Documentation](https://clerk.com/docs/testing/overview)
- [Clerk Environment Variables](https://clerk.com/docs/references/nextjs/overview)
- [Clerk Dashboard](https://dashboard.clerk.com/)
