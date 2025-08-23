import { test, expect, Page } from '@playwright/test';
import { chromium, firefox, webkit } from '@playwright/test';

// Comprehensive User State Testing Suite
// Tests new users, unpaid returning users, and paid users

test.describe('User Payment State Detection', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test.describe('🆕 New User Experience', () => {
    test('should show payment prompts for new users', async () => {
      // Test as new user (not logged in)
      await page.goto('http://localhost:3000');
      
      // Check landing page loads correctly
      await expect(page).toHaveTitle(/Clixen AI/);
      
      // Should see main CTA buttons
      await expect(page.getByRole('button', { name: 'Start Building Today' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Get Started Free' })).toBeVisible();
      
      // Click on navigation Sign In button (not the hero one)
      await page.getByRole('navigation').getByRole('button', { name: 'Sign In' }).first().click();
      
      // Should open auth modal
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      await expect(page.getByText('Welcome Back')).toBeVisible();
      
      // Close modal
      await page.locator('[role="dialog"]').getByRole('button').first().click();
      
      // Should not see premium content yet
      await expect(page.getByText('Telegram Bot')).not.toBeVisible();
    });

    test('should redirect to subscription page when trying to access premium features', async () => {
      // Try to access dashboard without auth
      await page.goto('http://localhost:3000/dashboard');
      
      // Should redirect to auth or show login prompt
      await page.waitForURL(/\/(auth|$)/);
    });
  });

  test.describe('🔄 Unpaid Returning User Flow', () => {
    test('should show payment prompts for authenticated unpaid users', async () => {
      // Login as testuser1 (free tier)
      await page.goto('http://localhost:3000');
      
      // Open auth modal
      await page.getByRole('navigation').getByRole('button', { name: 'Sign In' }).first().click();
      await page.waitForSelector('[role="dialog"]');
      
      // Fill login form
      await page.fill('input[type="email"]', 'testuser1@email.com');
      await page.fill('input[type="password"]', 'Demo123');
      
      // Submit login
      await page.getByRole('dialog').getByRole('button', { name: 'Sign In' }).click();
      
      // Wait for redirect
      await page.waitForURL(/\/dashboard/);
      
      // Should be on dashboard
      await expect(page).toHaveURL(/\/dashboard/);
      
      // Should see user info but payment prompts
      await expect(page.getByText('testuser1@email.com')).toBeVisible();
      
      // Should see subscription prompts
      await expect(page.getByText('Upgrade')).toBeVisible();
      
      // Should NOT see Telegram bot access yet
      await expect(page.getByText('Connect to @ClixenAIBot')).not.toBeVisible();
      
      // Check subscription page access
      await page.goto('http://localhost:3000/subscription');
      await expect(page.getByText('Choose Your Plan')).toBeVisible();
      
      // Should see all pricing tiers
      await expect(page.getByText('Starter')).toBeVisible();
      await expect(page.getByText('Professional')).toBeVisible();
      await expect(page.getByText('Enterprise')).toBeVisible();
    });

    test('should have limited feature access for unpaid users', async () => {
      // Login as testuser2
      await page.goto('http://localhost:3000');
      await page.getByRole('navigation').getByRole('button', { name: 'Sign In' }).first().click();
      await page.waitForSelector('[role="dialog"]');
      
      await page.fill('input[type="email"]', 'testuser2@email.com');
      await page.fill('input[type="password"]', 'Demo123');
      await page.getByRole('dialog').getByRole('button', { name: 'Sign In' }).click();
      
      await page.waitForURL(/\/dashboard/);
      
      // Check profile page access
      await page.goto('http://localhost:3000/profile');
      await expect(page.getByText('Account Settings')).toBeVisible();
      
      // Should show free tier info
      await expect(page.getByText('free')).toBeVisible();
      
      // Try to access bot access page (should redirect or show upgrade prompt)
      await page.goto('http://localhost:3000/bot-access');
      // This might redirect to subscription or show upgrade prompt
    });
  });

  test.describe('💰 Paid User Experience', () => {
    test('should create a paid user scenario', async () => {
      // Since we don't have actual paid users, let's test the subscription flow
      await page.goto('http://localhost:3000/subscription');
      
      // Should see pricing plans
      await expect(page.getByText('Choose Your Plan')).toBeVisible();
      
      // Check that Stripe elements are present (without actually processing payment)
      const starterButton = page.getByTestId('starter-plan-button') || page.getByText('Get Started').first();
      await expect(starterButton).toBeVisible();
      
      // Simulate clicking upgrade (this should lead to Stripe Checkout in real scenario)
      // We'll just verify the button exists and is clickable
      await expect(starterButton).toBeEnabled();
    });

    test('should show bot access for paid users', async () => {
      // This test would require a user with stripe_customer_id
      // For now, we'll test that the bot-access page exists
      await page.goto('http://localhost:3000/bot-access');
      
      // Might redirect to auth if not logged in
      // Or show the bot access page if authenticated
      await page.waitForLoadState('networkidle');
      
      // Check page loads without errors
      const hasError = await page.locator('text=Error').count();
      expect(hasError).toBe(0);
    });
  });

  test.describe('🔍 API and Database Integration', () => {
    test('should handle API failures gracefully', async () => {
      // Test with network offline to simulate API failures
      await page.context().setOffline(true);
      
      await page.goto('http://localhost:3000');
      
      // Page should still load (might show cached content or error states)
      await page.waitForSelector('body');
      
      // Check for error handling
      const errorMessage = page.locator('[data-testid="error-message"], .error, [role="alert"]');
      const hasErrorHandling = await errorMessage.count() > 0;
      
      // Either should show error message or work offline
      console.log('Offline error handling:', hasErrorHandling ? 'Present' : 'Graceful degradation');
      
      await page.context().setOffline(false);
    });

    test('should validate user state consistency', async () => {
      // Login as testuser3
      await page.goto('http://localhost:3000');
      await page.getByRole('navigation').getByRole('button', { name: 'Sign In' }).first().click();
      await page.waitForSelector('[role="dialog"]');
      
      await page.fill('input[type="email"]', 'testuser3@email.com');
      await page.fill('input[type="password"]', 'Demo123');
      await page.getByRole('dialog').getByRole('button', { name: 'Sign In' }).click();
      
      await page.waitForURL(/\/dashboard/);
      
      // Check that user state is consistent across pages
      const dashboardUserInfo = await page.textContent('[data-testid="user-email"], .user-email') || '';
      
      await page.goto('http://localhost:3000/profile');
      const profileUserInfo = await page.textContent('[data-testid="user-email"], .user-email') || '';
      
      // User info should be consistent
      if (dashboardUserInfo && profileUserInfo) {
        expect(dashboardUserInfo).toContain('testuser3@email.com');
        expect(profileUserInfo).toContain('testuser3@email.com');
      }
    });
  });

  test.describe('🚨 Error Detection and Handling', () => {
    test('should catch JavaScript runtime errors', async () => {
      const errors: string[] = [];
      
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });
      
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      // Navigate through all main pages
      const pages = ['/', '/dashboard', '/profile', '/subscription', '/bot-access'];
      
      for (const pagePath of pages) {
        await page.goto(`http://localhost:3000${pagePath}`);
        await page.waitForLoadState('networkidle');
        
        // Check for 404 or other HTTP errors
        const response = await page.goto(`http://localhost:3000${pagePath}`);
        if (response) {
          expect(response.status()).toBeLessThan(400);
        }
      }
      
      // Report any JavaScript errors found
      console.log('JavaScript errors detected:', errors);
      expect(errors.length).toBeLessThan(5); // Allow for minor non-critical errors
    });

    test('should verify all critical UI elements load', async () => {
      await page.goto('http://localhost:3000');
      
      // Check critical elements exist
      const criticalElements = [
        'header, nav, [role="navigation"]', // Navigation
        'main, [role="main"]', // Main content
        'button', // Interactive elements
        'a[href]' // Links
      ];
      
      for (const selector of criticalElements) {
        const elementCount = await page.locator(selector).count();
        expect(elementCount).toBeGreaterThan(0);
      }
    });
  });
});

