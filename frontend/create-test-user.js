// Create test user and verify signup flow
import { chromium } from 'playwright';
import { setTimeout } from 'timers/promises';

const BASE_URL = 'http://localhost:3001';

// Generate unique test user data
const testUser = {
  email: `testuser.${Date.now()}@clixen-test.com`,
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User'
};

async function createTestUser() {
  console.log('🧪 Creating Test User and Verifying Signup Flow...\n');
  console.log(`📧 Test User Email: ${testUser.email}\n`);
  
  let browser, page;
  
  try {
    // Launch browser
    console.log('🌐 Launching browser...');
    browser = await chromium.launch({ 
      headless: true, // Running in headless mode for server environment
      slowMo: 500 // Slow down actions slightly
    });
    
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    page = await context.newPage();
    
    // Enable console logging
    page.on('console', msg => console.log(`🖥️  Browser: ${msg.text()}`));
    page.on('pageerror', err => console.log(`❌ Page Error: ${err.message}`));
    
    // Step 1: Navigate to landing page
    console.log('1️⃣ Navigating to landing page...');
    await page.goto(BASE_URL, { 
      waitUntil: 'domcontentloaded', // Less strict than networkidle
      timeout: 120000 // 2 minutes timeout
    });
    await page.waitForLoadState('domcontentloaded');
    console.log('   ✅ Landing page loaded');
    
    // Step 2: Navigate to signup page
    console.log('\\n2️⃣ Navigating to signup page...');
    
    // Try multiple selectors for the Get Started button
    const getStartedSelectors = [
      'a[href="/auth/signup"]:has-text("Get Started")',
      'text=Get Started',
      'button:has-text("Start Free Trial")',
      'a[href="/auth/signup"]'
    ];
    
    let clicked = false;
    for (const selector of getStartedSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          await element.click();
          console.log(`   ✅ Clicked: ${selector}`);
          clicked = true;
          break;
        }
      } catch (e) {
        console.log(`   ⚠️ Selector not found: ${selector}`);
      }
    }
    
    if (!clicked) {
      console.log('   ❌ No signup button found, trying direct navigation...');
      await page.goto(`${BASE_URL}/auth/signup`);
    }
    
    await page.waitForURL('**/auth/signup', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded');
    console.log('   ✅ Signup page loaded');
    
    // Step 3: Check if NeonAuth signup form is present
    console.log('\\n3️⃣ Checking for signup form...');
    
    // Wait for NeonAuth form to load
    await setTimeout(2000);
    
    // Look for common signup form elements
    const emailInput = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput = await page.locator('input[type="password"], input[name="password"]').first();
    const submitButton = await page.locator('button[type="submit"], button:has-text("Sign"), button:has-text("Create"), button:has-text("Register")').first();
    
    const hasEmailInput = await emailInput.count() > 0;
    const hasPasswordInput = await passwordInput.count() > 0;
    const hasSubmitButton = await submitButton.count() > 0;
    
    console.log(`   📧 Email input found: ${hasEmailInput}`);
    console.log(`   🔒 Password input found: ${hasPasswordInput}`);
    console.log(`   🎯 Submit button found: ${hasSubmitButton}`);
    
    if (!hasEmailInput || !hasPasswordInput) {
      console.log('\\n⚠️  Standard signup form not detected. Checking for NeonAuth/Stack components...');
      
      // Check for Stack Auth specific elements
      const stackElements = await page.locator('[data-stack], .stack-auth, [class*="stack"]').count();
      console.log(`   🏗️  Stack Auth elements found: ${stackElements}`);
      
      // Take a screenshot for debugging
      await page.screenshot({ 
        path: '/root/repo/frontend/signup-page-screenshot.png',
        fullPage: true 
      });
      console.log('   📸 Screenshot saved: signup-page-screenshot.png');
      
      // Get page content for analysis
      const pageTitle = await page.title();
      const url = page.url();
      console.log(`   📄 Page title: ${pageTitle}`);
      console.log(`   🔗 Current URL: ${url}`);
      
      // Check if we need to wait longer for Stack Auth to load
      console.log('\\n⏳ Waiting for Stack Auth to fully initialize...');
      await setTimeout(5000);
      
      // Re-check for form elements
      const emailInputRetry = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
      const hasEmailInputRetry = await emailInputRetry.count() > 0;
      
      if (!hasEmailInputRetry) {
        console.log('\\n❌ Signup form still not detected after waiting.');
        console.log('   This might indicate an issue with NeonAuth setup or the signup page configuration.');
        console.log('\\n📋 Troubleshooting steps:');
        console.log('   1. Check if Stack Auth environment variables are correctly set');
        console.log('   2. Verify NeonAuth project configuration');
        console.log('   3. Check browser console for JavaScript errors');
        console.log('   4. Ensure Stack Auth is properly initialized');
        
        return;
      }
    }
    
    // Step 4: Fill out signup form
    if (hasEmailInput && hasPasswordInput) {
      console.log('\\n4️⃣ Filling out signup form...');
      
      await emailInput.fill(testUser.email);
      console.log(`   📧 Email filled: ${testUser.email}`);
      
      await passwordInput.fill(testUser.password);
      console.log('   🔒 Password filled');
      
      // Look for additional fields (name, etc.)
      const firstNameInput = await page.locator('input[name="firstName"], input[name="first_name"], input[placeholder*="first" i]').first();
      const lastNameInput = await page.locator('input[name="lastName"], input[name="last_name"], input[placeholder*="last" i]').first();
      
      if (await firstNameInput.count() > 0) {
        await firstNameInput.fill(testUser.firstName);
        console.log('   👤 First name filled');
      }
      
      if (await lastNameInput.count() > 0) {
        await lastNameInput.fill(testUser.lastName);
        console.log('   👤 Last name filled');
      }
      
      // Step 5: Submit the form
      console.log('\\n5️⃣ Submitting signup form...');
      await submitButton.click();
      
      // Wait for response or redirect
      console.log('   ⏳ Waiting for signup response...');
      
      try {
        // Wait for either success redirect or error message
        await Promise.race([
          page.waitForURL('**/dashboard', { timeout: 15000 }),
          page.waitForSelector('.error, [role="alert"], .alert-error', { timeout: 15000 }),
          page.waitForSelector('text=error', { timeout: 15000 })
        ]);
        
        const currentUrl = page.url();
        console.log(`   🔗 Current URL after signup: ${currentUrl}`);
        
        if (currentUrl.includes('/dashboard')) {
          console.log('\\n🎉 SUCCESS: User registration completed!');
          console.log('   ✅ Successfully redirected to dashboard');
          
          // Step 6: Verify dashboard content
          console.log('\\n6️⃣ Verifying dashboard access...');
          await page.waitForLoadState('domcontentloaded');
          
          const dashboardTitle = await page.textContent('h1, h2, .dashboard-title').catch(() => null);
          const welcomeText = await page.textContent('text=Welcome').catch(() => null);
          
          console.log(`   📊 Dashboard title: ${dashboardTitle || 'Not found'}`);
          console.log(`   👋 Welcome text: ${welcomeText || 'Not found'}`);
          
          // Check for user profile information
          const userEmail = await page.textContent(`text=${testUser.email}`).catch(() => null);
          if (userEmail) {
            console.log('   ✅ User email displayed in dashboard');
          }
          
          // Take success screenshot
          await page.screenshot({ 
            path: '/root/repo/frontend/dashboard-success-screenshot.png',
            fullPage: true 
          });
          console.log('   📸 Dashboard screenshot saved: dashboard-success-screenshot.png');
          
        } else {
          console.log('\\n⚠️  Signup submitted but not redirected to dashboard');
          
          // Check for error messages
          const errorElement = await page.locator('.error, [role="alert"], .alert-error').first();
          if (await errorElement.count() > 0) {
            const errorText = await errorElement.textContent();
            console.log(`   ❌ Error message: ${errorText}`);
          }
          
          // Take error screenshot
          await page.screenshot({ 
            path: '/root/repo/frontend/signup-error-screenshot.png',
            fullPage: true 
          });
          console.log('   📸 Error screenshot saved: signup-error-screenshot.png');
        }
        
      } catch (timeoutError) {
        console.log('\\n⏰ Timeout waiting for signup response');
        console.log('   This might indicate a slow response or an issue with the signup process');
        
        // Take timeout screenshot
        await page.screenshot({ 
          path: '/root/repo/frontend/signup-timeout-screenshot.png',
          fullPage: true 
        });
        console.log('   📸 Timeout screenshot saved: signup-timeout-screenshot.png');
      }
    }
    
  } catch (error) {
    console.error(`\\n❌ Test failed with error: ${error.message}`);
    
    if (page) {
      await page.screenshot({ 
        path: '/root/repo/frontend/test-error-screenshot.png',
        fullPage: true 
      });
      console.log('   📸 Error screenshot saved: test-error-screenshot.png');
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  console.log('\\n✅ Test user creation process completed!');
  console.log(`\\n📋 Test Summary:`);
  console.log(`   Email: ${testUser.email}`);
  console.log(`   Password: ${testUser.password}`);
  console.log(`   Screenshots saved in: /root/repo/frontend/`);
}

// Install playwright if needed and run the test
async function setup() {
  console.log('🔧 Setting up Playwright...');
  
  try {
    // Try to run the test
    await createTestUser();
  } catch (error) {
    if (error.message.includes('browserType.launch')) {
      console.log('\\n📥 Playwright browser not installed. Installing...');
      console.log('   Run: npx playwright install chromium');
      console.log('   Then run this script again.');
    } else {
      console.error(`Setup error: ${error.message}`);
    }
  }
}

setup().catch(console.error);