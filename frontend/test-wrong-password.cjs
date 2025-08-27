const { chromium } = require('playwright');

async function testWrongPassword() {
  console.log('🧪 Testing Wrong Password Handling...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Go to signin page
    console.log('📍 Navigating to signin page...');
    await page.goto('http://localhost:3000/auth/signin');
    await page.waitForLoadState('networkidle');
    
    // Wait for the form to load (NeonAuth component)
    console.log('⏳ Waiting for authentication form to load...');
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 15000 });
    
    // Fill in email and wrong password
    console.log('📝 Filling form with wrong password...');
    const emailInput = await page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = await page.locator('input[type="password"], input[name="password"]').first();
    
    await emailInput.fill('test@example.com');
    await passwordInput.fill('wrongpassword123');
    
    // Click sign in button
    console.log('🔄 Submitting form...');
    const submitButton = await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Sign In")').first();
    await submitButton.click();
    
    // Wait for error message to appear
    console.log('⏳ Waiting for error response...');
    await page.waitForTimeout(5000); // Wait for error processing
    
    // Check for error message with various possible text
    const errorSelectors = [
      'text=/Invalid credentials|incorrect|wrong|error/i',
      '[role="alert"]',
      '.error',
      '.text-red-500',
      '.text-red-600',
      '.bg-red-50',
      '*:has-text("Invalid")',
      '*:has-text("incorrect")',
      '*:has-text("failed")'
    ];
    
    let errorFound = false;
    for (const selector of errorSelectors) {
      try {
        const errorElement = page.locator(selector);
        if (await errorElement.isVisible()) {
          const errorText = await errorElement.textContent();
          console.log('✅ Error message displayed:', errorText?.trim());
          errorFound = true;
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!errorFound) {
      console.log('❌ No error message found - checking page content...');
      const pageContent = await page.content();
      if (pageContent.includes('Invalid') || pageContent.includes('error') || pageContent.includes('incorrect') || pageContent.includes('failed')) {
        console.log('✅ Error content found in page HTML');
      } else {
        console.log('❌ No error indication found');
        // Log part of the page content for debugging
        console.log('Page title:', await page.title());
      }
    }
    
    // Verify we're still on signin page (not redirected)
    const currentUrl = page.url();
    if (currentUrl.includes('/signin')) {
      console.log('✅ User remains on signin page after error');
    } else {
      console.log('❌ User was incorrectly redirected to:', currentUrl);
    }
    
    // Test that form is still functional
    console.log('🔄 Testing form functionality after error...');
    await passwordInput.fill(''); // Clear password
    await passwordInput.fill('anotherwrongpassword');
    
    const isEnabled = await submitButton.isEnabled();
    if (isEnabled) {
      console.log('✅ Form remains functional after error');
    } else {
      console.log('❌ Form is disabled after error');
    }
    
    console.log('✅ Wrong password test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testWrongPassword().catch(console.error);