#!/usr/bin/env node

const { chromium } = require('playwright');

async function testSpecificSignup() {
  console.log('🔐 Testing Clixen AI Signup with testuser2@email.com...\n');
  
  const browser = await chromium.launch({ 
    headless: true
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  const errors = [];
  const steps = [];
  
  // Listen for errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console Error: ${msg.text()}`);
    }
  });
  
  try {
    console.log('1️⃣ Loading page and opening Sign In modal...');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    
    // Click Sign In button
    await page.locator('button:has-text("Sign In")').first().click();
    await page.waitForTimeout(1000);
    steps.push('Opened Sign In modal');
    
    console.log('2️⃣ Switching to Sign Up form...');
    // Click "Sign up" link in the modal
    await page.locator('a:has-text("Sign up")').first().click();
    await page.waitForTimeout(1000);
    steps.push('Switched to Sign Up form');
    
    // Take screenshot of signup form
    const signupScreenshot = `signup-form-${Date.now()}.png`;
    await page.screenshot({ path: signupScreenshot });
    console.log(`   📸 Signup form screenshot: ${signupScreenshot}`);
    
    console.log('3️⃣ Filling out signup form...');
    
    // Fill email
    await page.locator('input[type="email"]').first().fill('testuser2@email.com');
    console.log('   ✅ Email: testuser2@email.com');
    steps.push('Filled email field');
    
    // Fill password
    await page.locator('input[type="password"]').first().fill('TestPassword123!');
    console.log('   ✅ Password: TestPassword123!');
    steps.push('Filled password field');
    
    // Take screenshot before submit
    const preSubmitScreenshot = `pre-submit-${Date.now()}.png`;
    await page.screenshot({ path: preSubmitScreenshot });
    console.log(`   📸 Pre-submit screenshot: ${preSubmitScreenshot}`);
    
    console.log('4️⃣ Submitting signup form...');
    
    // Click submit button
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);
    steps.push('Submitted signup form');
    
    // Wait for any redirect or response
    await page.waitForTimeout(2000);
    
    const finalUrl = page.url();
    console.log(`   📍 Final URL: ${finalUrl}`);
    
    // Take final screenshot
    const finalScreenshot = `signup-result-${Date.now()}.png`;
    await page.screenshot({ path: finalScreenshot });
    console.log(`   📸 Final result screenshot: ${finalScreenshot}`);
    
    // Look for success/error messages
    const possibleMessages = await page.locator('div, p, span').allTextContents();
    const relevantMessages = possibleMessages.filter(msg => 
      msg && (
        msg.includes('success') ||
        msg.includes('error') ||
        msg.includes('created') ||
        msg.includes('welcome') ||
        msg.includes('verification') ||
        msg.includes('email') ||
        msg.includes('dashboard') ||
        msg.includes('trial')
      )
    );
    
    if (relevantMessages.length > 0) {
      console.log('   📝 Relevant messages found:');
      relevantMessages.forEach(msg => console.log(`      "${msg}"`));
    }
    
    // Check if we're redirected to dashboard or other authenticated area
    if (finalUrl.includes('dashboard') || finalUrl.includes('profile') || finalUrl.includes('welcome')) {
      console.log('   ✅ SUCCESS: User appears to be signed up and redirected');
      steps.push('Successfully signed up and redirected');
    } else if (finalUrl === 'http://localhost:3000/') {
      console.log('   ℹ️  Still on landing page - may need email verification');
      steps.push('Signup submitted, staying on landing page');
    } else {
      console.log(`   📍 Redirected to: ${finalUrl}`);
      steps.push(`Redirected to ${finalUrl}`);
    }
    
  } catch (error) {
    errors.push(`Test error: ${error.message}`);
    console.log(`❌ Error: ${error.message}`);
    
    // Take error screenshot
    const errorScreenshot = `error-${Date.now()}.png`;
    await page.screenshot({ path: errorScreenshot });
    console.log(`📸 Error screenshot: ${errorScreenshot}`);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
  
  // Results
  console.log('\n' + '='.repeat(60));
  console.log('📊 SIGNUP TEST RESULTS');
  console.log('='.repeat(60));
  
  console.log('\n✅ Steps completed:');
  steps.forEach((step, i) => console.log(`   ${i + 1}. ${step}`));
  
  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach((error, i) => console.log(`   ${i + 1}. ${error}`));
  }
  
  console.log(`\n🎯 Result: ${errors.length === 0 ? 'SUCCESS' : 'PARTIAL'}`);
  
  return { steps, errors };
}

testSpecificSignup().catch(console.error);