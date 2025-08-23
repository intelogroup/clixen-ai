const { chromium } = require('playwright');

// Generate unique test user  
const testEmail = `testuser_${Date.now()}@example.com`;
const testPassword = 'TestPassword123!';

(async () => {
  console.log('🎯 SIMPLIFIED USER PAYMENT FLOW TEST');
  console.log('=' .repeat(50));
  console.log('Test User:', testEmail);
  console.log('Flow: Signup → Bot Access → Payment → Success');
  console.log('=' .repeat(50));
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 1500,
    args: ['--no-sandbox'] 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('🎯') || text.includes('✅') || text.includes('💰') || text.includes('🔐') || text.includes('📧')) {
      console.log('🌐', text);
    }
  });

  try {
    // STEP 1: SIGNUP
    console.log('\n🔥 STEP 1: USER SIGNUP');
    console.log('-'.repeat(30));
    
    await page.goto('http://localhost:3002');
    await page.waitForTimeout(3000);
    
    console.log('📝 Creating account...');
    await page.click('button:has-text("Get Started")');
    await page.waitForTimeout(2000);
    
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button:has-text("Create Account")');
    await page.waitForTimeout(5000);
    
    // Handle potential success modal
    try {
      const gotIt = await page.$('button:has-text("Got it")');
      if (gotIt) {
        await gotIt.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {}
    
    // Ensure signed in
    const currentUrl = page.url();
    if (!currentUrl.includes('/dashboard')) {
      console.log('🔐 Signing in...');
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(1000);
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', testPassword);
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(5000);
    }
    
    console.log('✅ User created and signed in');
    
    // STEP 2: BOT ACCESS TEST
    console.log('\n🔥 STEP 2: BOT ACCESS TEST');
    console.log('-'.repeat(30));
    
    await page.goto('http://localhost:3002/bot-access');
    await page.waitForTimeout(4000);
    
    const botUrl = page.url();
    console.log('Bot access URL:', botUrl);
    
    if (botUrl.includes('/subscription') || botUrl.includes('auth=true')) {
      console.log('✅ Bot access properly restricted - payment required');
    } else {
      console.log('ℹ️ Bot access behavior:', botUrl);
    }
    
    // STEP 3: PAYMENT PAGE
    console.log('\n🔥 STEP 3: STRIPE PAYMENT');
    console.log('-'.repeat(30));
    
    await page.goto('http://localhost:3002/subscription');
    await page.waitForTimeout(8000); // Wait for Stripe to fully load
    
    console.log('💳 Subscription page loaded');
    
    // Wait for and click Stripe Buy Button
    try {
      await page.waitForSelector('stripe-buy-button', { timeout: 15000 });
      console.log('✅ Stripe Buy Button found');
      
      // Get the Professional plan button
      const proButton = await page.$('stripe-buy-button[buy-button-id="buy_btn_1RzL6Z010OCMBFJxIB7eDVt3"]');
      if (proButton) {
        console.log('💰 Clicking Professional plan ($29)...');
        await proButton.click();
        await page.waitForTimeout(3000);
        
        console.log('📋 STRIPE CHECKOUT OPENED');
        console.log('=' .repeat(40));
        console.log('🎯 MANUAL PAYMENT STEPS:');
        console.log('1. Email:', testEmail);
        console.log('2. Card: 4242 4242 4242 4242');
        console.log('3. Expiry: 12/26 (any future date)');
        console.log('4. CVC: 123 (any 3 digits)');
        console.log('5. Name: Test User');
        console.log('6. Click "Subscribe" or "Pay"');
        console.log('=' .repeat(40));
        
        console.log('⏳ Waiting 60 seconds for payment completion...');
        console.log('(Complete the payment manually in the browser)');
        
        // Wait for payment to be completed manually
        await page.waitForTimeout(60000);
        
        // STEP 4: POST-PAYMENT TEST
        console.log('\n🔥 STEP 4: POST-PAYMENT BOT ACCESS');
        console.log('-'.repeat(30));
        
        // Return to main site
        await page.goto('http://localhost:3002');
        await page.waitForTimeout(2000);
        
        // Refresh session by signing in again
        console.log('🔄 Refreshing session...');
        await page.click('button:has-text("Sign In")');
        await page.waitForTimeout(1000);
        await page.fill('input[type="email"]', testEmail);
        await page.fill('input[type="password"]', testPassword);
        await page.click('button:has-text("Sign In")');
        await page.waitForTimeout(5000);
        
        // Test bot access again
        await page.goto('http://localhost:3002/bot-access');
        await page.waitForTimeout(5000);
        
        const postPaymentUrl = page.url();
        console.log('Post-payment bot access URL:', postPaymentUrl);
        
        if (postPaymentUrl.includes('/bot-access')) {
          const content = await page.textContent('body');
          if (content.includes('ClixenAIBot') || content.includes('telegram')) {
            console.log('✅ SUCCESS: Bot access granted after payment!');
          } else if (content.includes('subscription') || content.includes('upgrade')) {
            console.log('⚠️ Payment may still be processing...');
          } else {
            console.log('ℹ️ Bot access page loaded - check content manually');
          }
        } else {
          console.log('⚠️ Still redirecting - payment processing may take time');
        }
        
      } else {
        console.log('⚠️ Professional plan button not found');
      }
      
    } catch (error) {
      console.log('⚠️ Stripe button error:', error.message);
      console.log('💳 Try direct payment link: https://buy.stripe.com/test_cNi9AL0GZ1iB9Y37Fu4sE00');
    }
    
    // SUMMARY
    console.log('\n' + '='.repeat(50));
    console.log('🎯 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log('User:', testEmail);
    console.log('Password:', testPassword);
    console.log('Status: Ready for payment testing');
    console.log('\n💰 NEXT STEPS:');
    console.log('1. Complete Stripe payment manually');
    console.log('2. Wait for webhook processing');
    console.log('3. Test bot access again');
    console.log('\n🤖 Expected Result:');
    console.log('After payment, bot access should be granted');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    console.log('\n📍 Test complete. Browser stays open for manual testing.');
    console.log('Close when done.');
    
    // Keep browser open for manual interaction
    await page.waitForTimeout(120000); // 2 minutes
    await browser.close();
  }
})();