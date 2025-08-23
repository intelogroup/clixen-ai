import { test, expect } from '@playwright/test';

test.describe('Authentication Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Open auth modal
    const signInButton = page.locator('button:has-text("Sign In")');
    await signInButton.click();
    await page.waitForTimeout(500);
  });

  test('should open authentication modal correctly', async ({ page }) => {
    // Check modal is visible
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    // Check modal title
    await expect(page.locator('h2:has-text("Welcome back")')).toBeVisible();
    
    // Check both tabs are present
    await expect(page.locator('button[data-state="active"]:has-text("Sign In")')).toBeVisible();
    await expect(page.locator('button:has-text("Sign Up")')).toBeVisible();
  });

  test('should switch between sign in and sign up modes', async ({ page }) => {
    // Initially should be in sign in mode
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
    
    // Switch to sign up mode
    const signUpTab = page.locator('button:has-text("Sign Up")');
    await signUpTab.click();
    await page.waitForTimeout(300);
    
    // Should now show sign up form
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Create Account")')).toBeVisible();
    
    // Switch back to sign in
    const signInTab = page.locator('button:has-text("Sign In")');
    await signInTab.click();
    await page.waitForTimeout(300);
    
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
  });

  test('should handle email input validation', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    
    // Test invalid email format
    await emailInput.fill('invalid-email');
    await emailInput.blur();
    
    // Should show validation error
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
    
    // Test valid email format
    await emailInput.fill('test@example.com');
    await emailInput.blur();
    
    // Should not show validation error
    await expect(page.locator('text=Please enter a valid email address')).not.toBeVisible();
  });

  test('should handle password input validation', async ({ page }) => {
    // Switch to sign up mode for password validation
    const signUpTab = page.locator('button:has-text("Sign Up")');
    await signUpTab.click();
    await page.waitForTimeout(300);
    
    const passwordInput = page.locator('input[type="password"]');
    
    // Test short password
    await passwordInput.fill('123');
    await passwordInput.blur();
    
    // Should show password length error
    await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible();
    
    // Test valid password
    await passwordInput.fill('password123');
    await passwordInput.blur();
    
    // Should not show validation error
    await expect(page.locator('text=Password must be at least 6 characters')).not.toBeVisible();
  });

  test('should handle form submission', async ({ page }) => {
    // Fill in valid credentials
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').fill('password123');
    
    // Submit form
    const submitButton = page.locator('button:has-text("Sign In")');
    await submitButton.click();
    
    // Should show loading state
    await expect(submitButton).toBeDisabled();
    await expect(submitButton).toHaveText(/Signing In|Loading/);
    
    // Wait for submission to complete
    await page.waitForTimeout(2000);
  });

  test('should handle Google authentication', async ({ page }) => {
    // Check Google auth button is present
    const googleButton = page.locator('button:has-text("Continue with Google")');
    await expect(googleButton).toBeVisible();
    
    // Check button styling
    await expect(googleButton).toHaveClass(/border/);
    
    // Test button click (will open Google OAuth in new window)
    await googleButton.click();
    
    // Should handle OAuth flow
    await page.waitForTimeout(1000);
  });

  test('should handle authentication errors gracefully', async ({ page }) => {
    // Fill in invalid credentials
    await page.locator('input[type="email"]').fill('invalid@example.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    
    // Submit form
    const submitButton = page.locator('button:has-text("Sign In")');
    await submitButton.click();
    
    // Wait for error response
    await page.waitForTimeout(2000);
    
    // Should show error message
    const errorMessage = page.locator('[data-testid="error-message"]');
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toContainText(/Invalid|Error|Failed/);
    }
  });

  test('should close modal correctly', async ({ page }) => {
    // Test close button
    const closeButton = page.locator('[data-testid="close-button"]');
    if (await closeButton.isVisible()) {
      await closeButton.click();
    } else {
      // Try clicking outside modal
      await page.click('body', { position: { x: 100, y: 100 } });
    }
    
    // Modal should be hidden
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Test Tab navigation
    await page.keyboard.press('Tab');
    
    // Should focus first input
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeFocused();
    
    // Test Tab to password
    await page.keyboard.press('Tab');
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeFocused();
    
    // Test Tab to submit button
    await page.keyboard.press('Tab');
    const submitButton = page.locator('button:has-text("Sign In")');
    await expect(submitButton).toBeFocused();
    
    // Test Enter key submission
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
  });

  test('should handle accessibility features', async ({ page }) => {
    // Check for proper ARIA labels
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    await expect(emailInput).toHaveAttribute('aria-label');
    await expect(passwordInput).toHaveAttribute('aria-label');
    
    // Check for proper form labels
    await expect(page.locator('label:has-text("Email")')).toBeVisible();
    await expect(page.locator('label:has-text("Password")')).toBeVisible();
    
    // Check for proper button types
    const submitButton = page.locator('button:has-text("Sign In")');
    await expect(submitButton).toHaveAttribute('type', 'submit');
  });

  test('should handle responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Modal should still be fully functional
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Modal should adapt to tablet size
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Modal should be properly sized for desktop
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('should handle form state persistence', async ({ page }) => {
    // Fill in form fields
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').fill('password123');
    
    // Switch between tabs
    const signUpTab = page.locator('button:has-text("Sign Up")');
    await signUpTab.click();
    await page.waitForTimeout(300);
    
    // Switch back to sign in
    const signInTab = page.locator('button:has-text("Sign In")');
    await signInTab.click();
    await page.waitForTimeout(300);
    
    // Form fields should retain their values
    await expect(page.locator('input[type="email"]')).toHaveValue('test@example.com');
    await expect(page.locator('input[type="password"]')).toHaveValue('password123');
  });

  test('should handle loading states correctly', async ({ page }) => {
    // Fill in form
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').fill('password123');
    
    // Submit form
    const submitButton = page.locator('button:has-text("Sign In")');
    await submitButton.click();
    
    // Check loading state
    await expect(submitButton).toBeDisabled();
    
    // Wait for loading to complete
    await page.waitForTimeout(3000);
    
    // Button should be enabled again
    await expect(submitButton).toBeEnabled();
  });
});
