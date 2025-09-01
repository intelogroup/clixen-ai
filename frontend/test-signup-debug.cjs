const puppeteer = require('playwright');

async function testSignupFlow() {
  console.log('🚀 Starting signup debug test...');
  
  const browser = await puppeteer.chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Enable console logging
  page.on('console', msg => {
    console.log(`[BROWSER]: ${msg.text()}`);
  });

  // Listen for network requests and responses
  page.on('request', request => {
    if (request.url().includes('/api/') || request.url().includes('auth') || request.url().includes('stack')) {
      console.log(`[REQUEST]: ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', response => {
    if (response.url().includes('/api/') || response.url().includes('auth') || response.url().includes('stack')) {
      console.log(`[RESPONSE]: ${response.status()} ${response.url()}`);
      if (!response.ok()) {
        console.log(`[ERROR RESPONSE]: Status ${response.status()}: ${response.statusText()}`);
      }
    }
  });

  // Handle unhandled errors
  page.on('pageerror', error => {
    console.error(`[PAGE ERROR]: ${error.message}`);
  });

  try {
    console.log('📍 Navigating to signup page...');
    await page.goto('http://localhost:3000/auth/signup', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('📍 Waiting for page to load...');
    await page.waitForTimeout(3000);

    // Take a screenshot
    await page.screenshot({ path: 'signup-debug-loaded.png', fullPage: true });
    console.log('📸 Screenshot saved: signup-debug-loaded.png');

    // Check for any error messages on the page
    const errorElements = await page.$$('text=/error|fail|Error|Fail/i');
    if (errorElements.length > 0) {
      console.log('❌ Found error elements on page:');
      for (const element of errorElements) {
        const text = await element.textContent();
        console.log(`  - ${text}`);
      }
    }

    // Try to find the signup form and inputs
    console.log('📍 Looking for signup form elements...');
    
    // Wait a bit more for Stack Auth to load
    await page.waitForTimeout(5000);

    // Look for email input
    const emailInputs = await page.$$('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    console.log(`📍 Found ${emailInputs.length} email input(s)`);

    // Look for password input  
    const passwordInputs = await page.$$('input[type="password"], input[name="password"], input[placeholder*="password" i]');
    console.log(`📍 Found ${passwordInputs.length} password input(s)`);

    // Look for submit buttons
    const submitButtons = await page.$$('button[type="submit"], button:has-text("Sign up"), button:has-text("Create"), input[type="submit"]');
    console.log(`📍 Found ${submitButtons.length} submit button(s)`);

    if (emailInputs.length > 0 && passwordInputs.length > 0 && submitButtons.length > 0) {
      console.log('✅ Form elements found! Attempting to fill and submit...');
      
      // Fill the form
      const testEmail = `test-debug-${Date.now()}@test.com`;
      const testPassword = 'TestPassword123!';
      
      await emailInputs[0].fill(testEmail);
      console.log(`📍 Filled email: ${testEmail}`);
      
      await passwordInputs[0].fill(testPassword);
      console.log('📍 Filled password');
      
      // Take screenshot before submit
      await page.screenshot({ path: 'signup-debug-filled.png', fullPage: true });
      console.log('📸 Screenshot saved: signup-debug-filled.png');
      
      // Submit the form
      console.log('📍 Clicking submit button...');
      await submitButtons[0].click();
      
      // Wait for response
      console.log('📍 Waiting for response...');
      await page.waitForTimeout(5000);
      
      // Take screenshot after submit
      await page.screenshot({ path: 'signup-debug-after-submit.png', fullPage: true });
      console.log('📸 Screenshot saved: signup-debug-after-submit.png');
      
      // Check current URL
      const currentUrl = page.url();
      console.log(`📍 Current URL: ${currentUrl}`);
      
      // Look for success or error messages
      const successElements = await page.$$('text=/success|dashboard|welcome/i');
      const errorElements2 = await page.$$('text=/error|fail|invalid|wrong/i');
      
      console.log(`📍 Found ${successElements.length} success indicator(s)`);
      console.log(`📍 Found ${errorElements2.length} error indicator(s)`);
      
      if (errorElements2.length > 0) {
        console.log('❌ Error messages found:');
        for (const element of errorElements2) {
          const text = await element.textContent();
          console.log(`  - ${text}`);
        }
      }

    } else {
      console.log('❌ Could not find required form elements');
      console.log('📍 Taking screenshot for debugging...');
      await page.screenshot({ path: 'signup-debug-no-form.png', fullPage: true });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'signup-debug-error.png', fullPage: true });
    console.log('📸 Error screenshot saved: signup-debug-error.png');
  }

  await browser.close();
  console.log('🏁 Signup debug test completed');
}

testSignupFlow().catch(console.error);