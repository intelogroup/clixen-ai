const { chromium } = require('playwright');

async function testSignInFinal() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 Starting final sign-in test...');
    
    // Navigate directly to sign-in page
    console.log('📍 Navigating to sign-in page...');
    await page.goto('http://localhost:3000/auth/signin', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('✅ Successfully loaded sign-in page');
    
    // Wait for the page to fully render
    await page.waitForTimeout(3000);
    
    // Take initial screenshot
    await page.screenshot({ path: 'signin-initial.png', fullPage: true });
    console.log('📸 Initial screenshot saved');
    
    // Find email input by multiple strategies
    console.log('🔍 Looking for email input...');
    let emailInput = null;
    
    // Try different selectors for email input
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]', 
      'input[placeholder*="email" i]',
      'input[data-testid*="email"]',
      'input:nth-of-type(1)'
    ];
    
    for (const selector of emailSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        emailInput = element;
        console.log(`✅ Found email input with selector: ${selector}`);
        break;
      }
    }
    
    if (!emailInput) {
      console.log('❌ Could not find email input, trying all inputs...');
      const allInputs = await page.locator('input').all();
      console.log(`Found ${allInputs.length} input elements total`);
      
      // Try the first input that's visible
      for (let i = 0; i < allInputs.length; i++) {
        if (await allInputs[i].isVisible()) {
          emailInput = allInputs[i];
          console.log(`✅ Using input ${i} as email field`);
          break;
        }
      }
    }
    
    if (emailInput) {
      console.log('📝 Filling email field...');
      await emailInput.fill('Tester13@email.com');
      console.log('✅ Email filled successfully');
    } else {
      console.log('❌ Could not find any suitable email input field');
      await page.screenshot({ path: 'no-email-input.png', fullPage: true });
      return;
    }
    
    // Find password input
    console.log('🔍 Looking for password input...');
    let passwordInput = null;
    
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[placeholder*="password" i]',
      'input[data-testid*="password"]'
    ];
    
    for (const selector of passwordSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        passwordInput = element;
        console.log(`✅ Found password input with selector: ${selector}`);
        break;
      }
    }
    
    if (!passwordInput) {
      // Try the second input as password
      const allInputs = await page.locator('input').all();
      if (allInputs.length >= 2) {
        passwordInput = allInputs[1];
        console.log('✅ Using second input as password field');
      }
    }
    
    if (passwordInput) {
      console.log('📝 Filling password field...');
      await passwordInput.fill('Jimkali90#235');
      console.log('✅ Password filled successfully');
    } else {
      console.log('❌ Could not find password input field');
      await page.screenshot({ path: 'no-password-input.png', fullPage: true });
      return;
    }
    
    // Wait a moment for any validation
    await page.waitForTimeout(1000);
    
    // Take screenshot after filling forms
    await page.screenshot({ path: 'form-filled.png', fullPage: true });
    
    // Find and click submit button
    console.log('🔍 Looking for submit button...');
    let submitButton = null;
    
    const buttonSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Sign in")',
      'button:has-text("Login")',
      'button:has-text("Submit")',
      'button[data-testid*="submit"]',
      'button[data-testid*="signin"]'
    ];
    
    for (const selector of buttonSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        submitButton = element;
        console.log(`✅ Found submit button with selector: ${selector}`);
        break;
      }
    }
    
    if (!submitButton) {
      // Try any button that looks like a submit button
      const allButtons = await page.locator('button').all();
      console.log(`Found ${allButtons.length} button elements`);
      
      for (let i = 0; i < allButtons.length; i++) {
        const buttonText = await allButtons[i].textContent();
        console.log(`Button ${i}: "${buttonText}"`);
        if (buttonText && (buttonText.toLowerCase().includes('sign') || buttonText.toLowerCase().includes('login'))) {
          submitButton = allButtons[i];
          console.log(`✅ Using button with text: "${buttonText}"`);
          break;
        }
      }
    }
    
    if (submitButton) {
      console.log('🚀 Clicking submit button...');
      await submitButton.click();
      
      // Wait for navigation or response
      console.log('⏳ Waiting for authentication response...');
      await page.waitForTimeout(5000);
      
      const currentUrl = page.url();
      console.log('📍 Current URL after sign-in:', currentUrl);
      
      // Take final screenshot
      await page.screenshot({ path: 'signin-final-result.png', fullPage: true });
      
      if (currentUrl.includes('/dashboard')) {
        console.log('🎉 SUCCESS: Successfully signed in and redirected to dashboard!');
        
        // Verify we can see user information
        const bodyText = await page.textContent('body');
        if (bodyText.includes('Welcome') || bodyText.includes('Dashboard') || bodyText.includes('Tester13')) {
          console.log('✅ Dashboard loaded with user information');
        }
        
      } else if (currentUrl !== 'http://localhost:3000/auth/signin') {
        console.log('✅ Redirected to different page:', currentUrl);
        
        // Check if it's an intermediate auth page
        const bodyText = await page.textContent('body');
        if (bodyText.toLowerCase().includes('loading') || bodyText.toLowerCase().includes('redirect')) {
          console.log('⏳ Appears to be loading/redirecting...');
          await page.waitForTimeout(3000);
          console.log('📍 Final URL:', page.url());
        }
        
      } else {
        console.log('⚠️ Still on sign-in page, checking for errors...');
        
        const bodyText = await page.textContent('body');
        if (bodyText.toLowerCase().includes('error') || bodyText.toLowerCase().includes('invalid')) {
          console.log('❌ Authentication failed - found error message');
        } else if (bodyText.toLowerCase().includes('success') || bodyText.toLowerCase().includes('welcome')) {
          console.log('✅ Found success indicators on page');
        } else {
          console.log('❓ Unclear result, may need to check form validation');
        }
      }
      
    } else {
      console.log('❌ Could not find submit button');
      await page.screenshot({ path: 'no-submit-button.png', fullPage: true });
    }
    
    console.log('🏁 Sign-in test completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    await page.screenshot({ path: 'signin-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

// Run the test
testSignInFinal().catch(console.error);