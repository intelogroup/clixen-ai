const puppeteer = require('playwright');

async function testCustomSignup() {
  console.log('🚀 Testing custom email/password signup...');
  
  const browser = await puppeteer.chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Enable console logging
  page.on('console', msg => {
    console.log(`[BROWSER]: ${msg.text()}`);
  });

  // Listen for network requests and responses
  page.on('request', request => {
    console.log(`[REQUEST]: ${request.method()} ${request.url()}`);
    
    // Log request body for POST requests
    if (request.method() === 'POST') {
      try {
        const body = request.postData();
        if (body) {
          console.log(`[REQUEST BODY]: ${body}`);
        }
      } catch (e) {
        console.log('[REQUEST BODY]: Unable to capture body');
      }
    }
  });

  page.on('response', async response => {
    console.log(`[RESPONSE]: ${response.status()} ${response.url()}`);
    
    if (!response.ok()) {
      console.log(`[ERROR RESPONSE]: Status ${response.status()}: ${response.statusText()}`);
      try {
        const errorBody = await response.text();
        console.log(`[ERROR BODY]: ${errorBody}`);
      } catch (e) {
        console.log('[ERROR BODY]: Unable to capture error response');
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
    
    console.log('📍 Waiting for custom form to load...');
    await page.waitForTimeout(5000);
    
    // Find custom form inputs (by name attribute)
    console.log('📍 Looking for custom form inputs...');
    const emailInput = await page.$('input[name="email"]');
    const passwordInput = await page.$('input[name="password"]');
    const confirmPasswordInput = await page.$('input[name="confirmPassword"]');
    const submitButton = await page.$('button[type="submit"]');

    if (!emailInput || !passwordInput || !confirmPasswordInput || !submitButton) {
      throw new Error('Custom form elements not found');
    }

    console.log('✅ Found all custom form elements');

    // Fill the form with test data
    const testEmail = `test-custom-${Date.now()}@example.com`;
    const testPassword = 'SecurePassword123!';
    
    console.log(`📍 Filling email: ${testEmail}`);
    await emailInput.fill(testEmail);
    
    console.log('📍 Filling password fields...');
    await passwordInput.fill(testPassword);
    await confirmPasswordInput.fill(testPassword);
    
    // Take screenshot before submit
    await page.screenshot({ path: 'custom-signup-before-submit.png', fullPage: true });
    console.log('📸 Screenshot saved: custom-signup-before-submit.png');

    console.log('📍 Submitting custom form...');
    
    // Click submit and wait for network activity
    await Promise.all([
      page.waitForResponse(response => 
        response.url().includes('api') && response.request().method() === 'POST', 
        { timeout: 10000 }
      ).catch(() => console.log('⚠️  No API POST response detected')),
      submitButton.click()
    ]);

    // Wait a bit for any redirects or responses
    console.log('📍 Waiting for response...');
    await page.waitForTimeout(3000);

    // Take screenshot after submit
    await page.screenshot({ path: 'custom-signup-after-submit.png', fullPage: true });
    console.log('📸 Screenshot saved: custom-signup-after-submit.png');

    // Check current URL and page content
    const currentUrl = page.url();
    console.log(`📍 Current URL after signup: ${currentUrl}`);
    
    // Look for success indicators
    const isDashboard = currentUrl.includes('/dashboard');
    const pageContent = await page.$eval('body', el => el.innerText);
    const hasSuccessText = /success|welcome|dashboard|created|account/i.test(pageContent);
    
    console.log(`📍 Is dashboard page: ${isDashboard}`);
    console.log(`📍 Has success text: ${hasSuccessText}`);
    
    // Look for error messages
    const errorMessages = await page.$$('text=/error|fail|invalid|wrong/i');
    if (errorMessages.length > 0) {
      console.log('❌ Error messages found:');
      for (const errorMsg of errorMessages) {
        const text = await errorMsg.textContent();
        console.log(`  - ${text}`);
      }
    }

    // Look for success indicators
    const successMessages = await page.$$('text=/success|created|account.*created|welcome/i');
    if (successMessages.length > 0) {
      console.log('✅ Success messages found:');
      for (const successMsg of successMessages) {
        const text = await successMsg.textContent();
        console.log(`  - ${text}`);
      }
    }

    // Success or failure assessment
    if (isDashboard) {
      console.log('🎉 SUCCESS: User was redirected to dashboard!');
    } else if (hasSuccessText) {
      console.log('🎉 SUCCESS: Signup appears successful!');  
    } else if (errorMessages.length === 0 && successMessages.length === 0) {
      console.log('⚠️  UNCLEAR: No clear success or error indicators');
    } else {
      console.log('❌ FAILURE: Signup did not appear to complete successfully');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    await page.screenshot({ path: 'custom-signup-error.png', fullPage: true });
    console.log('📸 Error screenshot saved: custom-signup-error.png');
  }

  await browser.close();
  console.log('🏁 Custom signup test completed');
}

testCustomSignup().catch(console.error);