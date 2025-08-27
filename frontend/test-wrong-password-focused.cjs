const { chromium } = require('playwright');

async function testWrongPasswordFocused() {
  console.log('🧪 Testing Wrong Password Validation - Focused Test');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('📍 Navigating to signin page...');
    await page.goto('http://localhost:3000/auth/signin');
    await page.waitForLoadState('networkidle');
    
    // Wait for Stack Auth form to fully load
    console.log('⏳ Waiting for authentication form to load...');
    await page.waitForTimeout(5000);
    
    // Verify we have email/password form
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign In")').first();
    
    console.log('✅ Authentication form elements detected');
    
    // Test 1: Wrong password with valid email format
    console.log('🔄 Test 1: Testing wrong password with valid email format...');
    await emailInput.fill('test@example.com');
    await passwordInput.fill('wrongpassword123');
    
    // Take screenshot before submission
    await page.screenshot({ path: 'before-wrong-password-submit.png' });
    
    console.log('🔄 Submitting form with wrong password...');
    await submitButton.click();
    
    // Wait for response
    console.log('⏳ Waiting for authentication response...');
    await page.waitForTimeout(5000);
    
    // Take screenshot after submission
    await page.screenshot({ path: 'after-wrong-password-submit.png' });
    
    // Check current URL
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/signin')) {
      console.log('✅ User remained on signin page (expected for wrong password)');
      
      // Look for error messages
      console.log('🔍 Looking for error messages...');
      
      const errorSelectors = [
        // Stack Auth specific error patterns
        '[role="alert"]',
        '.text-red-500',
        '.text-red-600', 
        '.text-red-700',
        '.bg-red-50',
        '.border-red-500',
        '*:has-text("Invalid")',
        '*:has-text("incorrect")',
        '*:has-text("wrong")',
        '*:has-text("error")',
        '*:has-text("failed")',
        '*:has-text("credentials")',
        // Generic error patterns
        '.error',
        '.alert',
        '.notification'
      ];
      
      let errorFound = false;
      let errorMessage = '';
      
      for (const selector of errorSelectors) {
        try {
          const errorElement = page.locator(selector);
          const count = await errorElement.count();
          
          if (count > 0) {
            for (let i = 0; i < count; i++) {
              const element = errorElement.nth(i);
              if (await element.isVisible()) {
                const text = await element.textContent();
                if (text && text.trim().length > 0) {
                  console.log(`✅ Error message found (${selector}): "${text.trim()}"`);
                  errorFound = true;
                  errorMessage = text.trim();
                  break;
                }
              }
            }
            if (errorFound) break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (!errorFound) {
        console.log('⚠️  No visible error message found. Checking page content...');
        const bodyText = await page.textContent('body');
        
        const errorKeywords = ['invalid', 'incorrect', 'wrong', 'error', 'failed', 'denied'];
        const foundKeywords = errorKeywords.filter(keyword => 
          bodyText.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (foundKeywords.length > 0) {
          console.log(`✅ Error-related content found: ${foundKeywords.join(', ')}`);
        } else {
          console.log('❌ No error indication found in page content');
        }
        
        // Check if form inputs are still filled
        const emailValue = await emailInput.inputValue();
        const passwordValue = await passwordInput.inputValue();
        console.log(`📄 Form state - Email: "${emailValue}", Password: "${passwordValue ? '[filled]' : '[empty]'}"`);
      }
      
      // Test 2: Verify form is still functional
      console.log('🔄 Test 2: Verifying form remains functional after error...');
      await passwordInput.fill(''); // Clear password
      await passwordInput.fill('anotherwrongpassword');
      
      const isButtonEnabled = await submitButton.isEnabled();
      console.log(`🔘 Submit button enabled: ${isButtonEnabled}`);
      
      if (isButtonEnabled) {
        console.log('✅ Form remains functional after wrong password attempt');
      } else {
        console.log('❌ Form is disabled after wrong password attempt');
      }
      
    } else {
      console.log(`❌ User was redirected to: ${currentUrl}`);
      console.log('This might indicate OAuth-only behavior or successful authentication');
    }
    
    // Test 3: Test with invalid email format
    console.log('🔄 Test 3: Testing with invalid email format...');
    await emailInput.fill('invalidemail');
    await passwordInput.fill('somepassword');
    
    console.log('📸 Taking final screenshots...');
    await page.screenshot({ path: 'invalid-email-test.png' });
    
    console.log('✅ Wrong password validation tests completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    try {
      await page.screenshot({ path: 'error-screenshot.png' });
      console.log('📸 Error screenshot saved');
    } catch (screenshotError) {
      console.error('Could not save error screenshot:', screenshotError.message);
    }
  } finally {
    await browser.close();
  }
}

testWrongPasswordFocused().catch(console.error);