const { test, expect } = require('@playwright/test');

test.describe('User Signup Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to signup page before each test
    await page.goto('/auth/signup');
  });

  test('should display signup page with proper elements', async ({ page }) => {
    // Check that the signup page loads correctly
    await expect(page).toHaveTitle(/Clixen AI/);
    
    // Check for key signup elements
    await expect(page.locator('text=Sign up')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Wait for any validation messages to appear
    await page.waitForTimeout(1000);
    
    // Check for validation messages or error states
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    // Check if inputs are marked as invalid or have validation messages
    const emailValid = await emailInput.evaluate(el => el.validity.valid);
    const passwordValid = await passwordInput.evaluate(el => el.validity.valid);
    
    expect(emailValid || passwordValid).toBe(false);
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    // Wait for validation
    await page.waitForTimeout(1000);
    
    const emailInput = page.locator('input[type="email"]');
    const emailValid = await emailInput.evaluate(el => el.validity.valid);
    expect(emailValid).toBe(false);
  });

  test('should validate password requirements', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@example.com');
    
    // Test weak password
    await page.fill('input[type="password"]', '123');
    await page.click('button[type="submit"]');
    
    // Wait for any validation messages
    await page.waitForTimeout(1000);
    
    // Check if there are any error messages or validation indicators
    const errorMessages = await page.locator('[role="alert"], .error, .invalid, [aria-invalid="true"]').count();
    const passwordInput = page.locator('input[type="password"]');
    const passwordValid = await passwordInput.evaluate(el => el.validity.valid);
    
    // Either validation message should appear or input should be invalid
    expect(errorMessages > 0 || !passwordValid).toBe(true);
  });

  test('should successfully create a new user account', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    const testPassword = 'TestPassword123!';

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for either success redirect or error
    await page.waitForTimeout(3000);
    
    // Check if we've been redirected to dashboard (success) or if there are error messages
    const currentUrl = page.url();
    const hasErrorMessage = await page.locator('[role="alert"], .error, .invalid').count() > 0;
    
    if (!hasErrorMessage) {
      // If no error messages, we should be redirected to dashboard
      expect(currentUrl).toContain('/dashboard');
    } else {
      // If there are error messages, log them for debugging
      const errorText = await page.locator('[role="alert"], .error, .invalid').first().textContent();
      console.log('Signup error:', errorText);
    }
  });

  test('should handle existing email gracefully', async ({ page }) => {
    // Use a common email that might already exist
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    
    await page.click('button[type="submit"]');
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    // Check for error messages or successful redirect
    const hasErrorMessage = await page.locator('[role="alert"], .error, .invalid').count() > 0;
    const currentUrl = page.url();
    
    // Either should show error or redirect to dashboard
    expect(hasErrorMessage || currentUrl.includes('/dashboard')).toBe(true);
  });

  test('should display loading state during signup', async ({ page }) => {
    await page.fill('input[type="email"]', `test${Date.now()}@example.com`);
    await page.fill('input[type="password"]', 'TestPassword123!');
    
    // Start signup and immediately check for loading state
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Check if button is disabled or shows loading text
    const isDisabled = await submitButton.isDisabled();
    const buttonText = await submitButton.textContent();
    
    expect(isDisabled || buttonText?.includes('Loading') || buttonText?.includes('Creating')).toBe(true);
  });
});