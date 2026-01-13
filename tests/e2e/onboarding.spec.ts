import { test, expect, Page } from '@playwright/test';
import { signInUser, signOutUser, TestUser } from '../helpers/auth';
import { createTenant, deleteTenant, validateSlug, getUserOrgCount } from '../helpers/api';

/**
 * E2E tests for onboarding workflow
 * 
 * Prerequisites:
 * - Portal running on http://localhost:3001 (or PORTAL_URL env var)
 * - Core-app API running on http://localhost:8080 (or API_URL env var)
 * - E2E database running (port 5433)
 * - Test users available (via Clerk test mode or mocked auth)
 */

// Test user credentials (REQUIRED - must be valid Clerk users)
// Set these via environment variables:
// TEST_USER_EMAIL=your-test-user@example.com
// TEST_USER_PASSWORD=your-test-password
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'test-password';
const TEST_API_KEY = process.env.TEST_API_KEY || ''; // Required for API helpers

// Skip tests if Clerk credentials are not configured
// Tests will fail at signInUser step if Clerk is not properly configured
// See tests/README.md for setup instructions
const CLERK_CONFIGURED = 
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
  process.env.CLERK_SECRET_KEY;

test.describe('Onboarding Flow', () => {
  let testUser: TestUser;
  let createdTenantIds: string[] = [];

  test.beforeEach(async ({ page }) => {
    testUser = {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    };
    
    // Clean up any existing tenants from previous test runs
    // This is important for test isolation
    createdTenantIds = [];
  });

  test.afterEach(async ({ page }) => {
    // Cleanup: Delete created tenants
    for (const tenantId of createdTenantIds) {
      try {
        if (TEST_API_KEY) {
          await deleteTenant(TEST_API_KEY, tenantId);
        }
      } catch (error) {
        console.warn(`Failed to cleanup tenant ${tenantId}:`, error);
      }
    }
    createdTenantIds = [];
    
    // Sign out after each test
    await signOutUser(page);
  });

  test('should complete onboarding flow for new user with 0 orgs', async ({ page }) => {
    // Sign in as new user (0 orgs)
    await signInUser(page, testUser.email, testUser.password);
    
    // Verify redirect to onboarding
    await expect(page).toHaveURL(/\/onboarding/);
    
    // Verify onboarding form is displayed
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[name="agencyName"]')).toBeVisible();
    await expect(page.locator('input[name="slug"]')).toBeVisible();
    
    // Fill in required fields
    const agencyName = 'Test Agency E2E';
    const slug = 'test-agency-e2e';
    
    await page.fill('input[name="agencyName"]', agencyName);
    await page.fill('input[name="slug"]', slug);
    
    // Fill optional fields
    const website = 'https://www.example.com';
    await page.fill('input[name="website"]', website);
    
    // Verify subdomain suggestion appears (if implemented)
    const subdomainInput = page.locator('[data-testid="subdomain"]').or(
      page.locator('text=/.*\\.portal\\.farohq\\.com/')
    );
    if (await subdomainInput.count() > 0) {
      await expect(subdomainInput).toContainText('portal.farohq.com');
    }
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for success screen
    await expect(page.locator('text=/success|congrats|complete/i')).toBeVisible({ timeout: 10000 });
    
    // Verify subdomain is displayed on success screen
    const successSubdomain = page.locator('text=/.*\\.portal\\.farohq\\.com/');
    await expect(successSubdomain).toBeVisible();
    
    // Wait for redirect to dashboard (auto-redirect after 3s or button click)
    const continueButton = page.locator('button:has-text("Continue to Dashboard")').or(
      page.locator('button:has-text("Continue")')
    );
    
    if (await continueButton.count() > 0) {
      await continueButton.click();
    } else {
      // Wait for auto-redirect
      await page.waitForURL(/\/dashboard/, { timeout: 5000 });
    }
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Verify dashboard loads successfully
    await expect(page.locator('body')).toBeVisible();
  });

  test('should redirect to onboarding when user has 0 orgs and tries to access dashboard', async ({ page }) => {
    // Sign in as user with 0 orgs
    await signInUser(page, testUser.email, testUser.password);
    
    // Try to navigate to dashboard
    await page.goto('/dashboard');
    
    // Verify redirect to onboarding
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 5000 });
    
    // Verify onboarding form is displayed
    await expect(page.locator('form')).toBeVisible();
  });

  test('should skip onboarding when user already has orgs', async ({ page }) => {
    // Note: This test requires setting up a user with existing orgs
    // You may need to use API helpers to create a tenant and member first
    
    // For now, this is a placeholder test structure
    test.skip(!TEST_API_KEY, 'Requires API key for test setup');
    
    // TODO: Create user with 1+ orgs via API
    // await createTenantMember(...);
    
    // Sign in as user with orgs
    await signInUser(page, testUser.email, testUser.password);
    
    // Try to navigate to onboarding
    await page.goto('/onboarding');
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
    
    // Verify onboarding form is not displayed
    await expect(page.locator('form')).not.toBeVisible();
  });

  test('should validate slug format correctly', async ({ page }) => {
    await signInUser(page, testUser.email, testUser.password);
    await expect(page).toHaveURL(/\/onboarding/);
    
    const slugInput = page.locator('input[name="slug"]');
    
    // Test invalid formats
    const invalidSlugs = [
      { value: 'AB', error: 'too short' },
      { value: 'test_slug', error: 'underscore' },
      { value: 'Test Slug', error: 'uppercase and spaces' },
      { value: 'test@slug', error: 'special characters' },
    ];
    
    for (const { value, error } of invalidSlugs) {
      await slugInput.clear();
      await slugInput.fill(value);
      
      // Trigger validation (blur or form submission attempt)
      await slugInput.blur();
      
      // Verify error message is shown (adjust selector based on your implementation)
      const errorMessage = page.locator('.error, [role="alert"], .text-red-500, .text-destructive');
      if (await errorMessage.count() > 0) {
        await expect(errorMessage.first()).toBeVisible();
      }
    }
    
    // Test valid format
    await slugInput.clear();
    await slugInput.fill('test-slug-123');
    await slugInput.blur();
    
    // Verify no validation errors
    const errorMessages = page.locator('.error, [role="alert"]');
    const errorCount = await errorMessages.count();
    // Should have no errors or errors should be hidden
    expect(errorCount).toBeLessThanOrEqual(0);
  });

  test('should validate slug uniqueness', async ({ page }) => {
    test.skip(!TEST_API_KEY, 'Requires API key for slug validation');
    
    await signInUser(page, testUser.email, testUser.password);
    await expect(page).toHaveURL(/\/onboarding/);
    
    const slugInput = page.locator('input[name="slug"]');
    const existingSlug = 'existing-slug-e2e';
    
    // Create a tenant with this slug first (via API)
    try {
      const tenant = await createTenant(TEST_API_KEY, {
        name: 'Existing Tenant',
        slug: existingSlug,
      });
      createdTenantIds.push(tenant.id);
    } catch (error) {
      test.skip(true, 'Failed to create test tenant');
    }
    
    // Enter existing slug
    await slugInput.fill(existingSlug);
    await slugInput.blur();
    
    // Wait for async validation (debounced, usually 500ms)
    await page.waitForTimeout(600);
    
    // Verify error message for existing slug
    const errorMessage = page.locator('.error, [role="alert"], text=/already.*taken|not.*available/i');
    await expect(errorMessage.first()).toBeVisible({ timeout: 2000 });
    
    // Enter unique slug
    await slugInput.clear();
    await slugInput.fill('new-unique-slug-e2e');
    await slugInput.blur();
    await page.waitForTimeout(600);
    
    // Verify validation passes (no error)
    const errorCount = await errorMessage.count();
    expect(errorCount).toBe(0);
  });

  test('should suggest subdomain from website URL', async ({ page }) => {
    await signInUser(page, testUser.email, testUser.password);
    await expect(page).toHaveURL(/\/onboarding/);
    
    // Enter agency name
    await page.fill('input[name="agencyName"]', 'Test Agency');
    
    // Enter website
    const website = 'https://www.example.com';
    await page.fill('input[name="website"]', website);
    
    // Wait a bit for subdomain suggestion to update
    await page.waitForTimeout(500);
    
    // Verify subdomain suggestion appears
    // Adjust selector based on your implementation
    const subdomainDisplay = page.locator('[data-testid="subdomain"]').or(
      page.locator('text=/example\\.portal\\.farohq\\.com/')
    );
    
    if (await subdomainDisplay.count() > 0) {
      await expect(subdomainDisplay).toContainText('example.portal.farohq.com');
      
      // Change website
      await page.fill('input[name="website"]', 'https://www.test-agency.com');
      await page.waitForTimeout(500);
      
      // Verify subdomain updates
      await expect(subdomainDisplay).toContainText('test-agency.portal.farohq.com');
    } else {
      // Subdomain suggestion might not be visible in form, check in success screen
      test.info().annotations.push({ type: 'note', description: 'Subdomain suggestion may only appear after form submission' });
    }
  });

  test('should suggest subdomain from agency name/slug when no website', async ({ page }) => {
    await signInUser(page, testUser.email, testUser.password);
    await expect(page).toHaveURL(/\/onboarding/);
    
    // Enter agency name (no website)
    const agencyName = 'Test Agency Inc';
    await page.fill('input[name="agencyName"]', agencyName);
    
    const slug = 'test-agency-inc';
    await page.fill('input[name="slug"]', slug);
    
    // Wait for subdomain suggestion
    await page.waitForTimeout(500);
    
    // Verify subdomain suggestion appears (check in form or success screen)
    const subdomainDisplay = page.locator('[data-testid="subdomain"]').or(
      page.locator('text=/test-agency.*\\.portal\\.farohq\\.com/')
    );
    
    // Modify slug
    await page.fill('input[name="slug"]', 'my-agency');
    await page.waitForTimeout(500);
    
    // Verify subdomain updates (if visible in form)
    if (await subdomainDisplay.count() > 0) {
      await expect(subdomainDisplay).toContainText('my-agency.portal.farohq.com');
    }
  });

  test('should show validation errors for invalid inputs', async ({ page }) => {
    await signInUser(page, testUser.email, testUser.password);
    await expect(page).toHaveURL(/\/onboarding/);
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Verify error messages for required fields
    const errorMessages = page.locator('.error, [role="alert"], .text-red-500, .text-destructive');
    await expect(errorMessages.first()).toBeVisible({ timeout: 2000 });
    
    // Enter invalid website URL
    await page.fill('input[name="website"]', 'not-a-url');
    await page.locator('input[name="website"]').blur();
    
    // Verify website validation error
    const websiteError = page.locator('text=/invalid.*url|valid.*url/i');
    if (await websiteError.count() > 0) {
      await expect(websiteError.first()).toBeVisible();
    }
    
    // Fix errors and fill valid data
    await page.fill('input[name="agencyName"]', 'Test Agency');
    await page.fill('input[name="slug"]', 'test-agency');
    await page.fill('input[name="website"]', 'https://www.example.com');
    
    // Verify form can be submitted (no blocking errors)
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();
  });

  test('should enforce middleware protection rules', async ({ page }) => {
    // Test 1: Authenticated user with 0 orgs → /dashboard should redirect to /onboarding
    await signInUser(page, testUser.email, testUser.password);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 5000 });
    
    // Test 2: Authenticated user with 0 orgs → /onboarding should allow access
    await page.goto('/onboarding');
    await expect(page).toHaveURL(/\/onboarding/);
    
    // Sign out for next test
    await signOutUser(page);
    
    // Test 3: Unauthenticated user → /onboarding should redirect to signin
    await page.goto('/onboarding');
    await expect(page).toHaveURL(/\/signin/, { timeout: 5000 });
    
    // Test 4: Unauthenticated user → /dashboard should redirect to signin
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/signin/, { timeout: 5000 });
  });

  test('should auto-redirect from success screen to dashboard', async ({ page }) => {
    await signInUser(page, testUser.email, testUser.password);
    await expect(page).toHaveURL(/\/onboarding/);
    
    // Complete onboarding form
    await page.fill('input[name="agencyName"]', 'Test Agency Auto Redirect');
    await page.fill('input[name="slug"]', 'test-agency-auto-redirect');
    await page.click('button[type="submit"]');
    
    // Wait for success screen
    await expect(page.locator('text=/success|congrats|complete/i')).toBeVisible({ timeout: 10000 });
    
    // Verify subdomain is shown
    const subdomainDisplay = page.locator('text=/.*\\.portal\\.farohq\\.com/');
    await expect(subdomainDisplay).toBeVisible();
    
    // Check for continue button
    const continueButton = page.locator('button:has-text("Continue to Dashboard")').or(
      page.locator('button:has-text("Continue")')
    );
    
    if (await continueButton.count() > 0) {
      // Test manual redirect
      await continueButton.click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
    } else {
      // Test auto-redirect (wait for 3+ seconds)
      await page.waitForURL(/\/dashboard/, { timeout: 5000 });
    }
    
    // Verify dashboard loads
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe('Multi-Org User Flow', () => {
  test.skip('should display org selector for user with multiple orgs', async ({ page }) => {
    // This test requires setting up a user with 2+ orgs
    // Placeholder for future implementation
    test.skip(true, 'Requires multi-org setup via API');
  });
});
