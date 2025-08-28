const { chromium } = require('@playwright/test');

async function createTestUserPort3000() {
  console.log('🚀 Testing NeonAuth user creation on PORT 3000...');
  
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
    console.log('📄 Navigating to signup page on port 3000...');
    await page.goto('http://localhost:3000/auth/signup', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    
    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(5000);
    
    // Take a screenshot
    await page.screenshot({ path: 'signup-port3000-loaded.png' });
    console.log('📸 Screenshot saved: signup-port3000-loaded.png');
    
    // Find email input
    const emailInputs = await page.$$('input[type="email"]');
    console.log(`✏️ Found ${emailInputs.length} email field(s)`);
    
    if (emailInputs.length === 0) {
      throw new Error('No email input found');
    }
    
    // Use a different email to test if port affects user creation
    const testEmail = 'port3000test@email.com';
    console.log(`📧 Using test email: ${testEmail}`);
    
    await emailInputs[0].fill(testEmail);
    
    // Find password inputs
    const passwordInputs = await page.$$('input[type="password"]');
    console.log(`🔒 Found ${passwordInputs.length} password field(s)`);
    
    if (passwordInputs.length < 2) {
      throw new Error('Need both password and confirmation fields');
    }
    
    await passwordInputs[0].fill('Demo12345');
    await passwordInputs[1].fill('Demo12345');
    
    await page.screenshot({ path: 'signup-port3000-filled.png' });
    console.log('📸 Form filled screenshot saved');
    
    // Submit
    const submitButtons = await page.$$('button[type="submit"]');
    if (submitButtons.length === 0) {
      throw new Error('No submit button found');
    }
    
    console.log('🔄 Submitting form...');
    await submitButtons[0].click();
    
    // Wait for redirect
    console.log('⏳ Waiting for redirect...');
    await page.waitForTimeout(10000); // Give more time for server actions
    
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Successfully redirected to dashboard!');
      await page.screenshot({ path: 'dashboard-port3000-success.png' });
      
      // Check page content
      const content = await page.content();
      if (content.includes(testEmail)) {
        console.log('✅ User email found in dashboard content!');
      }
      
      if (content.includes('trial') || content.includes('Trial')) {
        console.log('✅ Trial information displayed!');
      }
      
      if (content.includes('error') || content.includes('Error')) {
        console.log('⚠️  Dashboard shows errors');
      }
      
      return { 
        success: true, 
        email: testEmail,
        url: currentUrl,
        message: 'User created and dashboard loaded'
      };
    } else {
      console.log('❌ No redirect to dashboard');
      await page.screenshot({ path: 'signup-port3000-failed.png' });
      
      // Check for errors
      const errors = await page.$$eval(
        '[class*="error"], [role="alert"], .text-red-500',
        elements => elements.map(el => el.textContent)
      );
      
      return { 
        success: false, 
        error: errors.length > 0 ? errors.join(', ') : 'No redirect occurred',
        url: currentUrl
      };
    }
    
  } catch (error) {
    console.error('💥 Error during signup test:', error.message);
    await page.screenshot({ path: 'signup-port3000-error.png' });
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

// Run the test
createTestUserPort3000().then(result => {
  console.log('\n=== PORT 3000 TEST RESULT ===');
  if (result.success) {
    console.log('🎉 SUCCESS on port 3000!');
    console.log(`✅ User ${result.email} created successfully`);
    console.log('✅ This confirms NeonAuth needs port 3000');
    console.log('🔧 The original issue was the port conflict!');
  } else {
    console.log('❌ Still failed on port 3000:', result.error);
  }
}).catch(error => {
  console.error('💥 Fatal error:', error);
});