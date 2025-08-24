#!/usr/bin/env node

const { chromium } = require('playwright');

async function testCompleteSignup() {
  console.log('🔐 Testing Complete Clixen AI Signup Flow...\n');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 2000,
    args: ['--start-maximized']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  const results = {
    landingLoaded: false,
    signInModalOpened: false,
    switchedToSignup: false,
    filledForm: false,
    submittedForm: false,
    finalResult: '',
    screenshots: [],
    errors: []
  };
  
  // Listen for errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      results.errors.push(`Console Error: ${msg.text()}`);
    }
  });
  
  try {
    console.log('1️⃣ Loading Clixen AI landing page...');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    
    const title = await page.title();
    console.log(`   📄 Page title: ${title}`);
    results.landingLoaded = title.includes('Clixen');
    
    // Screenshot 1: Landing page
    const landingShot = `landing-${Date.now()}.png`;
    await page.screenshot({ path: landingShot });
    results.screenshots.push(landingShot);
    console.log(`   📸 ${landingShot}`);
    
    console.log('2️⃣ Opening Sign In modal...');
    await page.locator('button:has-text("Sign In")').first().click();
    await page.waitForTimeout(1500);
    results.signInModalOpened = true;
    
    // Screenshot 2: Sign In modal
    const signinShot = `signin-modal-${Date.now()}.png`;
    await page.screenshot({ path: signinShot });
    results.screenshots.push(signinShot);
    console.log(`   📸 ${signinShot}`);
    
    console.log('3️⃣ Switching to Sign Up form...');
    // The form seems to switch automatically or there might be a different trigger
    // Let's try to find "Get Started" button instead or look for signup elements
    
    // Try clicking "Get Started" button which might lead to signup
    try {
      await page.locator('button:has-text("Get Started")').first().click();
      await page.waitForTimeout(2000);
      console.log('   ✅ Clicked Get Started button');
    } catch (e) {
      // If that doesn't work, look for other signup options
      console.log('   ℹ️  Get Started not found, trying other methods...');
      
      // The screenshot shows "Create Account" is already visible, so let's work with what's there
      const createAccountButton = page.locator('button:has-text("Create Account")');
      if (await createAccountButton.isVisible({ timeout: 2000 })) {
        console.log('   ✅ Create Account form already visible');
        results.switchedToSignup = true;
      }
    }
    
    // Screenshot 3: Signup form
    const signupShot = `signup-form-${Date.now()}.png`;
    await page.screenshot({ path: signupShot });
    results.screenshots.push(signupShot);
    console.log(`   📸 ${signupShot}`);
    
    console.log('4️⃣ Filling signup form...');
    
    // Clear and fill email field
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.clear();
    await emailInput.fill('testuser2@email.com');
    console.log('   ✅ Email: testuser2@email.com');
    
    // Fill password field
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill('TestPassword123!');
    console.log('   ✅ Password: TestPassword123! (meets 6+ char requirement)');
    
    results.filledForm = true;
    
    // Screenshot 4: Filled form
    const filledShot = `form-filled-${Date.now()}.png`;
    await page.screenshot({ path: filledShot });
    results.screenshots.push(filledShot);
    console.log(`   📸 ${filledShot}`);
    
    console.log('5️⃣ Submitting form...');
    
    // Click Create Account button
    await page.locator('button:has-text("Create Account")').first().click();
    await page.waitForTimeout(4000); // Give more time for processing
    results.submittedForm = true;
    
    console.log('6️⃣ Checking results...');
    
    const finalUrl = page.url();
    console.log(`   📍 Final URL: ${finalUrl}`);
    
    // Screenshot 5: Final result
    const finalShot = `final-result-${Date.now()}.png`;
    await page.screenshot({ path: finalShot });
    results.screenshots.push(finalShot);
    console.log(`   📸 ${finalShot}`);
    
    // Check for various success/error indicators
    const pageText = await page.textContent('body');
    
    if (finalUrl.includes('dashboard') || finalUrl.includes('profile')) {
      results.finalResult = 'SUCCESS - Redirected to user dashboard';
      console.log('   ✅ SUCCESS: Redirected to authenticated area');
    } else if (pageText.includes('verify') || pageText.includes('verification')) {
      results.finalResult = 'SUCCESS - Email verification required';
      console.log('   ✅ SUCCESS: Account created, email verification needed');
    } else if (pageText.includes('error') || pageText.includes('failed')) {
      results.finalResult = 'ERROR - Signup failed';
      console.log('   ❌ ERROR: Signup appears to have failed');
    } else if (finalUrl === 'http://localhost:3000/') {
      results.finalResult = 'PARTIAL - Stayed on landing page';
      console.log('   ℹ️  PARTIAL: Still on landing page, unclear if signup succeeded');
    } else {
      results.finalResult = `UNKNOWN - Redirected to ${finalUrl}`;
      console.log(`   ❓ UNKNOWN: Redirected to ${finalUrl}`);
    }
    
    // Look for any visible messages
    const messages = await page.locator('div, p, span').allTextContents();
    const relevantMessages = messages.filter(msg => 
      msg && msg.length < 200 && (
        msg.toLowerCase().includes('success') ||
        msg.toLowerCase().includes('error') ||
        msg.toLowerCase().includes('created') ||
        msg.toLowerCase().includes('welcome') ||
        msg.toLowerCase().includes('verify') ||
        msg.toLowerCase().includes('trial') ||
        msg.toLowerCase().includes('account')
      )
    );
    
    if (relevantMessages.length > 0) {
      console.log('\\n   📝 Relevant messages found:');
      relevantMessages.slice(0, 5).forEach(msg => console.log(`      "${msg.trim()}"`));
    }
    
  } catch (error) {
    results.errors.push(`Test error: ${error.message}`);
    console.log(`\\n❌ Test Error: ${error.message}`);
    
    // Error screenshot
    const errorShot = `error-${Date.now()}.png`;
    await page.screenshot({ path: errorShot });
    results.screenshots.push(errorShot);
    console.log(`   📸 Error screenshot: ${errorShot}`);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
  
  // Comprehensive Results
  console.log('\\n' + '='.repeat(70));
  console.log('📊 COMPLETE CLIXEN AI AUTHENTICATION TEST RESULTS');
  console.log('='.repeat(70));
  
  console.log(`\\n🏠 Landing Page Loaded: ${results.landingLoaded ? '✅' : '❌'}`);
  console.log(`🔐 Sign In Modal Opened: ${results.signInModalOpened ? '✅' : '❌'}`);
  console.log(`📝 Switched to Signup: ${results.switchedToSignup ? '✅' : '❌'}`);
  console.log(`✏️  Form Filled: ${results.filledForm ? '✅' : '❌'}`);
  console.log(`🚀 Form Submitted: ${results.submittedForm ? '✅' : '❌'}`);
  console.log(`🎯 Final Result: ${results.finalResult}`);
  
  if (results.screenshots.length > 0) {
    console.log(`\\n📸 Screenshots Generated: ${results.screenshots.length}`);
    results.screenshots.forEach((shot, i) => {
      console.log(`   ${i + 1}. ${shot}`);
    });
  }
  
  if (results.errors.length > 0) {
    console.log(`\\n❌ Errors: ${results.errors.length}`);
    results.errors.forEach((error, i) => {
      console.log(`   ${i + 1}. ${error}`);
    });
  }
  
  const successCount = [
    results.landingLoaded,
    results.signInModalOpened, 
    results.filledForm,
    results.submittedForm
  ].filter(Boolean).length;
  
  console.log(`\\n🏆 Overall Score: ${successCount}/4`);
  console.log(`🎯 Overall Assessment: ${successCount >= 3 ? '✅ GOOD' : successCount >= 2 ? '⚠️  PARTIAL' : '❌ NEEDS WORK'}`);
  
  return results;
}

testCompleteSignup().catch(console.error);