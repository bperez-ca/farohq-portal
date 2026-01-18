import { test, expect } from '@playwright/test';

test.describe('Invite Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page and authenticate
    // Note: Adjust these selectors based on your actual login flow
    await page.goto('/signin');
    
    // Wait for signin page to load
    await page.waitForLoadState('networkidle');
    
    // If already logged in, skip login
    // Otherwise, perform login (adjust selectors as needed)
    if (page.url().includes('/signin')) {
      // Fill in login credentials (adjust selectors based on your login form)
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      const submitButton = page.locator('button[type="submit"]').first();
      
      if (await emailInput.isVisible()) {
        await emailInput.fill(process.env.TEST_USER_EMAIL || 'test@example.com');
        await passwordInput.fill(process.env.TEST_USER_PASSWORD || 'password');
        await submitButton.click();
        
        // Wait for redirect after login
        await page.waitForURL('**/dashboard', { timeout: 10000 });
      }
    }
  });

  test('should display invites page', async ({ page }) => {
    // Navigate to invites page (assuming user is part of an organization)
    await page.goto('/agency/settings/invites');
    
    // Check that the page loads
    await expect(page.locator('h1')).toContainText('Invite Management');
    
    // Check for invite form
    await expect(page.locator('text=Send Invitation')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('select')).toBeVisible();
  });

  test('should create an invite', async ({ page }) => {
    await page.goto('/agency/settings/invites');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Fill in invite form
    const emailInput = page.locator('input[type="email"]').first();
    const roleSelect = page.locator('select').first();
    const submitButton = page.locator('button[type="submit"]').first();
    
    await emailInput.fill('newuser@example.com');
    await roleSelect.selectOption('viewer');
    
    // Submit form
    await submitButton.click();
    
    // Wait for success message or invite to appear in list
    await page.waitForSelector('text=Invitation sent', { timeout: 10000 });
    
    // Verify invite appears in list
    await expect(page.locator('text=newuser@example.com')).toBeVisible();
    await expect(page.locator('text=Pending')).toBeVisible();
  });

  test('should display pending invites', async ({ page }) => {
    await page.goto('/agency/settings/invites');
    
    // Wait for invites to load
    await page.waitForLoadState('networkidle');
    
    // Check for invites list (may be empty)
    const invitesList = page.locator('text=Pending Invitations');
    await expect(invitesList).toBeVisible();
  });

  test('should revoke a pending invite', async ({ page }) => {
    await page.goto('/agency/settings/invites');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Find first pending invite with revoke button
    const revokeButton = page.locator('button:has-text("Revoke")').first();
    
    if (await revokeButton.isVisible()) {
      await revokeButton.click();
      
      // Wait for success message
      await page.waitForSelector('text=Invitation revoked successfully', { timeout: 10000 });
      
      // Verify invite status changed to revoked
      await expect(page.locator('text=Revoked')).toBeVisible();
    } else {
      // Skip if no pending invites
      test.skip();
    }
  });
});

test.describe('Invite Acceptance', () => {
  test('should display accept invite page', async ({ page }) => {
    // Use a test invite token (this should be set up in test data)
    const testToken = 'test-invite-token-123';
    await page.goto(`/invites/accept/${testToken}`);
    
    // Check that the page loads
    await expect(page.locator('h1, h2')).toContainText(/Accept Invitation|You.*Invited/i);
    
    // Check for accept button
    await expect(page.locator('button:has-text("Accept Invitation")')).toBeVisible();
  });

  test.skip('should show error for expired invite', () => {
    // This test would require an expired invite token
    // In a real implementation, you'd seed test data with expired invites
    // test.skip('Requires expired invite token in test data');
  });

  test.skip('should show error for revoked invite', () => {
    // This test would require a revoked invite token
    // test.skip('Requires revoked invite token in test data');
  });

  test('should accept valid invite', async ({ page }) => {
    // This test requires:
    // 1. User to be logged in
    // 2. A valid invite token
    // 3. The invite to not be expired or revoked
    
    // Navigate to login first
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');
    
    // Perform login if needed
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill(process.env.TEST_USER_EMAIL || 'test@example.com');
      const passwordInput = page.locator('input[type="password"]').first();
      await passwordInput.fill(process.env.TEST_USER_PASSWORD || 'password');
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    }
    
    // Use a test invite token (should be created by test setup)
    const testToken = process.env.TEST_INVITE_TOKEN || 'test-token';
    await page.goto(`/invites/accept/${testToken}`);
    
    // Click accept button
    const acceptButton = page.locator('button:has-text("Accept Invitation")');
    await acceptButton.click();
    
    // Wait for success or redirect
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Verify success message or redirect
    // This may show a success message or redirect immediately
  });
});
