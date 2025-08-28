const { chromium } = require('playwright');

async function testSignIn() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 Starting simple sign-in test...');
    
    // Navigate directly to sign-in page
    console.log('📍 Navigating to sign-in page...');
    await page.goto('http://localhost:3000/auth/signin', { 
      waitUntil: 'load',
      timeout: 30000 
    });
    
    console.log('✅ Successfully loaded sign-in page');
    
    // Wait for page to fully load
    await page.waitForTimeout(2000);
    
    // Take a screenshot to see what's on the page
    await page.screenshot({ path: 'signin-page.png' });
    console.log('📸 Screenshot saved as signin-page.png');
    
    // Get page title and URL
    const title = await page.title();
    const url = page.url();
    console.log('📄 Page title:', title);
    console.log('📍 Current URL:', url);
    
    // Look for NeonAuth Stack components
    const pageContent = await page.textContent('body');
    console.log('📄 Page contains "Sign" text:', pageContent.includes('Sign'));
    console.log('📄 Page contains "email" text:', pageContent.toLowerCase().includes('email'));
    
    // Check if this might be a redirect to Stack auth
    if (url.includes('stack')) {
      console.log('✅ Redirected to Stack authentication system');
      
      // Look for email input in Stack UI
      const emailInput = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email"]').first();
      const passwordInput = await page.locator('input[type="password"], input[name="password"]').first();
      
      if (await emailInput.isVisible()) {
        console.log('✅ Found email input field');
        await emailInput.fill('Tester13@email.com');
        
        if (await passwordInput.isVisible()) {
          console.log('✅ Found password input field');
          await passwordInput.fill('Jimkali90#235');
          
          // Look for submit button
          const submitButton = await page.locator('button[type="submit"], button:has-text("Sign"), input[type="submit"]').first();
          if (await submitButton.isVisible()) {
            console.log('✅ Found submit button, attempting sign-in...');
            await submitButton.click();
            
            // Wait for potential redirect
            await page.waitForTimeout(3000);
            
            const newUrl = page.url();
            console.log('📍 URL after sign-in attempt:', newUrl);
            
            if (newUrl.includes('/dashboard')) {
              console.log('🎉 SUCCESS: Redirected to dashboard!');
              await page.screenshot({ path: 'dashboard-success.png' });
            } else {
              console.log('⚠️ Not redirected to dashboard');
              await page.screenshot({ path: 'signin-result.png' });
              
              // Check for error messages
              const errorText = await page.textContent('body');
              if (errorText.toLowerCase().includes('error') || errorText.toLowerCase().includes('invalid')) {
                console.log('❌ Found error message on page');
              }
            }
          } else {
            console.log('❌ Could not find submit button');
            await page.screenshot({ path: 'no-submit-button.png' });
          }
        } else {
          console.log('❌ Could not find password input');
        }
      } else {
        console.log('❌ Could not find email input');
      }
    } else {
      console.log('⚠️ Not redirected to Stack auth, checking for direct form');
      
      // Look for any form inputs
      const inputs = await page.locator('input').count();
      console.log('🔍 Number of input fields found:', inputs);
      
      const buttons = await page.locator('button').count();
      console.log('🔍 Number of buttons found:', buttons);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    await page.screenshot({ path: 'test-error.png' });
  } finally {
    await browser.close();
  }
}

// Run the test
testSignIn().catch(console.error);