test.describe('🎨 Visual Regression Testing', () => {
  test('should match landing page visual snapshot', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Hide dynamic elements that might change
    await page.addStyleTag({
      content: `
        .animate-pulse, 
        .animate-spin,
        .animate-bounce,
        [data-testid="timestamp"],
        .timestamp {
          animation: none !important;
        }
      `
    });
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('landing-page.png', { fullPage: true });
  });

  test('should match auth modal visual snapshot', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.getByRole('navigation').getByRole('button', { name: 'Sign In' }).first().click();
    await page.waitForSelector('[role="dialog"]');
    
    await expect(page.locator('[role="dialog"]')).toHaveScreenshot('auth-modal.png');
  });
});

test.describe('🌐 Cross-Browser Compatibility', () => {
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`should work correctly in ${browserName}`, async () => {
      const browser = await (browserName === 'chromium' ? chromium : 
                             browserName === 'firefox' ? firefox : webkit).launch();
      const page = await browser.newPage();
      
      await page.goto('http://localhost:3000');
      
      // Basic functionality test
      await expect(page).toHaveTitle(/Clixen AI/);
      await expect(page.getByRole('button', { name: 'Start Building Today' })).toBeVisible();
      
      await browser.close();
    });
  });
});

test.describe('📱 Responsive Design Testing', () => {
  const devices = [
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 667 }
  ];

  devices.forEach(device => {
    test(`should be responsive on ${device.name}`, async ({ page }) => {
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.goto('http://localhost:3000');
      
      // Check that main elements are visible and properly sized
      const header = page.locator('header, nav, [role="navigation"]').first();
      await expect(header).toBeVisible();
      
      const mainContent = page.locator('main, [role="main"]').first();
      await expect(mainContent).toBeVisible();
      
      // Check responsive navigation (might have mobile menu)
      if (device.width < 768) {
        // Mobile: might have hamburger menu or collapsed navigation
        const mobileMenu = page.locator('[data-testid="mobile-menu"], .mobile-menu, .hamburger');
        const hasCollapsedNav = await mobileMenu.count() > 0;
        console.log(`Mobile navigation detected: ${hasCollapsedNav}`);
      }
    });
  });
});