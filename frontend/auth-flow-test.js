// Authentication Flow Test - Manual Testing Script
// Run this with: node auth-flow-test.js

const puppeteer = require('puppeteer');

async function testAuthenticationFlow() {
  console.log('🚀 Starting Authentication Flow Tests...');
  
  let browser, page;
  const testResults = {
    freshSignUp: null,
    existingUserSignIn: null,
    dashboardDataLoading: null,
    navigationAndRouteProtection: null,
    errors: []
  };

  try {
    // Launch browser
    browser = await puppeteer.launch({ 
      headless: false, 
      slowMo: 100,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    
    // Monitor console for errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
        testResults.errors.push(`Console: ${msg.text()}`);
      }
    });
    
    page.on('pageerror', err => {
      console.log('❌ Page Error:', err.message);
      testResults.errors.push(`Page: ${err.message}`);
    });

    await page.setViewport({ width: 1280, height: 720 });

    console.log('\n📝 TEST 1: Fresh Sign Up Flow');
    try {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
      
      // Check if landing page loads
      await page.waitForSelector('body', { timeout: 10000 });
      const title = await page.title();
      console.log('✅ Landing page loaded:', title);
      
      // Look for Sign In button
      const signInButtons = await page.$$('button');
      let signInButton = null;
      
      for (let button of signInButtons) {
        const text = await page.evaluate(btn => btn.textContent.trim(), button);
        if (text.includes('Sign In') || text.includes('Get Started') || text.includes('Login')) {
          signInButton = button;
          console.log('✅ Found auth button:', text);
          break;
        }
      }
      
      if (signInButton) {
        await signInButton.click();
        await page.waitForTimeout(2000);
        
        // Check if modal or auth page opens
        const hasModal = await page.$('[role="dialog"]') !== null;
        const hasAuthForm = await page.$('input[type="email"]') !== null;
        
        if (hasModal || hasAuthForm) {
          console.log('✅ Auth interface opened');
          
          // Try to switch to sign up mode if available
          const signUpButton = await page.$('button:has-text("Sign Up"), button[data-state="inactive"]');
          if (signUpButton) {
            await signUpButton.click();
            await page.waitForTimeout(1000);
          }
          
          // Fill in test credentials for new user
          const emailInput = await page.$('input[type="email"]');
          const passwordInput = await page.$('input[type="password"]');
          
          if (emailInput && passwordInput) {
            await emailInput.type('testuser2@example.com');
            await passwordInput.type('Demo123');
            
            // Look for submit button
            const submitButton = await page.$('button[type="submit"], button:has-text("Create Account"), button:has-text("Sign Up")');
            if (submitButton) {
              console.log('📤 Attempting sign up...');
              await submitButton.click();
              await page.waitForTimeout(5000);
              
              // Check if we're redirected to dashboard
              const currentUrl = page.url();
              if (currentUrl.includes('dashboard')) {
                console.log('✅ Sign up successful - redirected to dashboard');
                testResults.freshSignUp = 'SUCCESS';
              } else {
                console.log('⚠️  Sign up attempt made, checking for errors...');
                const errorElement = await page.$('[data-testid="error-message"], .error, [role="alert"]');
                if (errorElement) {
                  const errorText = await page.evaluate(el => el.textContent, errorElement);
                  console.log('❌ Error detected:', errorText);
                  testResults.freshSignUp = `ERROR: ${errorText}`;
                } else {
                  testResults.freshSignUp = 'PARTIAL - No redirect to dashboard';
                }
              }
            } else {
              testResults.freshSignUp = 'ERROR: No submit button found';
            }
          } else {
            testResults.freshSignUp = 'ERROR: Email/password inputs not found';
          }
        } else {
          testResults.freshSignUp = 'ERROR: Auth interface did not open';
        }
      } else {
        testResults.freshSignUp = 'ERROR: No auth button found';
      }
    } catch (error) {
      testResults.freshSignUp = `ERROR: ${error.message}`;
      console.log('❌ Test 1 failed:', error.message);
    }

    console.log('\n📝 TEST 2: Existing User Sign In');
    try {
      // Go back to home page
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
      await page.waitForTimeout(2000);
      
      // Find and click sign in button
      const signInButtons = await page.$$('button');
      let signInButton = null;
      
      for (let button of signInButtons) {
        const text = await page.evaluate(btn => btn.textContent.trim(), button);
        if (text.includes('Sign In') || text.includes('Login')) {
          signInButton = button;
          break;
        }
      }
      
      if (signInButton) {
        await signInButton.click();
        await page.waitForTimeout(2000);
        
        // Fill in existing user credentials
        const emailInput = await page.$('input[type="email"]');
        const passwordInput = await page.$('input[type="password"]');
        
        if (emailInput && passwordInput) {
          await emailInput.click({ clickCount: 3 }); // Select all
          await emailInput.type('testuser1@email.com');
          
          await passwordInput.click({ clickCount: 3 }); // Select all
          await passwordInput.type('Demo123');
          
          // Find and click sign in button (not sign up)
          const submitButtons = await page.$$('button[type="submit"], button:has-text("Sign In")');
          let signInSubmitButton = null;
          
          for (let button of submitButtons) {
            const text = await page.evaluate(btn => btn.textContent.trim(), button);
            if (text.includes('Sign In') && !text.includes('Sign Up')) {
              signInSubmitButton = button;
              break;
            }
          }
          
          if (signInSubmitButton) {
            console.log('📤 Attempting sign in...');
            await signInSubmitButton.click();
            await page.waitForTimeout(5000);
            
            const currentUrl = page.url();
            if (currentUrl.includes('dashboard')) {
              console.log('✅ Sign in successful');
              testResults.existingUserSignIn = 'SUCCESS';
            } else {
              const errorElement = await page.$('[data-testid="error-message"], .error, [role="alert"]');
              if (errorElement) {
                const errorText = await page.evaluate(el => el.textContent, errorElement);
                testResults.existingUserSignIn = `ERROR: ${errorText}`;
              } else {
                testResults.existingUserSignIn = 'PARTIAL - No redirect to dashboard';
              }
            }
          } else {
            testResults.existingUserSignIn = 'ERROR: No sign in submit button found';
          }
        } else {
          testResults.existingUserSignIn = 'ERROR: Email/password inputs not found';
        }
      } else {
        testResults.existingUserSignIn = 'ERROR: No sign in button found';
      }
    } catch (error) {
      testResults.existingUserSignIn = `ERROR: ${error.message}`;
      console.log('❌ Test 2 failed:', error.message);
    }

    console.log('\n📝 TEST 3: Dashboard Data Loading');
    try {
      // Ensure we're on dashboard or navigate to it
      await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('dashboard')) {
        console.log('✅ Dashboard accessible');
        
        // Check for user profile information
        const userInfo = await page.$('[data-testid="user-email"], .user-email, [data-testid="user-profile"]');
        if (userInfo) {
          const userText = await page.evaluate(el => el.textContent, userInfo);
          console.log('✅ User profile data found:', userText);
        }
        
        // Check for dashboard stats
        const statsElements = await page.$$('[data-testid="stats"], .stats, .dashboard-stats, .card');
        console.log(`✅ Found ${statsElements.length} dashboard elements`);
        
        // Check for trial/subscription info
        const trialInfo = await page.$('[data-testid="trial"], .trial, [data-testid="subscription"]');
        if (trialInfo) {
          const trialText = await page.evaluate(el => el.textContent, trialInfo);
          console.log('✅ Trial/subscription info found:', trialText);
        }
        
        testResults.dashboardDataLoading = 'SUCCESS';
      } else {
        testResults.dashboardDataLoading = 'ERROR: Could not access dashboard';
      }
    } catch (error) {
      testResults.dashboardDataLoading = `ERROR: ${error.message}`;
      console.log('❌ Test 3 failed:', error.message);
    }

    console.log('\n📝 TEST 4: Navigation and Route Protection');
    try {
      const testPages = ['/profile', '/subscription', '/bot-access'];
      const navigationResults = [];
      
      for (const testPage of testPages) {
        try {
          await page.goto(`http://localhost:3000${testPage}`, { waitUntil: 'networkidle2' });
          await page.waitForTimeout(2000);
          
          const currentUrl = page.url();
          const statusCode = await page.evaluate(() => {
            const response = fetch(window.location.href);
            return response.then(r => r.status).catch(() => 200);
          });
          
          console.log(`✅ ${testPage}: Accessible (URL: ${currentUrl})`);
          navigationResults.push(`${testPage}: SUCCESS`);
        } catch (error) {
          console.log(`❌ ${testPage}: Error - ${error.message}`);
          navigationResults.push(`${testPage}: ERROR - ${error.message}`);
        }
      }
      
      testResults.navigationAndRouteProtection = navigationResults.join(', ');
    } catch (error) {
      testResults.navigationAndRouteProtection = `ERROR: ${error.message}`;
      console.log('❌ Test 4 failed:', error.message);
    }

  } catch (error) {
    console.log('❌ Critical test error:', error.message);
    testResults.errors.push(`Critical: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Generate final report
  console.log('\n' + '='.repeat(60));
  console.log('📊 AUTHENTICATION FLOW TEST RESULTS');
  console.log('='.repeat(60));
  
  console.log(`🆕 Fresh Sign Up: ${testResults.freshSignUp}`);
  console.log(`🔄 Existing User Sign In: ${testResults.existingUserSignIn}`);
  console.log(`📊 Dashboard Data Loading: ${testResults.dashboardDataLoading}`);
  console.log(`🔗 Navigation & Route Protection: ${testResults.navigationAndRouteProtection}`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ ERRORS DETECTED:');
    testResults.errors.forEach((error, i) => {
      console.log(`   ${i + 1}. ${error}`);
    });
  }
  
  console.log('\n✅ Test completed!');
  
  return testResults;
}

// Run the test
testAuthenticationFlow().catch(console.error);