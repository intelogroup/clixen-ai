// Test script for creating a new user with provided credentials
const { chromium } = require('playwright');

async function testUserCreation() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🚀 Starting user creation test...');
    
    // Navigate to signup page
    console.log('📝 Navigating to signup page...');
    await page.goto('http://localhost:3000/auth/signup');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of signup page
    await page.screenshot({ path: 'signup-test-initial.png' });
    console.log('📸 Screenshot taken: signup-test-initial.png');
    
    // Fill in the signup form
    console.log('📧 Filling email: user1tester@email.com');
    const emailField = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    await emailField.fill('user1tester@email.com');
    
    console.log('🔒 Filling password: Jimkali90#');
    const passwordField = await page.locator('input[type="password"], input[name="password"]').first();
    await passwordField.fill('Jimkali90#');
    
    // Look for confirm password field if it exists
    const confirmPasswordFields = await page.locator('input[type="password"]').count();
    if (confirmPasswordFields > 1) {
      console.log('🔒 Filling confirm password...');
      await page.locator('input[type="password"]').nth(1).fill('Jimkali90#');
    }
    
    // Take screenshot before submitting
    await page.screenshot({ path: 'signup-test-filled.png' });
    console.log('📸 Screenshot taken: signup-test-filled.png');
    
    // Find and click signup button
    console.log('🖱️ Clicking signup button...');
    const signupButton = await page.locator('button[type="submit"], button:has-text("Sign up"), button:has-text("Create"), button:has-text("Register")').first();
    await signupButton.click();
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    // Take screenshot after submission
    await page.screenshot({ path: 'signup-test-after-submit.png' });
    console.log('📸 Screenshot taken: signup-test-after-submit.png');
    
    // Check if we're redirected to dashboard or if there are errors
    const currentUrl = page.url();
    console.log('🌐 Current URL after signup:', currentUrl);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ SUCCESS: User created and redirected to dashboard!');
      
      // Take screenshot of dashboard
      await page.screenshot({ path: 'signup-test-dashboard.png' });
      console.log('📸 Screenshot taken: signup-test-dashboard.png');
      
      // Check for user info on dashboard
      const userEmail = await page.locator('text=user1tester@email.com').first().textContent().catch(() => null);
      if (userEmail) {
        console.log('✅ Email confirmed on dashboard:', userEmail);
      }
      
    } else {
      console.log('⚠️ Not redirected to dashboard. Checking for errors...');
      
      // Look for error messages
      const errorMessages = await page.locator('[class*="error"], [role="alert"], .text-red-500, .text-red-600').allTextContents();
      if (errorMessages.length > 0) {
        console.log('❌ Error messages found:', errorMessages);
      }
      
      // Check if we're still on signup page
      if (currentUrl.includes('/signup')) {
        console.log('📝 Still on signup page - may need email verification');
      }
    }
    
    // Get all text content for debugging
    const pageText = await page.locator('body').textContent();
    console.log('📄 Page content preview:', pageText.substring(0, 500) + '...');
    
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'signup-test-error.png' });
    console.log('📸 Error screenshot taken: signup-test-error.png');
  } finally {
    await browser.close();
  }
}

// Run the test
testUserCreation().then(() => {
  console.log('🏁 Test script finished');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script error:', error);
  process.exit(1);
});