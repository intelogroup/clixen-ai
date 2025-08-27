const { chromium } = require('playwright');

const TEST_USERS = [
  {
    email: 'testuser1@clixen.app',
    password: 'TestPass123!'
  },
  {
    email: 'testuser2@clixen.app', 
    password: 'TestPass456!'
  }
];

const BASE_URL = 'http://localhost:3000'; // Development server port

async function createUser(browser, email, password) {
  console.log(`\n🚀 Creating user: ${email}`);
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate to signup page
    console.log('📝 Navigating to signup page...');
    await page.goto(`${BASE_URL}/auth/signup`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('✅ Page loaded');
    
    // Click on "Email & Password" tab if needed
    const emailPasswordTab = await page.locator('button:has-text("Email & Password")').first();
    if (await emailPasswordTab.count() > 0) {
      await emailPasswordTab.click();
      console.log('✅ Clicked Email & Password tab');
      await page.waitForTimeout(1000);
    }
    
    // Fill email
    console.log(`📧 Filling email: ${email}`);
    const emailField = await page.locator('input[name="email"], input[type="email"]').first();
    await emailField.fill(email);
    
    // Fill password
    console.log(`🔒 Filling password: ${password}`);
    const passwordField = await page.locator('input[type="password"]').first();
    await passwordField.fill(password);
    
    // Fill confirm password if exists
    const passwordFields = await page.locator('input[type="password"]').count();
    if (passwordFields > 1) {
      console.log('🔒 Filling confirm password...');
      await page.locator('input[type="password"]').nth(1).fill(password);
    }
    
    // Take screenshot before submission
    await page.screenshot({ path: `signup-${email.split('@')[0]}-ready.png` });
    console.log(`📸 Screenshot: signup-${email.split('@')[0]}-ready.png`);
    
    // Find and click submit button
    const submitButton = await page.locator('button[type="submit"], button:has-text("Sign up"), button:has-text("Create")').first();
    
    if (await submitButton.count() > 0) {
      console.log('🖱️ Clicking submit button...');
      await submitButton.click();
      
      // Wait for response
      console.log('⏳ Waiting for response...');
      await page.waitForTimeout(5000);
      
      // Check result
      const currentUrl = page.url();
      const pageText = await page.locator('body').textContent();
      
      // Take result screenshot
      await page.screenshot({ path: `signup-${email.split('@')[0]}-result.png` });
      console.log(`📸 Screenshot: signup-${email.split('@')[0]}-result.png`);
      
      if (currentUrl.includes('/dashboard')) {
        console.log('✅ SUCCESS: User created and redirected to dashboard!');
        return { success: true, message: 'User created and auto-signed in' };
      } else if (currentUrl.includes('/auth/signin')) {
        console.log('✅ SUCCESS: User created, redirected to sign in');
        return { success: true, message: 'User created successfully' };
      } else if (pageText.includes('verify') || pageText.includes('Verify')) {
        console.log('✅ SUCCESS: User created, email verification required');
        return { success: true, message: 'User created, email verification needed' };
      } else if (pageText.includes('already exists')) {
        console.log('⚠️ User already exists');
        return { success: false, message: 'User already exists' };
      } else if (pageText.includes('error') || pageText.includes('Error')) {
        console.log('❌ Error during signup');
        return { success: false, message: 'Signup error occurred' };
      } else {
        console.log('ℹ️ Signup completed with unknown result');
        return { success: true, message: 'Signup completed' };
      }
    } else {
      console.log('❌ Submit button not found');
      return { success: false, message: 'Submit button not found' };
    }
    
  } catch (error) {
    console.error(`❌ Error creating user ${email}:`, error.message);
    await page.screenshot({ path: `signup-${email.split('@')[0]}-error.png` });
    return { success: false, message: error.message };
  } finally {
    await context.close();
  }
}

