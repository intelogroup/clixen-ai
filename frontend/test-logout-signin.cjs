const { chromium } = require('playwright');

async function testLogoutAndSignIn() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 Starting logout and sign-in test...');
    
    // Navigate to dashboard first (simulating logged-in state)
    console.log('📍 Navigating to localhost:3000/dashboard...');
    await page.goto('http://localhost:3000/dashboard', { 
      waitUntil: 'domcontentloaded',
      timeout: 120000 
    });
    
    // Wait a bit for page to fully load
    await page.waitForTimeout(3000);
    
    // Look for logout button - try multiple selectors
    console.log('🔍 Looking for logout button...');
    
    // Try to find logout button by text content
    let logoutButton = await page.locator('text=Sign out').first();
    if (!(await logoutButton.isVisible())) {
      logoutButton = await page.locator('text=Logout').first();
    }
    if (!(await logoutButton.isVisible())) {
      logoutButton = await page.locator('text=Log out').first();
    }
    if (!(await logoutButton.isVisible())) {
      logoutButton = await page.locator('button:has-text("Sign out")').first();
    }
    if (!(await logoutButton.isVisible())) {
      logoutButton = await page.locator('[data-testid="logout"]').first();
    }
    
    if (await logoutButton.isVisible()) {
      console.log('✅ Found logout button, clicking...');
      await logoutButton.click();
      await page.waitForTimeout(2000);
    } else {
      console.log('⚠️ Logout button not found, proceeding to sign-in page directly...');
    }
    
    // Navigate to sign-in page
    console.log('📍 Navigating to sign-in page...');
    await page.goto('http://localhost:3000/auth/signin', { 
      waitUntil: 'domcontentloaded',
      timeout: 120000 
    });
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    console.log('🔍 Looking for email input field...');
    
    // Look for email input field with multiple selectors
    let emailInput = await page.locator('input[type="email"]').first();
    if (!(await emailInput.isVisible())) {
      emailInput = await page.locator('input[name="email"]').first();
    }
    if (!(await emailInput.isVisible())) {
      emailInput = await page.locator('input[placeholder*="email" i]').first();
    }
    if (!(await emailInput.isVisible())) {
      emailInput = await page.locator('input').filter({ hasText: /email/i }).first();
    }
    
    if (await emailInput.isVisible()) {
      console.log('✅ Found email input, filling with Tester13@email.com...');
      await emailInput.fill('Tester13@email.com');
    } else {
      console.log('❌ Could not find email input field');
      await page.screenshot({ path: 'signin-page-debug.png' });
      return;
    }
    
    // Look for password input field
    console.log('🔍 Looking for password input field...');
    let passwordInput = await page.locator('input[type="password"]').first();
    if (!(await passwordInput.isVisible())) {
      passwordInput = await page.locator('input[name="password"]').first();
    }
    if (!(await passwordInput.isVisible())) {
      passwordInput = await page.locator('input[placeholder*="password" i]').first();
    }
    
    if (await passwordInput.isVisible()) {
      console.log('✅ Found password input, filling with password...');
      await passwordInput.fill('Jimkali90#235');
    } else {
      console.log('❌ Could not find password input field');
      await page.screenshot({ path: 'signin-page-debug.png' });
      return;
    }
    
    // Look for submit button
    console.log('🔍 Looking for sign-in submit button...');
    let submitButton = await page.locator('button[type="submit"]').first();
    if (!(await submitButton.isVisible())) {
      submitButton = await page.locator('text=Sign in').first();
    }
    if (!(await submitButton.isVisible())) {
      submitButton = await page.locator('text=Sign In').first();
    }
    if (!(await submitButton.isVisible())) {
      submitButton = await page.locator('text=Login').first();
    }
    if (!(await submitButton.isVisible())) {
      submitButton = await page.locator('button:has-text("Sign")').first();
    }
    
    if (await submitButton.isVisible()) {
      console.log('✅ Found submit button, clicking...');
      await submitButton.click();
      
      // Wait for navigation or loading
      console.log('⏳ Waiting for authentication...');
      await page.waitForTimeout(5000);
      
      // Check if we're redirected to dashboard
      const currentUrl = page.url();
      console.log('📍 Current URL after sign-in:', currentUrl);
      
      if (currentUrl.includes('/dashboard')) {
        console.log('✅ Successfully signed in and redirected to dashboard!');
        
        // Take a screenshot of success
        await page.screenshot({ path: 'successful-signin.png' });
        
        // Look for user welcome message
        const welcomeText = await page.textContent('body');
        if (welcomeText && welcomeText.includes('Welcome')) {
          console.log('✅ Found welcome message in dashboard');
        }
        
      } else {
        console.log('⚠️ Not redirected to dashboard. Current URL:', currentUrl);
        
        // Check for error messages
        const pageContent = await page.textContent('body');
        console.log('📄 Page content snippet:', pageContent.substring(0, 500));
        
        await page.screenshot({ path: 'signin-result.png' });
      }
      
    } else {
      console.log('❌ Could not find submit button');
      await page.screenshot({ path: 'signin-form-debug.png' });
    }
    
    console.log('🏁 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    await page.screenshot({ path: 'test-error.png' });
  } finally {
    await browser.close();
  }
}

// Run the test
testLogoutAndSignIn().catch(console.error);