import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load landing page successfully', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Clixen AI|B2C Automation/);
    
    // Check main content is loaded
    await expect(page.locator('main')).toBeVisible();
    
    // Verify no console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Assert no critical console errors
    expect(consoleErrors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('analytics')
    )).toHaveLength(0);
  });

  test('should display hero section correctly', async ({ page }) => {
    // Check hero headline
    await expect(page.locator('h1')).toBeVisible();
    
    // Check CTA button
    const ctaButton = page.locator('button:has-text("Start Free Today")');
    await expect(ctaButton).toBeVisible();
    await expect(ctaButton).toBeEnabled();
    
    // Check social proof elements
    await expect(page.locator('text=2,000+ active users')).toBeVisible();
    await expect(page.locator('text=50K+ tasks automated')).toBeVisible();
    
    // Check hero image/animation
    await expect(page.locator('[data-testid="hero-animation"]')).toBeVisible();
  });

  test('should display feature showcase', async ({ page }) => {
    // Check feature grid
    const features = page.locator('[data-testid="feature-card"]');
    await expect(features).toHaveCount(6);
    
    // Check feature titles
    const expectedFeatures = [
      'AI-Powered Automation',
      'Document Processing',
      'Multi-Agent Orchestration',
      'Real-time Analytics',
      'Telegram Integration',
      'Scalable Infrastructure'
    ];
    
    for (const feature of expectedFeatures) {
      await expect(page.locator(`text=${feature}`)).toBeVisible();
    }
    
    // Check feature descriptions
    await expect(page.locator('text=Process documents with AI')).toBeVisible();
    await expect(page.locator('text=Automate complex workflows')).toBeVisible();
  });

  test('should display how it works section', async ({ page }) => {
    // Check section header
    await expect(page.locator('h2:has-text("How It Works")')).toBeVisible();
    
    // Check steps
    const steps = page.locator('[data-testid="step-card"]');
    await expect(steps).toHaveCount(3);
    
    // Check step content
    await expect(page.locator('text=1. Connect')).toBeVisible();
    await expect(page.locator('text=2. Configure')).toBeVisible();
    await expect(page.locator('text=3. Automate')).toBeVisible();
    
    // Check step descriptions
    await expect(page.locator('text=Link your accounts')).toBeVisible();
    await expect(page.locator('text=Set up workflows')).toBeVisible();
    await expect(page.locator('text=Watch automation run')).toBeVisible();
  });

  test('should display pricing section', async ({ page }) => {
    // Check section header
    await expect(page.locator('h2:has-text("Pricing")')).toBeVisible();
    
    // Check pricing tiers
    const pricingCards = page.locator('[data-testid="pricing-card"]');
    await expect(pricingCards).toHaveCount(3);
    
    // Check tier names
    await expect(page.locator('text=Free')).toBeVisible();
    await expect(page.locator('text=Pro')).toBeVisible();
    await expect(page.locator('text=Enterprise')).toBeVisible();
    
    // Check pricing
    await expect(page.locator('text=$0')).toBeVisible();
    await expect(page.locator('text=$19')).toBeVisible();
    await expect(page.locator('text=$99')).toBeVisible();
    
    // Check CTA buttons
    await expect(page.locator('button:has-text("Start Free")')).toBeVisible();
    await expect(page.locator('button:has-text("Start Pro Trial")')).toBeVisible();
    await expect(page.locator('button:has-text("Contact Sales")')).toBeVisible();
  });

  test('should display footer correctly', async ({ page }) => {
    // Check footer content
    await expect(page.locator('footer')).toBeVisible();
    
    // Check company info
    await expect(page.locator('text=Clixen AI')).toBeVisible();
    await expect(page.locator('text=Automate everything')).toBeVisible();
    
    // Check social links
    await expect(page.locator('a[href*="twitter"]')).toBeVisible();
    await expect(page.locator('a[href*="linkedin"]')).toBeVisible();
    await expect(page.locator('a[href*="github"]')).toBeVisible();
    
    // Check navigation links
    await expect(page.locator('a:has-text("Features")')).toBeVisible();
    await expect(page.locator('a:has-text("Pricing")')).toBeVisible();
    await expect(page.locator('a:has-text("Support")')).toBeVisible();
  });

  test('should handle mobile responsiveness', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check mobile menu button
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
    await expect(mobileMenuButton).toBeVisible();
    
    // Check mobile menu functionality
    await mobileMenuButton.click();
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Check mobile menu items
    await expect(page.locator('a:has-text("Features")')).toBeVisible();
    await expect(page.locator('a:has-text("Pricing")')).toBeVisible();
    await expect(page.locator('a:has-text("Sign In")')).toBeVisible();
    
    // Close mobile menu
    await page.locator('[data-testid="mobile-menu-close"]').click();
    await expect(page.locator('[data-testid="mobile-menu"]')).not.toBeVisible();
  });

  test('should handle smooth scrolling', async ({ page }) => {
    // Test smooth scrolling to sections
    const featuresLink = page.locator('a[href="#features"]');
    await featuresLink.click();
    
    // Wait for scroll animation
    await page.waitForTimeout(1000);
    
    // Check if features section is in view
    const featuresSection = page.locator('#features');
    await expect(featuresSection).toBeVisible();
    
    // Test scroll to pricing
    const pricingLink = page.locator('a[href="#pricing"]');
    await pricingLink.click();
    await page.waitForTimeout(1000);
    
    const pricingSection = page.locator('#pricing');
    await expect(pricingSection).toBeVisible();
  });

  test('should handle CTA button interactions', async ({ page }) => {
    // Test primary CTA button
    const primaryCTA = page.locator('button:has-text("Start Free Today")');
    await expect(primaryCTA).toBeVisible();
    
    // Check button styling
    await expect(primaryCTA).toHaveClass(/bg-gradient/);
    
    // Test button hover effect
    await primaryCTA.hover();
    await page.waitForTimeout(500);
    
    // Test secondary CTA
    const secondaryCTA = page.locator('button:has-text("See How It Works")');
    await expect(secondaryCTA).toBeVisible();
    await secondaryCTA.click();
    
    // Should scroll to how it works section
    await page.waitForTimeout(1000);
    const howItWorksSection = page.locator('#how-it-works');
    await expect(howItWorksSection).toBeVisible();
  });

  test('should handle animations and transitions', async ({ page }) => {
    // Check for animation classes
    const animatedElements = page.locator('[class*="animate-"]');
    await expect(animatedElements.first()).toBeVisible();
    
    // Check for transition classes
    const transitionElements = page.locator('[class*="transition-"]');
    await expect(transitionElements.first()).toBeVisible();
    
    // Test hover animations on feature cards
    const firstFeatureCard = page.locator('[data-testid="feature-card"]').first();
    await firstFeatureCard.hover();
    await page.waitForTimeout(500);
    
    // Check for hover effects
    await expect(firstFeatureCard).toHaveClass(/hover:/);
  });

  test('should handle accessibility features', async ({ page }) => {
    // Check for proper heading hierarchy
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    await expect(headings.first()).toBeVisible();
    
    // Check for alt text on images
    const images = page.locator('img');
    for (let i = 0; i < await images.count(); i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).toBeTruthy();
    }
    
    // Check for proper button labels
    const buttons = page.locator('button');
    for (let i = 0; i < await buttons.count(); i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      expect(text || ariaLabel).toBeTruthy();
    }
  });

  test('should handle performance metrics', async ({ page }) => {
    // Measure page load time
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Check for performance metrics in console
    const performanceEntries: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('performance') || msg.text().includes('timing')) {
        performanceEntries.push(msg.text());
      }
    });
    
    // Reload page to capture performance data
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should have some performance logging
    expect(performanceEntries.length).toBeGreaterThan(0);
  });
});
