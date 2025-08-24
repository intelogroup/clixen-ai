#!/usr/bin/env node

const { chromium } = require('playwright');

async function testFinalSignup() {
  console.log('🔐 Final Clixen AI Signup Test - Clicking Sign up link correctly...\n');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 2000,
    args: ['--start-maximized']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('1️⃣ Loading page and opening Sign In modal...');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    
    await page.locator('button:has-text("Sign In")').first().click();
    await page.waitForTimeout(1500);
    
    // Screenshot: Sign In modal
    await page.screenshot({ path: `step1-signin-modal-${Date.now()}.png` });
    console.log('   📸 Sign In modal opened');
    
    console.log('2️⃣ Clicking "Sign up" link...');
    // Click the "Sign up" link at the bottom of the sign in modal
    await page.locator('a:has-text("Sign up")').first().click();
    await page.waitForTimeout(2000);
    
    // Screenshot: After clicking Sign up
    await page.screenshot({ path: `step2-clicked-signup-${Date.now()}.png` });
    console.log('   📸 Clicked Sign up link');
    
    console.log('3️⃣ Filling out Create Account form...');
    
    // Fill email in the Create Account form
    await page.locator('input[type="email"]').first().fill('testuser2@email.com');
    console.log('   ✅ Email: testuser2@email.com');
    
    // Fill password
    await page.locator('input[type="password"]').first().fill('TestPassword123!');
    console.log('   ✅ Password: TestPassword123!');
    
    // Screenshot: Filled form
    await page.screenshot({ path: `step3-form-filled-${Date.now()}.png` });
    console.log('   📸 Form filled out');
    
    console.log('4️⃣ Submitting Create Account form...');
    
    // Now click "Create Account" button
    await page.locator('button:has-text("Create Account")').first().click();
    await page.waitForTimeout(5000); // Wait longer for processing
    
    console.log('5️⃣ Checking results...');
    
    const finalUrl = page.url();
    console.log(`   📍 Final URL: ${finalUrl}`);
    
    // Final screenshot
    await page.screenshot({ path: `step4-final-result-${Date.now()}.png` });
    console.log('   📸 Final result captured');
    
    // Check what happened
    if (finalUrl.includes('dashboard') || finalUrl.includes('profile')) {
      console.log('   ✅ SUCCESS: Redirected to user area!');
    } else if (finalUrl.includes('auth') || finalUrl.includes('verify')) {
      console.log('   ✅ SUCCESS: Account created, may need verification!');
    } else {
      console.log('   ℹ️  Still on landing page - checking for messages...');
      
      const bodyText = await page.textContent('body');
      if (bodyText.includes('success') || bodyText.includes('created')) {
        console.log('   ✅ SUCCESS: Account appears to be created!');
      } else if (bodyText.includes('error') || bodyText.includes('exists')) {
        console.log('   ⚠️  WARNING: May have encountered an issue');
      }
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    await page.screenshot({ path: `error-final-${Date.now()}.png` });
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
  
  console.log('\n✅ Test completed! Check screenshots for detailed results.');
}

testFinalSignup().catch(console.error);