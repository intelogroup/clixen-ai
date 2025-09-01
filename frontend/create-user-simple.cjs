const { chromium } = require('@playwright/test');

async function createSimpleUser() {
  console.log('🚀 Creating new user (simple approach)...');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const timestamp = Date.now();
  const testEmail = `dashboarduser${timestamp}@example.com`;
  
  try {
    console.log(`👤 Creating: ${testEmail}`);
    
    // Navigate with longer timeout since server is slow
    await page.goto('http://localhost:3000/auth/signup', { 
      waitUntil: 'domcontentloaded',
      timeout: 45000 // Longer timeout
    });
    
    // Wait for form elements
    await page.waitForTimeout(5000);
    
    // Fill form quickly
    await page.fill('input[type="email"]', testEmail);
    
    const passwordInputs = await page.$$('input[type="password"]');
    await passwordInputs[0].fill('Dashboard123');
    await passwordInputs[1].fill('Dashboard123');
    
    console.log('✏️ Form filled, submitting...');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForTimeout(10000);
    
    const finalUrl = page.url();
    console.log('📍 Final URL:', finalUrl);
    
    if (finalUrl.includes('/dashboard')) {
      console.log('✅ SUCCESS: User created and redirected to dashboard');
      await page.screenshot({ path: `dashboard-success-${timestamp}.png` });
      return { success: true, email: testEmail, password: 'Dashboard123' };
    } else {
      console.log('❌ No dashboard redirect');
      await page.screenshot({ path: `no-dashboard-${timestamp}.png` });
      return { success: false, email: testEmail };
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    return { success: false, email: testEmail, error: error.message };
  } finally {
    await browser.close();
  }
}

createSimpleUser().then(result => {
  console.log('\n=== RESULT ===');
  if (result.success) {
    console.log('🎉 User created successfully!');
    console.log(`Email: ${result.email}`);
    console.log(`Password: ${result.password}`);
  } else {
    console.log('❌ User creation failed');
    console.log(`Email attempted: ${result.email}`);
    if (result.error) console.log(`Error: ${result.error}`);
  }
});