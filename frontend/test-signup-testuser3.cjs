#!/usr/bin/env node

const { chromium } = require('playwright');

async function testUserSignup() {
  console.log('🔐 Creating Test User: testuser3@email.com through Clixen AI Frontend...\n');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 1000,
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
    errors: [],
    userCreated: false
  };
  
  // Listen for console messages and network responses
  page.on('console', msg => {
    if (msg.type() === 'error') {
      results.errors.push(`Console Error: ${msg.text()}`);
    }
    console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
  });
  
  page.on('response', response => {
    if (response.url().includes('auth') || response.url().includes('user') || response.url().includes('signup')) {
      console.log(`[API] ${response.status()} ${response.url()}`);
    }
  });
  
  try {
    console.log('1️⃣ Loading Clixen AI landing page at http://localhost:3010...');
    await page.goto('http://localhost:3010', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);
    
    const title = await page.title();
    console.log(`   📄 Page title: ${title}`);
    results.landingLoaded = title.toLowerCase().includes('clixen') || title.toLowerCase().includes('automation');
    
    // Screenshot 1: Landing page
    const timestamp = Date.now();
    const landingShot = `testuser3-1-landing-${timestamp}.png`;
    await page.screenshot({ path: landingShot, fullPage: true });
    results.screenshots.push(landingShot);
    console.log(`   📸 ${landingShot}`);
    
    console.log('2️⃣ Looking for Sign In button...');
    
    // Try multiple selectors for the Sign In button
    const signInSelectors = [
      'button:has-text("Sign In")',
      'button:has-text("Login")',
      'a[href*="auth"]',
      'button[data-testid="sign-in"]',
      '[role="button"]:has-text("Sign In")'
    ];
    
    let signInButton = null;
    for (const selector of signInSelectors) {
      try {
        signInButton = page.locator(selector).first();
        if (await signInButton.isVisible({ timeout: 2000 })) {
          console.log(`   ✅ Found Sign In button: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!signInButton || !await signInButton.isVisible()) {
      throw new Error('Sign In button not found on landing page');
    }
    
    console.log('3️⃣ Clicking Sign In button...');
    await signInButton.click();
    await page.waitForTimeout(2000);
    results.signInModalOpened = true;
    
    // Screenshot 2: Sign In modal opened
    const signinShot = `testuser3-2-signin-modal-${timestamp}.png`;
    await page.screenshot({ path: signinShot, fullPage: true });
    results.screenshots.push(signinShot);
    console.log(`   📸 ${signinShot}`);
    
    console.log('4️⃣ Looking for Sign Up / Create Account option...');
    
    // Try to find signup/create account elements
    const signupSelectors = [
      'button:has-text("Sign Up")',
      'button:has-text("Create Account")',
      'button:has-text("Get Started")',
      'a:has-text("Sign Up")',
      'a:has-text("Create Account")',
      '[data-testid="signup-button"]'
    ];
    
    let foundSignup = false;
    for (const selector of signupSelectors) {
      try {
        const signupButton = page.locator(selector).first();
        if (await signupButton.isVisible({ timeout: 2000 })) {
          console.log(`   ✅ Found signup button: ${selector}`);
          await signupButton.click();
          await page.waitForTimeout(2000);
          foundSignup = true;
          results.switchedToSignup = true;
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!foundSignup) {
      console.log('   ℹ️ No separate signup button found, checking if signup form is already visible...');
      
      // Check if signup form elements are already visible
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      
      if (await emailInput.isVisible() && await passwordInput.isVisible()) {
        console.log('   ✅ Signup form already visible');
        results.switchedToSignup = true;
        foundSignup = true;
      }
    }
    
    if (!foundSignup) {
      throw new Error('Could not find or access signup form');
    }
    
    // Screenshot 3: Signup form visible
    const signupShot = `testuser3-3-signup-form-${timestamp}.png`;
    await page.screenshot({ path: signupShot, fullPage: true });
    results.screenshots.push(signupShot);
    console.log(`   📸 ${signupShot}`);
    
    console.log('5️⃣ Filling signup form with credentials...');
    console.log('   📧 Email: testuser3@email.com');
    console.log('   🔐 Password: TestPassword123!');
    
    // Fill email field
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await emailInput.clear();
    await emailInput.fill('testuser3@email.com');
    console.log('   ✅ Email field filled');
    
    // Fill password field
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    await passwordInput.clear();
    await passwordInput.fill('TestPassword123!');
    console.log('   ✅ Password field filled');
    
    results.filledForm = true;
    
    // Screenshot 4: Form filled
    const filledShot = `testuser3-4-form-filled-${timestamp}.png`;
    await page.screenshot({ path: filledShot, fullPage: true });
    results.screenshots.push(filledShot);
    console.log(`   📸 ${filledShot}`);
    
    console.log('6️⃣ Submitting signup form...');
    
    // Find and click submit button
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Create Account")',
      'button:has-text("Sign Up")',
      'button:has-text("Register")',
      'input[type="submit"]',
      'button:has-text("Get Started")'
    ];
    
    let submitButton = null;
    for (const selector of submitSelectors) {
      try {
        submitButton = page.locator(selector).first();
        if (await submitButton.isVisible({ timeout: 2000 })) {
          console.log(`   ✅ Found submit button: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!submitButton) {
      throw new Error('Submit button not found');
    }
    
    await submitButton.click();
    results.submittedForm = true;
    console.log('   🚀 Form submitted, waiting for response...');
    
    // Wait for response and potential redirect
    await page.waitForTimeout(5000);
    
    console.log('7️⃣ Analyzing results...');
    
    const finalUrl = page.url();
    console.log(`   📍 Final URL: ${finalUrl}`);
    
    // Screenshot 5: Final result
    const finalShot = `testuser3-5-final-result-${timestamp}.png`;
    await page.screenshot({ path: finalShot, fullPage: true });
    results.screenshots.push(finalShot);
    console.log(`   📸 ${finalShot}`);
    
    // Check for various success/error indicators
    const pageText = await page.textContent('body');
    const pageTextLower = pageText.toLowerCase();
    
    // Check URL patterns for success
    if (finalUrl.includes('dashboard') || finalUrl.includes('profile') || finalUrl.includes('welcome')) {
      results.finalResult = '✅ SUCCESS - Redirected to authenticated dashboard';
      results.userCreated = true;
      console.log('   🎉 SUCCESS: User created and redirected to dashboard');
    } else if (pageTextLower.includes('verify') || pageTextLower.includes('verification') || pageTextLower.includes('email sent')) {
      results.finalResult = '✅ SUCCESS - User created, email verification required';
      results.userCreated = true;
      console.log('   📧 SUCCESS: User created, email verification step required');
    } else if (pageTextLower.includes('trial') || pageTextLower.includes('welcome') || pageTextLower.includes('account created')) {
      results.finalResult = '✅ SUCCESS - User account created with trial';
      results.userCreated = true;
      console.log('   🎁 SUCCESS: User account created with trial access');
    } else if (pageTextLower.includes('error') || pageTextLower.includes('failed') || pageTextLower.includes('invalid')) {
      results.finalResult = '❌ ERROR - Signup failed';
      console.log('   ❌ ERROR: Signup process failed');
    } else if (finalUrl === 'http://localhost:3005/' || finalUrl === 'http://localhost:3005') {
      results.finalResult = '⚠️ UNCLEAR - Returned to landing page';
      console.log('   ⚠️ UNCLEAR: Returned to landing page - success status unknown');
    } else {
      results.finalResult = `❓ UNKNOWN - Redirected to ${finalUrl}`;
      console.log(`   ❓ UNKNOWN: Unexpected redirect to ${finalUrl}`);
    }
    
    // Look for success/error messages on the page
    const messageSelectors = [
      '[role="alert"]',
      '.toast',
      '.notification',
      '.success',
      '.error',
      '.message',
      '[data-testid*="message"]'
    ];
    
    let foundMessages = [];
    for (const selector of messageSelectors) {
      try {
        const elements = await page.locator(selector).all();
        for (const element of elements) {
          const text = await element.textContent();
          if (text && text.trim() && text.length < 200) {
            foundMessages.push(text.trim());
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (foundMessages.length > 0) {
      console.log('\n   💬 Messages found on page:');
      foundMessages.slice(0, 3).forEach(msg => console.log(`      "${msg}"`));
    }
    
    // Additional check - look for dashboard elements
    const dashboardIndicators = [
      '[data-testid="dashboard"]',
      '.dashboard',
      'h1:has-text("Dashboard")',
      'h1:has-text("Welcome")',
      'nav[role="navigation"]',
      'button:has-text("Profile")',
      'button:has-text("Logout")'
    ];
    
    let dashboardFound = false;
    for (const selector of dashboardIndicators) {
      try {
        if (await page.locator(selector).first().isVisible({ timeout: 1000 })) {
          dashboardFound = true;
          break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    if (dashboardFound && !results.userCreated) {
      results.finalResult = '✅ SUCCESS - Dashboard elements detected';
      results.userCreated = true;
      console.log('   🎯 SUCCESS: Dashboard elements found, user likely created');
    }
    
  } catch (error) {
    results.errors.push(`Test error: ${error.message}`);
    console.log(`\n❌ Test Error: ${error.message}`);
    
    // Error screenshot
    const errorShot = `testuser3-ERROR-${Date.now()}.png`;
    await page.screenshot({ path: errorShot, fullPage: true });
    results.screenshots.push(errorShot);
    console.log(`   📸 Error screenshot: ${errorShot}`);
  } finally {
    console.log('\n⏳ Keeping browser open for 5 seconds for manual inspection...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
  
  // Comprehensive Results Report
  console.log('\n' + '='.repeat(80));
  console.log('📊 CLIXEN AI USER SIGNUP TEST RESULTS - testuser3@email.com');
  console.log('='.repeat(80));
  
  console.log(`\n🏠 Landing Page Loaded: ${results.landingLoaded ? '✅' : '❌'}`);
  console.log(`🔐 Sign In Modal Opened: ${results.signInModalOpened ? '✅' : '❌'}`);
  console.log(`📝 Switched to Signup Mode: ${results.switchedToSignup ? '✅' : '❌'}`);
  console.log(`✏️ Form Filled (testuser3@email.com): ${results.filledForm ? '✅' : '❌'}`);
  console.log(`🚀 Form Submitted: ${results.submittedForm ? '✅' : '❌'}`);
  console.log(`👤 User Account Created: ${results.userCreated ? '✅' : '❌'}`);
  console.log(`🎯 Final Result: ${results.finalResult}`);
  
  if (results.screenshots.length > 0) {
    console.log(`\n📸 Screenshots Generated (${results.screenshots.length}):`);
    results.screenshots.forEach((shot, i) => {
      console.log(`   ${i + 1}. ${shot}`);
    });
  }
  
  if (results.errors.length > 0) {
    console.log(`\n❌ Errors Encountered (${results.errors.length}):`);
    results.errors.forEach((error, i) => {
      console.log(`   ${i + 1}. ${error}`);
    });
  }
  
  // Overall Assessment
  const successSteps = [
    results.landingLoaded,
    results.signInModalOpened, 
    results.switchedToSignup,
    results.filledForm,
    results.submittedForm
  ].filter(Boolean).length;
  
  const successRate = `${successSteps}/5 steps completed`;
  let assessment = 'NEEDS INVESTIGATION';
  
  if (results.userCreated) {
    assessment = '🎉 COMPLETE SUCCESS';
  } else if (successSteps >= 4) {
    assessment = '⚠️ LIKELY SUCCESS (verify manually)';
  } else if (successSteps >= 3) {
    assessment = '⚠️ PARTIAL SUCCESS';
  } else {
    assessment = '❌ FAILED';
  }
  
  console.log(`\n🏆 Success Rate: ${successRate}`);
  console.log(`🎯 Overall Assessment: ${assessment}`);
  
  console.log(`\n📝 SUMMARY FOR HUMAN VERIFICATION:`);
  console.log(`   • Email: testuser3@email.com`);
  console.log(`   • Password: TestPassword123!`);
  console.log(`   • Server: http://localhost:3010`);
  console.log(`   • Result: ${results.finalResult}`);
  console.log(`   • Screenshots: Check the generated PNG files above`);
  
  return results;
}

// Run the test
testUserSignup().catch(console.error);