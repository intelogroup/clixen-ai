#!/usr/bin/env node

/**
 * Test Authentication Flow for Clixen AI
 * Tests signup with testuser2@email.com and TestPassword123!
 */

const { chromium } = require('playwright');

async function testAuthFlow() {
  console.log('🔐 Testing Clixen AI Authentication Flow...\n');
  
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
    landingPageLoaded: false,
    signUpButtonFound: false,
    authModalOpened: false,
    signUpFormFilled: false,
    signUpAttempted: false,
    errors: [],
    screenshots: []
  };
  
  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      results.errors.push(`Console Error: ${msg.text()}`);
    }
  });
  
  page.on('pageerror', error => {
    results.errors.push(`Page Error: ${error.message}`);
  });
  
  try {
    console.log('1️⃣ Loading Clixen AI landing page...');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(3000);
    
    // Take screenshot of landing page
    const landingScreenshot = `landing-page-${Date.now()}.png`;
    await page.screenshot({ path: landingScreenshot });
    results.screenshots.push(landingScreenshot);
    console.log(`   📸 Screenshot saved: ${landingScreenshot}`);
    
    const title = await page.title();
    console.log(`   📄 Page title: ${title}`);
    
    if (title.includes('Clixen')) {
      results.landingPageLoaded = true;
      console.log('   ✅ Landing page loaded successfully');
    } else {
      results.errors.push('Landing page title incorrect');
      console.log('   ❌ Landing page title issue');
    }
    
    console.log('\n2️⃣ Looking for authentication buttons...');
    
    // Look for various auth button patterns
    const authSelectors = [
      'button:has-text("Sign Up")',
      'button:has-text("Sign In")',
      'button:has-text("Get Started")',
      'a:has-text("Sign Up")',
      'a:has-text("Sign In")',
      'a:has-text("Get Started")',
      '[class*="signup"]',
      '[class*="signin"]',
      '[data-testid="signup"]',
      '[data-testid="signin"]'
    ];
    
    let authButton = null;
    let authButtonText = '';
    
    for (const selector of authSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          authButton = element;
          authButtonText = await element.textContent();
          console.log(`   ✅ Found auth button: "${authButtonText}" with selector: ${selector}`);
          results.signUpButtonFound = true;
          break;
        }
      } catch (e) {
        // Continue looking
      }
    }
    
    if (!authButton) {
      console.log('   ❌ No auth button found. Looking for all buttons...');
      const allButtons = await page.locator('button, a[role="button"], .btn').all();
      console.log(`   🔍 Found ${allButtons.length} button-like elements:`);
      
      for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
        try {
          const text = await allButtons[i].textContent();
          console.log(`      ${i + 1}. "${text}"`);
        } catch (e) {
          console.log(`      ${i + 1}. [Unable to get text]`);
        }
      }
    }
    
    if (authButton) {
      console.log(`\\n3️⃣ Clicking "${authButtonText}" button...`);
      await authButton.click();
      await page.waitForTimeout(2000);
      
      // Take screenshot after clicking
      const modalScreenshot = `auth-modal-${Date.now()}.png`;
      await page.screenshot({ path: modalScreenshot });
      results.screenshots.push(modalScreenshot);
      console.log(`   📸 Screenshot saved: ${modalScreenshot}`);
      
      // Look for modal/form
      const modalSelectors = [
        '[role="dialog"]',
        '.modal',
        '.dialog',
        '[class*="modal"]',
        '[class*="dialog"]',
        'form[class*="auth"]',
        'form[class*="sign"]',
        '.auth-form',
        '.signup-form',
        '.signin-form'
      ];
      
      let modal = null;
      for (const selector of modalSelectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 1000 })) {
            modal = element;
            console.log(`   ✅ Found modal/form with selector: ${selector}`);
            results.authModalOpened = true;
            break;
          }
        } catch (e) {
          // Continue looking
        }
      }
      
      if (!modal) {
        console.log('   🔍 No modal found. Checking if we navigated to a new page...');
        const currentUrl = page.url();
        console.log(`   📍 Current URL: ${currentUrl}`);
        
        if (currentUrl.includes('auth') || currentUrl.includes('signup') || currentUrl.includes('signin')) {
          console.log('   ✅ Navigated to auth page');
          results.authModalOpened = true;
        }
      }
      
      if (results.authModalOpened || page.url() !== 'http://localhost:3000/') {
        console.log('\\n4️⃣ Looking for signup form fields...');
        
        // Look for email input
        const emailSelectors = [
          'input[type="email"]',
          'input[name="email"]',
          'input[placeholder*="email"]',
          'input[placeholder*="Email"]'
        ];
        
        let emailInput = null;
        for (const selector of emailSelectors) {
          try {
            const element = page.locator(selector).first();
            if (await element.isVisible({ timeout: 1000 })) {
              emailInput = element;
              console.log(`   ✅ Found email input: ${selector}`);
              break;
            }
          } catch (e) {
            // Continue
          }
        }
        
        // Look for password input
        const passwordSelectors = [
          'input[type="password"]',
          'input[name="password"]',
          'input[placeholder*="password"]',
          'input[placeholder*="Password"]'
        ];
        
        let passwordInput = null;
        for (const selector of passwordSelectors) {
          try {
            const element = page.locator(selector).first();
            if (await element.isVisible({ timeout: 1000 })) {
              passwordInput = element;
              console.log(`   ✅ Found password input: ${selector}`);
              break;
            }
          } catch (e) {
            // Continue
          }
        }
        
        if (emailInput && passwordInput) {
          console.log('\\n5️⃣ Filling out signup form...');
          
          await emailInput.fill('testuser2@email.com');
          console.log('   ✅ Email filled: testuser2@email.com');
          
          await passwordInput.fill('TestPassword123!');
          console.log('   ✅ Password filled: TestPassword123!');
          
          results.signUpFormFilled = true;
          
          // Take screenshot of filled form
          const formScreenshot = `signup-form-${Date.now()}.png`;
          await page.screenshot({ path: formScreenshot });
          results.screenshots.push(formScreenshot);
          console.log(`   📸 Screenshot saved: ${formScreenshot}`);
          
          console.log('\\n6️⃣ Looking for submit button...');
          
          const submitSelectors = [
            'button[type="submit"]',
            'button:has-text("Sign Up")',
            'button:has-text("Create Account")',
            'button:has-text("Register")',
            'input[type="submit"]'
          ];
          
          let submitButton = null;
          for (const selector of submitSelectors) {
            try {
              const element = page.locator(selector).first();
              if (await element.isVisible({ timeout: 1000 })) {
                submitButton = element;
                const text = await element.textContent();
                console.log(`   ✅ Found submit button: "${text}"`);
                break;
              }
            } catch (e) {
              // Continue
            }
          }
          
          if (submitButton) {
            console.log('\\n7️⃣ Attempting to submit signup form...');
            await submitButton.click();
            await page.waitForTimeout(3000);
            
            results.signUpAttempted = true;
            
            // Take final screenshot
            const finalScreenshot = `signup-result-${Date.now()}.png`;
            await page.screenshot({ path: finalScreenshot });
            results.screenshots.push(finalScreenshot);
            console.log(`   📸 Screenshot saved: ${finalScreenshot}`);
            
            const finalUrl = page.url();
            console.log(`   📍 Final URL: ${finalUrl}`);
            
            // Check for success or error messages
            const messageSelectors = [
              '.error',
              '.success',
              '.message',
              '[class*="error"]',
              '[class*="success"]',
              '[class*="message"]',
              '[role="alert"]'
            ];
            
            for (const selector of messageSelectors) {
              try {
                const element = page.locator(selector).first();
                if (await element.isVisible({ timeout: 1000 })) {
                  const text = await element.textContent();
                  console.log(`   💬 Message found: "${text}"`);
                }
              } catch (e) {
                // Continue
              }
            }
            
            if (finalUrl.includes('dashboard') || finalUrl.includes('profile') || finalUrl.includes('success')) {
              console.log('   ✅ Signup appears successful - redirected to user area');
            } else {
              console.log('   ℹ️  No immediate redirect - may need email verification');
            }
          } else {
            results.errors.push('Submit button not found');
            console.log('   ❌ Submit button not found');
          }
        } else {
          results.errors.push('Email or password input not found');
          console.log('   ❌ Could not find both email and password inputs');
          
          if (!emailInput) console.log('      - Email input missing');
          if (!passwordInput) console.log('      - Password input missing');
        }
      }
    } else {
      results.errors.push('No authentication button found');
      console.log('   ❌ No authentication button found');
    }
    
  } catch (error) {
    results.errors.push(`Test execution error: ${error.message}`);
    console.log(`\\n❌ Test execution error: ${error.message}`);
    
    // Take error screenshot
    const errorScreenshot = `error-${Date.now()}.png`;
    await page.screenshot({ path: errorScreenshot });
    results.screenshots.push(errorScreenshot);
  } finally {
    // Wait a moment before closing to see the result
    await page.waitForTimeout(5000);
    await browser.close();
  }
  
  // Print comprehensive results
  console.log('\\n' + '='.repeat(60));
  console.log('📊 AUTHENTICATION FLOW TEST RESULTS');
  console.log('='.repeat(60));
  
  console.log(`\\n✅ Landing Page Loaded: ${results.landingPageLoaded}`);
  console.log(`🔍 Auth Button Found: ${results.signUpButtonFound}`);
  console.log(`📱 Auth Modal/Form Opened: ${results.authModalOpened}`);
  console.log(`✏️  Form Filled: ${results.signUpFormFilled}`);
  console.log(`🚀 Signup Attempted: ${results.signUpAttempted}`);
  
  if (results.screenshots.length > 0) {
    console.log(`\\n📸 Screenshots taken: ${results.screenshots.length}`);
    results.screenshots.forEach((screenshot, i) => {
      console.log(`   ${i + 1}. ${screenshot}`);
    });
  }
  
  if (results.errors.length > 0) {
    console.log(`\\n❌ Errors encountered: ${results.errors.length}`);
    results.errors.forEach((error, i) => {
      console.log(`   ${i + 1}. ${error}`);
    });
  }
  
  const score = [
    results.landingPageLoaded,
    results.signUpButtonFound,
    results.authModalOpened,
    results.signUpFormFilled,
    results.signUpAttempted
  ].filter(Boolean).length;
  
  console.log(`\\n🎯 Overall Score: ${score}/5`);
  console.log(`🎯 Overall Result: ${score >= 4 ? 'GOOD' : score >= 2 ? 'PARTIAL' : 'NEEDS WORK'}`);
  
  return results;
}

testAuthFlow().catch(console.error);