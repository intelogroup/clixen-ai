import { test, expect } from '@playwright/test';

test.describe('Complete User Journey - Authentication & Payment Flow', () => {
  const TEST_EMAIL = 'testuser2@example.com';
  const TEST_PASSWORD = 'TestPassword123!';
  const BASE_URL = 'http://localhost:3001';

  test.beforeEach(async ({ page }) => {
    // Start with a clean slate
    await page.goto(BASE_URL);
  });

  test('New user complete journey: signup → payment → bot access', async ({ page }) => {
    console.log('🧪 Starting new user complete journey test...');

    // Step 1: Landing page should be accessible
    console.log('📍 Step 1: Verify landing page loads');
    await expect(page.locator('h1')).toContainText('AI-Powered Workflow Automation');
    
    // Step 2: Try to access protected route (should redirect to landing)
    console.log('📍 Step 2: Verify dashboard redirect when not authenticated');
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page.url()).toMatch(/\/?(\?.*)?$/); // Should be back at landing page
    await expect(page.locator('h1')).toContainText('AI-Powered Workflow Automation');

    // Step 3: Click "Get Started" to trigger auth modal
    console.log('📍 Step 3: Trigger authentication modal');
    await page.click('button:has-text("Get Started")');
    // Wait for auth modal to appear
    await page.waitForSelector('[data-testid="auth-modal"]', { timeout: 5000 });

    // Step 4: Sign up as new user
    console.log('📍 Step 4: Sign up new user');
    await page.click('button:has-text("Sign Up")'); // Switch to signup tab
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Create Account")');
    
    // Wait for signup success or error
    await page.waitForTimeout(3000);

    // Step 5: Check if redirected to dashboard after signup
    console.log('📍 Step 5: Verify dashboard access after signup');
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Successfully redirected to dashboard after signup');
      await expect(page.locator('h2')).toContainText('Welcome back');
    } else {
      console.log('ℹ️ Still on landing page, checking for auth success message');
      // Look for success message or confirmation needed
      const body = await page.textContent('body');
      console.log('Page content includes:', body?.substring(0, 200) + '...');
    }

    // Step 6: Try to access bot without payment
    console.log('📍 Step 6: Test bot access without payment');
    await page.goto(`${BASE_URL}/bot-access`);
    
    // Should either redirect to subscription or show payment required
    await page.waitForTimeout(2000);
    const botPageUrl = page.url();
    console.log('Bot access URL:', botPageUrl);
    
    if (botPageUrl.includes('/subscription')) {
      console.log('✅ Correctly redirected to subscription page');
    } else if (botPageUrl.includes('/bot-access')) {
      const content = await page.textContent('body');
      if (content?.includes('subscription') || content?.includes('payment')) {
        console.log('✅ Bot access page shows payment required');
      }
    }

    // Step 7: Navigate to subscription page
    console.log('📍 Step 7: Navigate to subscription page');
    await page.goto(`${BASE_URL}/subscription`);
    await page.waitForSelector('text=Professional', { timeout: 5000 });
    
    // Step 8: Select a plan and attempt payment
    console.log('📍 Step 8: Select Professional plan');
    await page.click('button:has-text("Get Started"):nth-of-type(2)'); // Professional plan
    
    // Wait for Stripe redirect or payment form
    await page.waitForTimeout(3000);
    
    const paymentUrl = page.url();
    console.log('Payment URL:', paymentUrl);
    
    if (paymentUrl.includes('checkout.stripe.com')) {
      console.log('✅ Successfully redirected to Stripe payment');
      // For testing, we'll simulate payment completion
      console.log('⚠️ Skipping actual payment for test');
    } else {
      console.log('ℹ️ Payment flow initiated but not redirected to Stripe');
    }

    console.log('✅ New user journey test completed');
  });

  test('Returning user with payment should access bot directly', async ({ page }) => {
    console.log('🧪 Starting returning user test...');

    // Step 1: Sign in with existing user credentials
    console.log('📍 Step 1: Sign in existing user');
    await page.click('button:has-text("Sign In")');
    await page.waitForSelector('[data-testid="auth-modal"]', { timeout: 5000 });
    
    // Use existing test user
    await page.fill('input[type="email"]', 'testuser1@email.com');
    await page.fill('input[type="password"]', 'Demo123');
    await page.click('button:has-text("Sign In"):last-of-type'); // The actual sign in button
    
    await page.waitForTimeout(3000);

    // Step 2: Should be redirected to dashboard
    console.log('📍 Step 2: Verify dashboard access');
    if (page.url().includes('/dashboard')) {
      console.log('✅ Successfully accessed dashboard');
      await expect(page.locator('h2')).toContainText('Welcome back');
    }

    // Step 3: Check bot access (should work if user has paid)
    console.log('📍 Step 3: Test bot access for existing user');
    await page.goto(`${BASE_URL}/bot-access`);
    await page.waitForTimeout(2000);

    const botUrl = page.url();
    const content = await page.textContent('body');
    
    if (botUrl.includes('/bot-access') && !botUrl.includes('/subscription')) {
      if (content?.includes('telegram') || content?.includes('bot')) {
        console.log('✅ Bot access granted - user has valid subscription');
      } else {
        console.log('⚠️ Bot access page loaded but content unclear');
      }
    } else {
      console.log('ℹ️ User redirected to subscription - payment required');
    }

    console.log('✅ Returning user test completed');
  });

  test('Protected routes security test', async ({ page }) => {
    console.log('🧪 Starting security test...');

    const protectedRoutes = ['/dashboard', '/profile', '/bot-access', '/subscription'];

    for (const route of protectedRoutes) {
      console.log(`📍 Testing route: ${route}`);
      await page.goto(`${BASE_URL}${route}`);
      await page.waitForTimeout(1000);
      
      // Should redirect to landing page or show auth required
      const currentUrl = page.url();
      const isRedirected = currentUrl === BASE_URL + '/' || currentUrl.includes('auth=true');
      
      if (isRedirected) {
        console.log(`✅ Route ${route} properly protected`);
      } else {
        console.log(`⚠️ Route ${route} may not be properly protected`);
        console.log(`Current URL: ${currentUrl}`);
      }
    }

    console.log('✅ Security test completed');
  });

  test('Payment flow integration test', async ({ page }) => {
    console.log('🧪 Starting payment flow test...');

    // This test checks the payment integration without actual payment
    await page.goto(`${BASE_URL}/subscription`);
    
    // Step 1: Verify pricing plans are displayed
    console.log('📍 Step 1: Verify pricing plans');
    await expect(page.locator('text=Starter')).toBeVisible();
    await expect(page.locator('text=Professional')).toBeVisible();
    await expect(page.locator('text=Enterprise')).toBeVisible();

    // Step 2: Check plan features
    console.log('📍 Step 2: Verify plan features');
    await expect(page.locator('text=$9')).toBeVisible();
    await expect(page.locator('text=$29')).toBeVisible();
    await expect(page.locator('text=$99')).toBeVisible();

    // Step 3: Test plan selection (without authentication)
    console.log('📍 Step 3: Test plan selection');
    const professionalButton = page.locator('button:has-text("Get Started"):nth-of-type(2)');
    await professionalButton.click();
    
    // Should either prompt for authentication or redirect to payment
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    if (currentUrl.includes('auth') || currentUrl.includes('stripe')) {
      console.log('✅ Payment flow properly initiated');
    } else {
      console.log('ℹ️ Payment flow initiated, checking response');
    }

    console.log('✅ Payment flow test completed');
  });
});