# E2E Tests

End-to-end tests for the FaroHQ Portal using Playwright.

## Setup

### Install Dependencies

```bash
# Install Playwright and browsers
# Note: If you encounter peer dependency conflicts (e.g., react-day-picker),
# use --legacy-peer-deps flag
npm install -D @playwright/test --legacy-peer-deps
npx playwright install

# Ensure axios is installed (for API helpers)
npm install axios
```

### Environment Variables

Create a `.env.test` file or set the following environment variables:

```bash
# Portal URL (default: http://localhost:3001)
PORTAL_URL=http://localhost:3001

# API URL (default: http://localhost:8080)
API_URL=http://localhost:8080

# Test user credentials (required)
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=test-password

# API key for test setup (optional, needed for some tests)
TEST_API_KEY=your-api-key-here
```

## Running Tests

### Run All E2E Tests

```bash
npm run test:e2e
```

### Run Tests in UI Mode

```bash
npm run test:e2e:ui
```

### Run Specific Test File

```bash
npx playwright test tests/e2e/onboarding.spec.ts
```

### Run Tests in Debug Mode

```bash
npx playwright test --debug
```

### Run Tests in Headed Mode (see browser)

```bash
npx playwright test --headed
```

## Prerequisites

Before running E2E tests, ensure:

1. **E2E Database is Running**:
   ```bash
   cd ../farohq-core-app
   make e2e-start
   ```

2. **Core App is Running**:
   ```bash
   cd ../farohq-core-app
   export DATABASE_URL="postgres://postgres:password@localhost:5433/localvisibilityos?sslmode=disable"
   export CLERK_JWKS_URL="your-clerk-jwks-url"
   make dev
   ```

3. **Portal is Running**:
   ```bash
   npm run dev
   ```

   (Note: Playwright config includes a `webServer` that will start the portal automatically)

4. **Clerk Authentication Setup** (REQUIRED):
   - Clerk environment variables must be configured:
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
     - `CLERK_SECRET_KEY`
   - Test users must exist in your Clerk instance
   - For development/testing, consider:
     - Using Clerk's test mode (https://clerk.com/docs/testing/overview)
     - Creating dedicated test users for E2E tests
     - Using Clerk development mode with test accounts
   
   **IMPORTANT**: E2E tests require actual Clerk authentication. The tests will fail if:
   - Clerk credentials are not configured
   - Test users don't exist
   - Clerk is not accessible

## Test Structure

- `tests/e2e/` - E2E test files
  - `onboarding.spec.ts` - Onboarding workflow tests
- `tests/helpers/` - Test helper utilities
  - `auth.ts` - Authentication helpers
  - `api.ts` - API helpers for test data setup

## Test Coverage

The E2E tests cover:

1. **New User Onboarding Flow** (0 orgs)
   - Signup redirect to onboarding
   - Form completion and validation
   - Subdomain generation and display
   - Success screen and redirect to dashboard

2. **Dashboard Redirect** (0 orgs)
   - Redirect to onboarding when user has no orgs

3. **Onboarding Skip** (user has orgs)
   - Skip onboarding when user already has orgs

4. **Slug Validation**
   - Format validation (lowercase, hyphens, numbers)
   - Uniqueness validation (async)

5. **Subdomain Suggestions**
   - From website URL
   - From agency name/slug

6. **Form Validation**
   - Required fields
   - Format validation errors

7. **Middleware Protection**
   - Route protection rules
   - Redirect logic

8. **Success Screen**
   - Auto-redirect to dashboard
   - Manual redirect via button

## Writing New Tests

### Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
  });

  test.afterEach(async ({ page }) => {
    // Cleanup after each test
  });

  test('should do something', async ({ page }) => {
    // Test steps
    await page.goto('/path');
    await expect(page.locator('selector')).toBeVisible();
  });
});
```

### Using Helpers

```typescript
import { signInUser } from '../helpers/auth';
import { createTenant, deleteTenant } from '../helpers/api';

test('example', async ({ page }) => {
  await signInUser(page, 'user@example.com', 'password');
  // ... test code
});
```

## Troubleshooting

### Tests Fail with Authentication Errors

**Most Common Issue**: All tests timeout at `signInUser` step

- **Verify Clerk Configuration**:
  - Check `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set
  - Check `CLERK_SECRET_KEY` is set
  - Verify Clerk is accessible (not rate-limited or down)

- **Test Users**:
  - Ensure test users exist in Clerk: `TEST_USER_EMAIL` and `TEST_USER_PASSWORD`
  - Test users must be valid and active in Clerk
  - Consider creating dedicated test accounts for E2E tests

- **Clerk Test Mode** (Recommended for E2E):
  - Consider using Clerk's test mode for E2E testing
  - See: https://clerk.com/docs/testing/overview
  - Test mode allows easier authentication in automated tests

- **Alternative Approaches**:
  - Use Clerk development mode with test accounts
  - Mock authentication for some tests (not ideal for E2E)
  - Skip authentication-dependent tests if Clerk setup is not available

**Note**: The current test implementation requires actual Clerk authentication. If you're setting up E2E tests for the first time, you may need to:
1. Create test users in Clerk
2. Configure Clerk environment variables
3. Ensure Clerk is accessible during test runs

### Tests Fail with API Errors

- Verify core-app is running
- Check API_URL environment variable
- Verify database is accessible
- Check API authentication/authorization

### Tests Timeout

- Verify portal is running and accessible
- Check network connectivity
- Increase timeout in test configuration if needed

### Database Connection Issues

- Verify E2E database is running (`make e2e-start`)
- Check DATABASE_URL in core-app
- Verify database migrations are up to date

## CI/CD Integration

The tests are designed to run in CI/CD pipelines. In CI:

- Tests run in parallel when possible
- Retries are enabled (2 retries)
- Reports are generated
- Screenshots and videos are captured on failure

To run in CI mode:

```bash
CI=true npm run test:e2e
```
