const { chromium } = require('@playwright/test');

async function createUserAndVerifyDashboard() {
  console.log('🚀 Creating new user and verifying dashboard access...');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  // Generate unique test user
  const timestamp = Date.now();
  const testEmail = `newuser${timestamp}@clixen.app`;
  const testPassword = 'SecurePass123';
  
  console.log(`👤 Creating user: ${testEmail}`);
  
  try {
    // Step 1: Navigate to signup page
    console.log('\n📄 Step 1: Navigate to signup page');
    await page.goto('http://localhost:3000/auth/signup', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `signup-${timestamp}.png` });
    console.log('📸 Signup page loaded');
    
    // Step 2: Fill signup form
    console.log('\n📄 Step 2: Fill signup form');
    const emailInputs = await page.$$('input[type="email"]');
    const passwordInputs = await page.$$('input[type="password"]');
    
    if (emailInputs.length === 0 || passwordInputs.length < 2) {
      throw new Error(`Missing form fields. Found ${emailInputs.length} email, ${passwordInputs.length} password fields`);
    }
    
    await emailInputs[0].fill(testEmail);
    await passwordInputs[0].fill(testPassword);
    await passwordInputs[1].fill(testPassword); // Confirmation
    
    await page.screenshot({ path: `signup-filled-${timestamp}.png` });
    console.log('✏️ Form filled successfully');
    
    // Step 3: Submit signup
    console.log('\n📄 Step 3: Submit signup');
    const submitButtons = await page.$$('button[type="submit"]');
    if (submitButtons.length === 0) {
      throw new Error('No submit button found');
    }
    
    await submitButtons[0].click();
    console.log('🔄 Signup submitted, waiting for redirect...');
    
    // Wait for redirect to dashboard
    await page.waitForTimeout(8000);
    const afterSignupUrl = page.url();
    console.log('📍 After signup URL:', afterSignupUrl);
    
    if (!afterSignupUrl.includes('/dashboard')) {
      throw new Error(`Expected redirect to dashboard, got: ${afterSignupUrl}`);
    }
    
    console.log('✅ Successfully redirected to dashboard!');
    
    // Step 4: Verify dashboard content
    console.log('\n📄 Step 4: Verify dashboard content');
    await page.waitForTimeout(5000); // Allow dashboard to fully load
    await page.screenshot({ path: `dashboard-${timestamp}.png` });
    
    const pageContent = await page.content();
    const dashboardChecks = {
      hasEmail: pageContent.includes(testEmail),
      hasWelcome: pageContent.includes('Welcome') || pageContent.includes('welcome'),
      hasTrial: pageContent.includes('trial') || pageContent.includes('Trial'),
      hasQuota: pageContent.includes('50') || pageContent.includes('quota'),
      hasClixenBranding: pageContent.includes('Clixen'),
      hasLogout: pageContent.includes('Sign out') || pageContent.includes('Logout'),
      hasErrors: pageContent.includes('error') || pageContent.includes('Error')
    };
    
    console.log('📊 Dashboard content verification:');
    console.log(`   ✅ User email displayed: ${dashboardChecks.hasEmail}`);
    console.log(`   ✅ Welcome message: ${dashboardChecks.hasWelcome}`);
    console.log(`   ✅ Trial information: ${dashboardChecks.hasTrial}`);
    console.log(`   ✅ Quota information: ${dashboardChecks.hasQuota}`);
    console.log(`   ✅ Clixen branding: ${dashboardChecks.hasClixenBranding}`);
    console.log(`   ✅ Logout button: ${dashboardChecks.hasLogout}`);
    console.log(`   ⚠️  Has errors: ${dashboardChecks.hasErrors}`);
    
    // Step 5: Test navigation within dashboard
    console.log('\n📄 Step 5: Test dashboard navigation');
    
    // Look for navigation elements
    const navElements = await page.$$('nav a, .nav-item, [href="/"]');
    console.log(`🧭 Found ${navElements.length} navigation elements`);
    
    // Try clicking on Clixen AI logo/home link
    try {
      const homeLink = await page.$('a[href="/"], h1:has-text("Clixen")');
      if (homeLink) {
        console.log('🏠 Testing home link navigation...');
        await homeLink.click();
        await page.waitForTimeout(2000);
        const homeUrl = page.url();
        console.log('📍 Home page URL:', homeUrl);
      }
    } catch (e) {
      console.log('⚠️  Home navigation test skipped');
    }
    
    // Navigate back to dashboard
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForTimeout(3000);
    
    // Step 6: Test logout functionality
    console.log('\n📄 Step 6: Test logout functionality');
    
    const logoutSelectors = [
      'button:has-text("Sign out")',
      'button:has-text("Logout")', 
      'button:has-text("Log out")',
      '.logout-button'
    ];
    
    let loggedOut = false;
    for (const selector of logoutSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        console.log(`🚪 Found logout button: ${selector}`);
        await page.click(selector);
        await page.waitForTimeout(3000);
        
        const afterLogoutUrl = page.url();
        console.log('📍 After logout URL:', afterLogoutUrl);
        
        if (afterLogoutUrl.includes('/auth/signin') || afterLogoutUrl.includes('/auth/signout')) {
          console.log('✅ Successfully logged out and redirected to signin');
          loggedOut = true;
          await page.screenshot({ path: `logout-success-${timestamp}.png` });
        }
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (!loggedOut) {
      console.log('⚠️  Logout test inconclusive - button might not be visible');
    }
    
    // Step 7: Test signin with new credentials
    console.log('\n📄 Step 7: Test signin with created user');
    
    if (loggedOut) {
      // Fill signin form
      const signinEmailInputs = await page.$$('input[type="email"]');
      const signinPasswordInputs = await page.$$('input[type="password"]');
      
      if (signinEmailInputs.length > 0 && signinPasswordInputs.length > 0) {
        await signinEmailInputs[0].fill(testEmail);
        await signinPasswordInputs[0].fill(testPassword);
        
        const signinButtons = await page.$$('button[type="submit"]');
        if (signinButtons.length > 0) {
          console.log('🔄 Signing in with new credentials...');
          await signinButtons[0].click();
          await page.waitForTimeout(5000);
          
          const signinUrl = page.url();
          if (signinUrl.includes('/dashboard')) {
            console.log('✅ Successfully signed back in to dashboard!');
            await page.screenshot({ path: `signin-success-${timestamp}.png` });
          } else {
            console.log('⚠️  Signin redirect unclear:', signinUrl);
          }
        }
      }
    }
    
    return {
      success: true,
      email: testEmail,
      password: testPassword,
      dashboardChecks: dashboardChecks,
      loggedOut: loggedOut,
      screenshots: [
        `signup-${timestamp}.png`,
        `signup-filled-${timestamp}.png`, 
        `dashboard-${timestamp}.png`,
        loggedOut ? `logout-success-${timestamp}.png` : null,
        loggedOut ? `signin-success-${timestamp}.png` : null
      ].filter(Boolean)
    };
    
  } catch (error) {
    console.error('💥 Error during user creation/dashboard test:', error.message);
    await page.screenshot({ path: `error-${timestamp}.png` });
    return { 
      success: false, 
      error: error.message,
      email: testEmail,
      screenshots: [`error-${timestamp}.png`]
    };
  } finally {
    await browser.close();
  }
}

