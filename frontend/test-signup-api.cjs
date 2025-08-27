const { chromium } = require('playwright');

async function testSignup() {
  console.log('🚀 Starting signup test with real NeonAuth...');
  
  const browser = await chromium.launch({ 
    headless: true,
    timeout: 60000 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate to signup page with longer timeout
    console.log('📝 Navigating to signup page...');
    await page.goto('http://localhost:3000/auth/signup', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    
    console.log('✅ Page loaded successfully');
    
    // Wait for any dynamic content
    await page.waitForTimeout(2000);
    
    // Take initial screenshot
    await page.screenshot({ path: 'signup-page-loaded.png' });
    console.log('📸 Screenshot: signup-page-loaded.png');
    
    // Look for email input with various selectors
    console.log('🔍 Looking for email input field...');
    const emailSelectors = [
      'input[name="email"]',
      'input[type="email"]',
      'input[placeholder*="email" i]',
      'input[id*="email" i]',
      '#email'
    ];
    
    let emailField = null;
    for (const selector of emailSelectors) {
      try {
        emailField = await page.waitForSelector(selector, { timeout: 5000 });
        if (emailField) {
          console.log(`✅ Found email field with selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`⚠️ Selector ${selector} not found`);
      }
    }
    
    if (!emailField) {
      console.log('❌ Could not find email input field');
      const pageContent = await page.content();
      console.log('Page HTML preview:', pageContent.substring(0, 1000));
      return;
    }
    
    // Fill email
    console.log('📧 Filling email: user1tester@email.com');
    await emailField.fill('user1tester@email.com');
    
    // Look for password input
    console.log('🔍 Looking for password input field...');
    const passwordField = await page.waitForSelector('input[type="password"]', { timeout: 5000 });
    console.log('✅ Found password field');
    
    console.log('🔒 Filling password: Jimkali90#');
    await passwordField.fill('Jimkali90#');
    
    // Check if there's a confirm password field
    const passwordFields = await page.locator('input[type="password"]').count();
    if (passwordFields > 1) {
      console.log('🔒 Found confirm password field, filling...');
      await page.locator('input[type="password"]').nth(1).fill('Jimkali90#');
    }
    
    // Take screenshot before submission
    await page.screenshot({ path: 'signup-form-filled.png' });
    console.log('📸 Screenshot: signup-form-filled.png');
    
    // Look for submit button
    console.log('🔍 Looking for submit button...');
    const submitButtonSelectors = [
      'button[type="submit"]',
      'button:has-text("Sign up")',
      'button:has-text("Sign Up")',
      'button:has-text("Create")',
      'button:has-text("Register")',
      'button:has-text("Continue")',
      'input[type="submit"]'
    ];
    
    let submitButton = null;
    for (const selector of submitButtonSelectors) {
      try {
        submitButton = await page.locator(selector).first();
        const count = await submitButton.count();
        if (count > 0) {
          console.log(`✅ Found submit button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`⚠️ Button selector ${selector} not found`);
      }
    }
    
    if (submitButton && await submitButton.count() > 0) {
      console.log('🖱️ Clicking submit button...');
      await submitButton.click();
      
      // Wait for navigation or response
      console.log('⏳ Waiting for response...');
      await page.waitForTimeout(5000);
      
      // Check current URL
      const currentUrl = page.url();
      console.log('🌐 Current URL:', currentUrl);
      
      // Take final screenshot
      await page.screenshot({ path: 'signup-result.png' });
      console.log('📸 Screenshot: signup-result.png');
      
      // Check for success or error messages
      const pageText = await page.locator('body').textContent();
      
      if (currentUrl.includes('/dashboard')) {
        console.log('✅ SUCCESS: User created and redirected to dashboard!');
      } else if (currentUrl.includes('/auth/signin')) {
        console.log('✅ SUCCESS: User created and redirected to signin!');
      } else if (pageText.includes('user1tester@email.com')) {
        console.log('✅ SUCCESS: User email appears on page');
      } else if (pageText.includes('already exists')) {
        console.log('⚠️ User already exists with this email');
      } else if (pageText.includes('error') || pageText.includes('Error')) {
        console.log('❌ Error occurred:', pageText.substring(0, 500));
      } else {
        console.log('ℹ️ Result unclear, check screenshots');
        console.log('Page content:', pageText.substring(0, 500));
      }
    } else {
      console.log('❌ Could not find submit button');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    await page.screenshot({ path: 'signup-error.png' });
    console.log('📸 Error screenshot: signup-error.png');
  } finally {
    await browser.close();
    console.log('🏁 Test completed');
  }
}

// Run the test
testSignup().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});