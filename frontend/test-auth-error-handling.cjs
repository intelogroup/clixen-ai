const { chromium } = require('@playwright/test');

async function testAuthErrorHandling() {
  console.log('🧪 Testing logout and signin error handling...');
  
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
    // Step 1: Sign in with correct credentials first
    console.log('📄 Step 1: Signing in with correct credentials...');
    await page.goto('http://localhost:3000/auth/signin', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    
    await page.waitForTimeout(3000);
    
    // Fill correct credentials
    const emailInputs = await page.$$('input[type="email"]');
    const passwordInputs = await page.$$('input[type="password"]');
    
    if (emailInputs.length > 0 && passwordInputs.length > 0) {
      await emailInputs[0].fill('port3000test@email.com');
      await passwordInputs[0].fill('Demo12345');
      
      const submitButtons = await page.$$('button[type="submit"]');
      if (submitButtons.length > 0) {
        console.log('🔄 Signing in with correct credentials...');
        await submitButtons[0].click();
        await page.waitForTimeout(5000);
        
        if (page.url().includes('/dashboard')) {
          console.log('✅ Successfully signed in to dashboard');
          await page.screenshot({ path: 'auth-test-dashboard.png' });
        }
      }
    }
    
    // Step 2: Logout
    console.log('\n📄 Step 2: Testing logout...');
    
    // Look for logout button/link
    const logoutSelectors = [
      'button:has-text("Logout")',
      'button:has-text("Log out")',
      'button:has-text("Sign out")',
      'a[href*="signout"]',
      'a[href*="logout"]',
      '[data-testid="logout"]',
      '.logout-button'
    ];
    
    let loggedOut = false;
    for (const selector of logoutSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        console.log(`🔄 Found logout button: ${selector}`);
        await page.click(selector);
        await page.waitForTimeout(3000);
        loggedOut = true;
        break;
      } catch (e) {
        // Continue trying other selectors
      }
    }
    
    if (!loggedOut) {
      // Try to navigate to a logout URL directly
      console.log('🔄 Trying direct logout URL...');
      await page.goto('http://localhost:3000/auth/signout', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
    }
    
    const afterLogoutUrl = page.url();
    console.log('📍 After logout URL:', afterLogoutUrl);
    
    if (afterLogoutUrl.includes('/auth/signin') || afterLogoutUrl.includes('/auth/signout')) {
      console.log('✅ Successfully logged out!');
      await page.screenshot({ path: 'auth-test-logout.png' });
    } else {
      console.log('⚠️  Logout might not have worked, current URL:', afterLogoutUrl);
    }
    
    // Step 3: Try to sign in with wrong password
    console.log('\n📄 Step 3: Testing signin with WRONG password...');
    
    // Navigate to signin page if not already there
    if (!page.url().includes('/auth/signin')) {
      await page.goto('http://localhost:3000/auth/signin', { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      });
      await page.waitForTimeout(3000);
    }
    
    await page.screenshot({ path: 'auth-test-signin-page.png' });
    
    // Fill email and WRONG password
    const signinEmailInputs = await page.$$('input[type="email"]');
    const signinPasswordInputs = await page.$$('input[type="password"]');
    
    if (signinEmailInputs.length > 0 && signinPasswordInputs.length > 0) {
      console.log('✏️ Filling signin form with wrong password...');
      await signinEmailInputs[0].fill('port3000test@email.com');
      await signinPasswordInputs[0].fill('WrongPassword123'); // Wrong password
      
      await page.screenshot({ path: 'auth-test-wrong-creds-filled.png' });
      
      const signinSubmitButtons = await page.$$('button[type="submit"]');
      if (signinSubmitButtons.length > 0) {
        console.log('🔄 Submitting with wrong password...');
        await signinSubmitButtons[0].click();
        
        // Wait for error response
        await page.waitForTimeout(5000);
        
        const afterWrongPasswordUrl = page.url();
        console.log('📍 After wrong password URL:', afterWrongPasswordUrl);
        
        await page.screenshot({ path: 'auth-test-wrong-password-result.png' });
        
        // Check for error messages
        const errorSelectors = [
          '[class*="error"]',
          '[role="alert"]', 
          '.text-red-500',
          '.text-red-600',
          '.text-red-700',
          '[data-testid="error-message"]',
          '.error-message'
        ];
        
        const errorMessages = [];
        for (const selector of errorSelectors) {
          try {
            const elements = await page.$$(selector);
            for (const element of elements) {
              const text = await element.textContent();
              if (text && text.trim().length > 0) {
                errorMessages.push(text.trim());
              }
            }
          } catch (e) {
            // Continue checking other selectors
          }
        }
        
        console.log('🚨 Found error messages:', errorMessages);
        
        // Check if still on signin page (good) vs redirected to dashboard (bad)
        if (afterWrongPasswordUrl.includes('/auth/signin')) {
          console.log('✅ Correctly stayed on signin page after wrong password');
        } else if (afterWrongPasswordUrl.includes('/dashboard')) {
          console.log('❌ Incorrectly redirected to dashboard with wrong password!');
        }
        
        return {
          success: true,
          loggedOut: afterLogoutUrl.includes('/auth/'),
          stayedOnSignin: afterWrongPasswordUrl.includes('/auth/signin'),
          errorMessages: errorMessages,
          wrongPasswordUrl: afterWrongPasswordUrl
        };
      }
    }
    
    throw new Error('Could not find signin form elements');
    
  } catch (error) {
    console.error('💥 Error during auth test:', error.message);
    await page.screenshot({ path: 'auth-test-error.png' });
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

// Run the test
testAuthErrorHandling().then(result => {
  console.log('\n=== AUTH ERROR HANDLING TEST RESULT ===');
  if (result.success) {
    console.log('🎉 Auth test completed!');
    
    if (result.loggedOut) {
      console.log('✅ Logout functionality works');
    } else {
      console.log('❌ Logout might have issues');
    }
    
    if (result.stayedOnSignin) {
      console.log('✅ App correctly handles wrong password (stays on signin)');
    } else {
      console.log('❌ App incorrectly handles wrong password');
    }
    
    if (result.errorMessages.length > 0) {
      console.log('✅ Error messages displayed:', result.errorMessages);
    } else {
      console.log('⚠️  No error messages found - user might not know why login failed');
    }
    
  } else {
    console.log('❌ Auth test failed:', result.error);
  }
}).catch(error => {
  console.error('💥 Fatal error:', error);
});