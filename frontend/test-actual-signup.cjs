const puppeteer = require('playwright');

async function testActualSignup() {
  console.log('🚀 Testing actual email/password signup submission...');
  
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
    
    console.log('📍 Waiting for Stack Auth to load...');
    await page.waitForTimeout(8000);
    
    // Find email and password inputs
    console.log('📍 Looking for form inputs...');
    const emailInput = await page.$('input[type="email"]');
    const passwordInputs = await page.$$('input[type="password"]');
    const submitButton = await page.$('button:has-text("Sign Up")');

    if (!emailInput || passwordInputs.length < 2 || !submitButton) {
      throw new Error('Required form elements not found');
    }

    console.log('✅ Found all required form elements');

    // Fill the form with test data
    const testEmail = `test-actual-${Date.now()}@example.com`;
    const testPassword = 'SecurePassword123!';
    
    console.log(`📍 Filling email: ${testEmail}`);
    await emailInput.fill(testEmail);
    
    console.log('📍 Filling password fields...');
    await passwordInputs[0].fill(testPassword);
    await passwordInputs[1].fill(testPassword); // repeat password
    
    // Take screenshot before submit
    await page.screenshot({ path: 'actual-signup-before-submit.png', fullPage: true });
    console.log('📸 Screenshot saved: actual-signup-before-submit.png');

    console.log('📍 Submitting form...');
    
    // Click submit and wait for network activity
    await Promise.all([
      page.waitForResponse(response => 
        response.url().includes('stack-auth.com') && response.request().method() === 'POST', 
        { timeout: 10000 }
      ).catch(() => console.log('⚠️  No Stack Auth POST response detected')),
      submitButton.click()
    ]);

    // Wait a bit for any redirects or responses
    console.log('📍 Waiting for response...');
    await page.waitForTimeout(5000);

    // Take screenshot after submit
    await page.screenshot({ path: 'actual-signup-after-submit.png', fullPage: true });
    console.log('📸 Screenshot saved: actual-signup-after-submit.png');

    // Check current URL and page content
    const currentUrl = page.url();
    console.log(`📍 Current URL after signup: ${currentUrl}`);
    
    // Look for success indicators
    const isDashboard = currentUrl.includes('/dashboard');
    const pageContent = await page.$eval('body', el => el.innerText);
    const hasSuccessText = /success|welcome|dashboard|signed.*in/i.test(pageContent);
    
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

    // If still on signup page, check for validation errors
    if (currentUrl.includes('/signup')) {
      console.log('⚠️  Still on signup page, checking for form errors...');
      const formErrors = await page.$$('[role="alert"], .error, .invalid');
      if (formErrors.length > 0) {
        console.log('📍 Form validation errors found:');
        for (const error of formErrors) {
          const text = await error.textContent();
          console.log(`  - ${text}`);
        }
      }
    }

    // Success or failure assessment
    if (isDashboard) {
      console.log('🎉 SUCCESS: User was redirected to dashboard!');
    } else if (hasSuccessText) {
      console.log('🎉 SUCCESS: Signup appears successful!');  
    } else {
      console.log('❌ FAILURE: Signup did not appear to complete successfully');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    await page.screenshot({ path: 'actual-signup-error.png', fullPage: true });
    console.log('📸 Error screenshot saved: actual-signup-error.png');
  }

  await browser.close();
  console.log('🏁 Actual signup test completed');
}

testActualSignup().catch(console.error);