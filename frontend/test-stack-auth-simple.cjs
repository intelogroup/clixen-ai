const { chromium } = require('playwright');

/**
 * Simple Stack Auth Test
 * Quick test to verify Stack Auth is working with new credentials
 */

const BASE_URL = 'http://localhost:3000';

async function testStackAuthForms() {
  console.log('🚀 Testing Stack Auth with new credentials');
  console.log('=' .repeat(60));
  
  const browser = await chromium.launch({ 
    headless: true,
    slowMo: 50
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // Test 1: Check sign-in page loads
    console.log('\n📋 Testing Sign-In Page...');
    await page.goto(`${BASE_URL}/auth/signin`);
    await page.waitForLoadState('networkidle');
    
    // Look for Stack Auth elements or custom form
    const hasEmailInput = await page.locator('input[type="email"], input[name="email"], input[id="email"]').isVisible().catch(() => false);
    const hasPasswordInput = await page.locator('input[type="password"], input[name="password"], input[id="password"]').isVisible().catch(() => false);
    const hasSubmitButton = await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Continue")').isVisible().catch(() => false);
    
    console.log(`  ✓ Email field: ${hasEmailInput ? '✅ Found' : '❌ Not found'}`);
    console.log(`  ✓ Password field: ${hasPasswordInput ? '✅ Found' : '❌ Not found'}`);
    console.log(`  ✓ Submit button: ${hasSubmitButton ? '✅ Found' : '❌ Not found'}`);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'signin-page-debug.png' });
    console.log('  📸 Screenshot saved: signin-page-debug.png');
    
    // Test 2: Check sign-up page loads
    console.log('\n📋 Testing Sign-Up Page...');
    await page.goto(`${BASE_URL}/auth/signup`);
    await page.waitForLoadState('networkidle');
    
    const hasSignUpForm = await page.locator('input[type="email"], input[name="email"], input[id="email"]').isVisible().catch(() => false);
    console.log(`  ✓ Sign-up form: ${hasSignUpForm ? '✅ Found' : '❌ Not found'}`);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'signup-page-debug.png' });
    console.log('  📸 Screenshot saved: signup-page-debug.png');
    
    // Test 3: Try to interact with form
    console.log('\n📋 Testing Form Interaction...');
    await page.goto(`${BASE_URL}/auth/signin`);
    await page.waitForLoadState('networkidle');
    
    try {
      // Try multiple selectors for email field
      const emailSelectors = [
        'input[type="email"]',
        'input[name="email"]',
        'input[id="email"]',
        'input[placeholder*="email" i]',
        'input[aria-label*="email" i]'
      ];
      
      let emailFilled = false;
      for (const selector of emailSelectors) {
        try {
          const element = await page.locator(selector).first();
          if (await element.isVisible()) {
            await element.fill('test@example.com');
            emailFilled = true;
            console.log(`  ✅ Filled email using selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (!emailFilled) {
        console.log('  ❌ Could not fill email field');
      }
      
      // Try multiple selectors for password field
      const passwordSelectors = [
        'input[type="password"]',
        'input[name="password"]',
        'input[id="password"]',
        'input[placeholder*="password" i]',
        'input[aria-label*="password" i]'
      ];
      
      let passwordFilled = false;
      for (const selector of passwordSelectors) {
        try {
          const element = await page.locator(selector).first();
          if (await element.isVisible()) {
            await element.fill('TestPassword123!');
            passwordFilled = true;
            console.log(`  ✅ Filled password using selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (!passwordFilled) {
        console.log('  ❌ Could not fill password field');
      }
      
      // Check for error messages after attempting to fill
      await page.waitForTimeout(1000);
      const hasError = await page.locator('[class*="error"], [role="alert"], .text-red-500').isVisible().catch(() => false);
      
      if (hasError) {
        const errorText = await page.locator('[class*="error"], [role="alert"], .text-red-500').first().textContent();
        console.log(`  ⚠️  Error message displayed: "${errorText}"`);
      }
      
    } catch (error) {
      console.log('  ❌ Form interaction failed:', error.message);
    }
    
    // Final screenshot
    await page.screenshot({ path: 'final-state.png' });
    console.log('  📸 Final screenshot saved: final-state.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('✨ Test completed! Check screenshots for visual debugging.');
}

// Run the test
testStackAuthForms().catch(console.error);