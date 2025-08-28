const { chromium } = require('@playwright/test');

async function createTestUser() {
  console.log('🚀 Starting NeonAuth user creation test...');
  
  // Launch browser in headless mode
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📄 Navigating to signup page...');
    await page.goto('http://localhost:3001/auth/signup', { 
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('⏳ Waiting for page to fully load...');
    
    // Wait for the page content to be loaded - give it more time
    await page.waitForTimeout(5000);
    
    // Take a screenshot to see what's loaded
    await page.screenshot({ path: 'signup-page-loaded.png' });
    console.log('📸 Screenshot saved: signup-page-loaded.png');
    
    // Wait for any element that might indicate the page is ready
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Try different selectors for NeonAuth components
    const possibleSelectors = [
      'input[type="email"]',
      'input[name="email"]', 
      'input[placeholder*="email" i]',
      'input[placeholder*="Email" i]',
      '[data-testid="email-input"]',
      '.email-input'
    ];
    
    let emailInput = null;
    for (const selector of possibleSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        emailInput = selector;
        break;
      } catch (e) {
        console.log(`❌ Email selector ${selector} not found`);
      }
    }
    
    if (!emailInput) {
      // Try clicking any visible buttons or links first to load the form
      const pageContent = await page.content();
      console.log('📄 Page content length:', pageContent.length);
      
      // Look for any buttons that might load the signup form
      try {
        await page.click('text=Sign up', { timeout: 2000 });
        await page.waitForTimeout(2000);
      } catch (e) {}
      
      // Try again to find email input
      for (const selector of possibleSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 3000 });
          emailInput = selector;
          break;
        } catch (e) {}
      }
    }
    
    if (!emailInput) {
      throw new Error('Could not find email input field on the page');
    }
    
    console.log('✏️ Found email field with selector:', emailInput);
    await page.fill(emailInput, 'testinguser@email.com');
    
    // Try to find password input fields (there might be two: password and confirm password)
    const passwordInputs = await page.$$('input[type="password"]');
    console.log(`🔒 Found ${passwordInputs.length} password field(s)`);
    
    if (passwordInputs.length === 0) {
      throw new Error('Could not find any password input fields on the page');
    }
    
    // Fill the first password field
    console.log('🔒 Filling first password field...');
    await passwordInputs[0].fill('Demo12345');
    
    // If there's a second password field (confirmation), fill it too
    if (passwordInputs.length > 1) {
      console.log('🔒 Filling password confirmation field...');
      await passwordInputs[1].fill('Demo12345');
    }
    
    // Take a screenshot before submitting
    await page.screenshot({ path: 'signup-form-filled.png' });
    console.log('📸 Screenshot saved: signup-form-filled.png');
    
    // Find and click submit button
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Sign up")',
      'button:has-text("Create")',
      'button:has-text("Register")',
      '[data-testid="submit-button"]'
    ];
    
    let submitButton = null;
    for (const selector of submitSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        submitButton = selector;
        break;
      } catch (e) {}
    }
    
    if (!submitButton) {
      throw new Error('Could not find submit button on the page');
    }
    
    console.log('🔄 Found submit button with selector:', submitButton);
    await page.click(submitButton);
    
    // Wait for either dashboard redirect or error
    try {
      // Wait for successful redirect to dashboard
      await page.waitForURL('**/dashboard', { timeout: 15000 });
      console.log('✅ Successfully redirected to dashboard!');
      
      // Take a screenshot of the dashboard
      await page.screenshot({ path: 'dashboard-loaded.png' });
      console.log('📸 Screenshot saved: dashboard-loaded.png');
      
      // Check for welcome message or user info
      const welcomeText = await page.textContent('body');
      if (welcomeText.includes('testinguser@email.com') || welcomeText.includes('Welcome')) {
        console.log('🎉 User signup successful! User is logged in to dashboard.');
        return { success: true, message: 'User created and logged in successfully' };
      }
      
    } catch (redirectError) {
      console.log('❌ No redirect to dashboard, checking for errors...');
      
      // Take a screenshot to see current state
      await page.screenshot({ path: 'signup-error-state.png' });
      console.log('📸 Screenshot saved: signup-error-state.png');
      
      // Check for error messages
      const errorElements = await page.$$eval(
        '[class*="error"], [role="alert"], .text-red-500, .text-red-600, .text-red-700',
        elements => elements.map(el => el.textContent)
      );
      
      if (errorElements.length > 0) {
        console.log('❌ Signup errors found:', errorElements);
        return { success: false, error: errorElements.join(', ') };
      }
      
      // Check current URL for clues
      const currentUrl = page.url();
      console.log('📍 Current URL:', currentUrl);
      
      return { success: false, error: `Signup did not complete. Current URL: ${currentUrl}` };
    }
    
  } catch (error) {
    console.error('💥 Error during signup test:', error.message);
    
    // Take a screenshot of the error state
    await page.screenshot({ path: 'signup-test-error.png' });
    console.log('📸 Error screenshot saved: signup-test-error.png');
    
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

// Run the test
createTestUser().then(result => {
  console.log('\n=== TEST RESULT ===');
  console.log(result);
  process.exit(result.success ? 0 : 1);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});