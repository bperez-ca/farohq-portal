import { Page, expect } from '@playwright/test';

/**
 * Authentication helper utilities for E2E tests
 */

export interface TestUser {
  email: string;
  password: string;
  userId?: string;
}

/**
 * Sign in user via Clerk authentication
 * 
 * NOTE: This requires proper Clerk setup:
 * - Test users must exist in Clerk
 * - Clerk test mode OR development mode must be enabled
 * - Environment variables must be configured (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY)
 * 
 * For E2E testing with Clerk, consider:
 * 1. Using Clerk's test mode (https://clerk.com/docs/testing/overview)
 * 2. Creating dedicated test users
 * 3. Using Clerk's Playwright utilities if available
 */
export async function signInUser(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  // Navigate to sign in page
  await page.goto('/signin');
  
  // Wait for form to be visible
  await page.waitForSelector('#email', { timeout: 5000 });
  
  // Fill in email (using id selector from LoginForm)
  await page.fill('#email', email);
  
  // Fill in password (using id selector from LoginForm)
  await page.fill('#password', password);
  
  // Click sign in button
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard or onboarding
  // Note: This may timeout if Clerk authentication fails or requires additional steps
  await page.waitForURL(/\/dashboard|\/onboarding/, { timeout: 15000 });
}

/**
 * Sign out user
 */
export async function signOutUser(page: Page): Promise<void> {
  // This will need to be adapted based on your sign out implementation
  // Typically clicking a user menu and then sign out button
  await page.goto('/api/auth/signout');
  // Or if using Clerk's signOut:
  // await page.evaluate(() => window.Clerk?.signOut());
  
  await page.waitForURL(/\/signin|\//, { timeout: 5000 });
}

/**
 * Create a test user with Clerk (if using Clerk's API)
 * This is a placeholder - actual implementation depends on Clerk setup
 */
export async function createTestUser(
  email: string,
  password: string
): Promise<TestUser> {
  // TODO: Implement using Clerk's API or your user creation endpoint
  // For now, return the test user data
  return { email, password };
}

/**
 * Delete a test user (cleanup)
 */
export async function deleteTestUser(userId: string): Promise<void> {
  // TODO: Implement user deletion via API
  // This is important for test cleanup
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  // Check for auth token or user session indicator
  const hasAuth = await page.evaluate(() => {
    // Check for Clerk session or auth cookie
    return document.cookie.includes('__session') || 
           typeof (window as any).Clerk !== 'undefined';
  });
  return hasAuth;
}

/**
 * Wait for authentication to complete
 */
export async function waitForAuth(page: Page): Promise<void> {
  // Wait for auth-related elements or redirects
  await page.waitForLoadState('networkidle');
}
