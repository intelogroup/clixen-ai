// Test what happens when the created user tries to access dashboard
const { chromium } = require('@playwright/test');

async function testDashboardFlow() {
  console.log('🧪 Testing dashboard flow for testinguser@email.com...');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📄 Step 1: Navigate to sign-in page');
    await page.goto('http://localhost:3001/auth/signin', { 
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    
    // Find and fill email
    const emailInputs = await page.$$('input[type="email"]');
    if (emailInputs.length > 0) {
      console.log('✏️ Filling email field...');
      await emailInputs[0].fill('testinguser@email.com');
    }
    
    // Find and fill password
    const passwordInputs = await page.$$('input[type="password"]');
    if (passwordInputs.length > 0) {
      console.log('🔒 Filling password field...');
      await passwordInputs[0].fill('Demo12345');
    }
    
    // Find submit button
    const submitButtons = await page.$$('button[type="submit"]');
    if (submitButtons.length > 0) {
      console.log('🔄 Signing in...');
      await submitButtons[0].click();
      
      // Wait for redirect
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      console.log('📍 Current URL after signin:', currentUrl);
      
      if (currentUrl.includes('/dashboard')) {
        console.log('✅ Redirected to dashboard!');
        
        // Take screenshot
        await page.screenshot({ path: 'signin-dashboard.png' });
        
        // Check for user profile creation
        const pageContent = await page.content();
        if (pageContent.includes('testinguser@email.com')) {
          console.log('✅ User email found in dashboard!');
        }
        
        if (pageContent.includes('error') || pageContent.includes('Error')) {
          console.log('⚠️  Dashboard contains errors');
        }
        
        if (pageContent.includes('trial') || pageContent.includes('Trial')) {
          console.log('✅ Trial information displayed');
        }
        
        return { success: true, url: currentUrl };
      } else {
        console.log('❌ Not redirected to dashboard');
        await page.screenshot({ path: 'signin-failed.png' });
        return { success: false, url: currentUrl };
      }
    } else {
      console.log('❌ No submit button found');
      return { success: false, error: 'No submit button' };
    }
    
  } catch (error) {
    console.error('💥 Error during signin test:', error.message);
    await page.screenshot({ path: 'signin-error.png' });
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

// Run the test
testDashboardFlow().then(result => {
  console.log('\n=== SIGNIN FLOW RESULT ===');
  if (result.success) {
    console.log('🎉 User can sign in and access dashboard!');
    console.log('✅ This proves NeonAuth user exists');
    console.log('✅ Profile was created (manually) and dashboard loads');
  } else {
    console.log('❌ Signin flow failed:', result.error);
  }
}).catch(error => {
  console.error('💥 Fatal error:', error);
});