async function signInUser(browser, email, password) {
  console.log(`\n🔑 Testing sign in for: ${email}`);
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate to signin page
    console.log('📝 Navigating to signin page...');
    await page.goto(`${BASE_URL}/auth/signin`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Click on "Email & Password" tab if needed
    const emailPasswordTab = await page.locator('button:has-text("Email & Password")').first();
    if (await emailPasswordTab.count() > 0) {
      await emailPasswordTab.click();
      await page.waitForTimeout(1000);
    }
    
    // Fill credentials
    console.log(`📧 Filling email: ${email}`);
    const emailField = await page.locator('input[name="email"], input[type="email"]').first();
    await emailField.fill(email);
    
    console.log(`🔒 Filling password: ${password}`);
    const passwordField = await page.locator('input[type="password"]').first();
    await passwordField.fill(password);
    
    // Take screenshot before signin
    await page.screenshot({ path: `signin-${email.split('@')[0]}-ready.png` });
    
    // Click signin button
    const signinButton = await page.locator('button[type="submit"], button:has-text("Sign in")').first();
    
    if (await signinButton.count() > 0) {
      console.log('🖱️ Clicking sign in button...');
      await signinButton.click();
      
      // Wait for authentication
      await page.waitForTimeout(5000);
      
      // Check result
      const currentUrl = page.url();
      const pageText = await page.locator('body').textContent();
      
      // Take result screenshot
      await page.screenshot({ path: `signin-${email.split('@')[0]}-result.png` });
      console.log(`📸 Screenshot: signin-${email.split('@')[0]}-result.png`);
      
      if (currentUrl.includes('/dashboard')) {
        console.log('✅ SUCCESS: Signed in and redirected to dashboard!');
        
        // Test dashboard access
        console.log('🏠 Testing dashboard access...');
        if (pageText.includes(email)) {
          console.log('✅ User email found on dashboard');
        }
        if (pageText.includes('Welcome') || pageText.includes('Dashboard')) {
          console.log('✅ Dashboard content loaded');
        }
        
        return { success: true, message: 'Signed in successfully, dashboard accessible' };
      } else if (currentUrl.includes('/auth/signin')) {
        console.log('❌ Still on signin page - authentication failed');
        if (pageText.includes('Invalid') || pageText.includes('incorrect')) {
          return { success: false, message: 'Invalid credentials' };
        }
        return { success: false, message: 'Authentication failed' };
      } else {
        console.log(`ℹ️ Redirected to: ${currentUrl}`);
        return { success: true, message: `Redirected to ${currentUrl}` };
      }
    } else {
      return { success: false, message: 'Sign in button not found' };
    }
    
  } catch (error) {
    console.error(`❌ Error signing in ${email}:`, error.message);
    await page.screenshot({ path: `signin-${email.split('@')[0]}-error.png` });
    return { success: false, message: error.message };
  } finally {
    await context.close();
  }
}

async function runTests() {
  console.log('🚀 Starting user creation and authentication tests...\n');
  
  const browser = await chromium.launch({ 
    headless: true,
    timeout: 60000 
  });
  
  const results = [];
  
  try {
    // Create users
    console.log('👤 PHASE 1: Creating test users');
    console.log('=' .repeat(50));
    
    for (const user of TEST_USERS) {
      const createResult = await createUser(browser, user.email, user.password);
      results.push({
        phase: 'creation',
        email: user.email,
        password: user.password,
        ...createResult
      });
    }
    
    // Test sign ins
    console.log('\n🔐 PHASE 2: Testing user authentication');
    console.log('=' .repeat(50));
    
    for (const user of TEST_USERS) {
      const signinResult = await signInUser(browser, user.email, user.password);
      results.push({
        phase: 'authentication',
        email: user.email,
        password: user.password,
        ...signinResult
      });
    }
    
    // Summary
    console.log('\n📊 SUMMARY REPORT');
    console.log('=' .repeat(50));
    
    const createdUsers = results.filter(r => r.phase === 'creation' && r.success);
    const authenticatedUsers = results.filter(r => r.phase === 'authentication' && r.success);
    
    console.log(`✅ Users created: ${createdUsers.length}/${TEST_USERS.length}`);
    console.log(`✅ Users authenticated: ${authenticatedUsers.length}/${TEST_USERS.length}`);
    
    console.log('\n📋 Detailed Results:');
    for (const result of results) {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.phase.toUpperCase()}: ${result.email} - ${result.message}`);
    }
    
    console.log('\n🔑 Test User Credentials:');
    for (const user of TEST_USERS) {
      console.log(`📧 Email: ${user.email}`);
      console.log(`🔒 Password: ${user.password}`);
      console.log('---');
    }
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
  } finally {
    await browser.close();
    console.log('\n🏁 Test completed');
  }
}

// Run the tests
runTests();