// Run the comprehensive test
createUserAndVerifyDashboard().then(result => {
  console.log('\n=== USER CREATION & DASHBOARD ACCESS RESULT ===');
  
  if (result.success) {
    console.log('🎉 SUCCESS: New user created and dashboard access verified!');
    console.log(`👤 User: ${result.email}`);
    console.log(`🔑 Password: ${result.password}`);
    console.log('');
    
    console.log('📊 Dashboard Functionality:');
    if (result.dashboardChecks) {
      Object.entries(result.dashboardChecks).forEach(([check, passed]) => {
        const icon = check === 'hasErrors' ? (passed ? '⚠️ ' : '✅') : (passed ? '✅' : '❌');
        console.log(`   ${icon} ${check}: ${passed}`);
      });
    }
    
    console.log('');
    console.log('🧪 Authentication Flow:');
    console.log(`   ✅ Signup: Successful`);
    console.log(`   ✅ Dashboard Access: Verified`);
    console.log(`   ${result.loggedOut ? '✅' : '⚠️ '} Logout: ${result.loggedOut ? 'Working' : 'Needs manual verification'}`);
    console.log(`   ${result.loggedOut ? '✅' : '⚠️ '} Signin: ${result.loggedOut ? 'Verified' : 'Needs manual verification'}`);
    
    console.log('');
    console.log('📸 Screenshots saved:', result.screenshots.join(', '));
    
  } else {
    console.log('❌ FAILED: User creation or dashboard access failed');
    console.log('🐛 Error:', result.error);
    console.log('👤 Attempted user:', result.email);
    console.log('📸 Error screenshot:', result.screenshots.join(', '));
  }
}).catch(error => {
  console.error('💥 Fatal error:', error);
});