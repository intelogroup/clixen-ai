const { chromium } = require('playwright');

(async () => {
  console.log('Starting email/password signup test...');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate to signup page
    console.log('Navigating to signup page...');
    await page.goto('http://localhost:3001/auth/signup', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for the signup form to be visible
    console.log('Waiting for signup form...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Fill in the email field
    console.log('Filling email: Tester13@email.com');
    await page.fill('input[type="email"]', 'Tester13@email.com');
    
    // Fill in the password field
    console.log('Filling password...');
    await page.fill('input[type="password"]', 'Jimkali90#235');
    
    // Look for a submit button or continue button
    console.log('Looking for submit/continue button...');
    const submitButton = await page.locator('button[type="submit"], button:has-text("Continue"), button:has-text("Sign up"), button:has-text("Create account")').first();
    
    if (await submitButton.isVisible()) {
      console.log('Clicking submit button...');
      await submitButton.click();
      
      // Wait for navigation or response
      console.log('Waiting for response...');
      await page.waitForTimeout(5000);
      
      // Check current URL
      const currentUrl = page.url();
      console.log('Current URL after submission:', currentUrl);
      
      // Check for any error messages
      const errorElement = await page.locator('.error, .text-red-500, .text-red-600, [role="alert"]').first();
      if (await errorElement.isVisible()) {
        const errorText = await errorElement.textContent();
        console.log('Error message found:', errorText);
      }
      
      // Check if we're redirected to dashboard (success) or OAuth (Stack Auth flow)
      if (currentUrl.includes('dashboard')) {
        console.log('✅ Success! User created and logged in.');
      } else if (currentUrl.includes('github') || currentUrl.includes('oauth')) {
        console.log('ℹ️ Redirected to OAuth flow - Stack Auth is handling authentication');
      } else if (currentUrl.includes('signin')) {
        console.log('ℹ️ Redirected to signin - user might already exist or signup completed');
      }
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'signup-result.png' });
      console.log('Screenshot saved as signup-result.png');
      
    } else {
      console.log('❌ Could not find submit button');
    }
    
  } catch (error) {
    console.error('Error during signup:', error);
    await page.screenshot({ path: 'signup-error.png' });
    console.log('Error screenshot saved as signup-error.png');
  } finally {
    await browser.close();
    console.log('Test completed.');
  }
})();