const { chromium } = require('playwright');

async function testAuthCurrentState() {
  console.log('🧪 Testing Current Authentication State...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('📍 Navigating to signin page...');
    await page.goto('http://localhost:3000/auth/signin');
    
    // Wait for network to settle
    console.log('⏳ Waiting for page to fully load...');
    await page.waitForLoadState('networkidle');
    
    // Wait extra time for Stack Auth component to render
    await page.waitForTimeout(5000);
    
    console.log('🔍 Analyzing loaded authentication form...');
    
    // Take a screenshot first
    await page.screenshot({ path: 'auth-loaded-state.png', fullPage: true });
    console.log('📸 Screenshot saved as auth-loaded-state.png');
    
    // Check what's actually rendered
    const bodyText = await page.textContent('body');
    console.log('📄 Page contains following text snippets:');
    
    // Look for specific authentication indicators
    if (bodyText.includes('Email') || bodyText.includes('email')) {
      console.log('  📧 Email text found');
    }
    if (bodyText.includes('Password') || bodyText.includes('password')) {
      console.log('  🔐 Password text found');
    }
    if (bodyText.includes('Google')) {
      console.log('  🔵 Google text found');
    }
    if (bodyText.includes('GitHub')) {
      console.log('  ⚫ GitHub text found');
    }
    if (bodyText.includes('Sign in') || bodyText.includes('Sign In')) {
      console.log('  ✏️  Sign in text found');
    }
    
    // Look for actual form elements
    console.log('🔍 Looking for form elements...');
    
    // Email input
    const emailInputs = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').count();
    console.log(`  📧 Email inputs found: ${emailInputs}`);
    
    // Password input
    const passwordInputs = await page.locator('input[type="password"], input[name="password"], input[placeholder*="password" i]').count();
    console.log(`  🔐 Password inputs found: ${passwordInputs}`);
    
    // Buttons
    const buttons = await page.locator('button, input[type="submit"]').count();
    console.log(`  🔘 Buttons found: ${buttons}`);
    
    // Get button texts
    const buttonElements = await page.locator('button, input[type="submit"]').all();
    for (let i = 0; i < buttonElements.length; i++) {
      const buttonText = await buttonElements[i].textContent();
      console.log(`  🔘 Button ${i + 1}: "${buttonText?.trim()}"`);
    }
    
    // Links
    const links = await page.locator('a').count();
    console.log(`  🔗 Links found: ${links}`);
    
    // Get link texts that might be OAuth buttons
    const linkElements = await page.locator('a').all();
    for (let i = 0; i < linkElements.length; i++) {
      const linkText = await linkElements[i].textContent();
      const href = await linkElements[i].getAttribute('href');
      if (linkText && (linkText.includes('Google') || linkText.includes('GitHub') || linkText.includes('Sign'))) {
        console.log(`  🔗 Auth Link: "${linkText.trim()}" → ${href}`);
      }
    }
    
    // Check for any error messages or loading states
    const loadingElements = await page.locator('.animate-pulse, [class*="loading"], [class*="spinner"]').count();
    console.log(`  ⏳ Loading elements found: ${loadingElements}`);
    
    // Look for Stack Auth specific elements
    const stackElements = await page.locator('[class*="stack"], [data-stack]').count();
    console.log(`  📚 Stack-related elements: ${stackElements}`);
    
    console.log('✅ Current authentication state analysis complete');
    
    // Test if we can interact with authentication elements
    if (emailInputs > 0 && passwordInputs > 0) {
      console.log('🔄 Testing email/password form...');
      
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      
      await emailInput.fill('test@example.com');
      await passwordInput.fill('wrongpassword123');
      
      // Look for submit button
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign"), input[type="submit"]').first();
      if (await submitButton.isVisible()) {
        console.log('🔘 Found submit button, testing wrong password...');
        await submitButton.click();
        
        await page.waitForTimeout(3000);
        
        // Check for error messages
        const pageContent = await page.textContent('body');
        if (pageContent.includes('Invalid') || pageContent.includes('incorrect') || pageContent.includes('error')) {
          console.log('✅ Wrong password error handling detected');
        } else {
          console.log('❌ No obvious error handling found');
        }
      }
    } else {
      console.log('❌ No email/password form found - authentication may be OAuth-only');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testAuthCurrentState().catch(console.error);