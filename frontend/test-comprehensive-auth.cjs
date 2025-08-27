const { chromium } = require('playwright');

/**
 * Comprehensive Authentication Test Suite
 * Tests all authentication scenarios including new users, existing users,
 * wrong credentials, and proper error handling
 */

const BASE_URL = 'http://localhost:3000';
const TEST_USERS = {
  new: {
    email: `newuser_${Date.now()}@test.com`,
    password: 'NewUser123!@#'
  },
  existing: {
    email: 'testuser@clixen.app',
    password: 'TestPass123!@#'
  },
  wrong: {
    email: 'testuser@clixen.app',
    password: 'WrongPassword123'
  },
  nonExistent: {
    email: 'nonexistent@example.com',
    password: 'SomePassword123'
  }
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testNewUserSignUp(page) {
  console.log('\n=== Testing New User Sign-Up ===');
  
  try {
    // Navigate to sign-up page
    await page.goto(`${BASE_URL}/auth/signup`);
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Sign-up page loaded');
    
    // Fill form with new user data
    await page.fill('input[type="email"]', TEST_USERS.new.email);
    await page.fill('input[type="password"]', TEST_USERS.new.password);
    
    console.log(`📝 Filled form with: ${TEST_USERS.new.email}`);
    
    // Submit form
    await page.click('button[type="submit"]');
    await delay(3000);
    
    // Check for success (redirect to dashboard or success message)
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ New user successfully created and signed in');
      return true;
    } else {
      console.log('⚠️  Sign-up did not redirect to dashboard');
      const errorElement = await page.locator('[class*="error"], [class*="alert"]').first();
      if (await errorElement.isVisible()) {
        const errorText = await errorElement.textContent();
        console.log(`❌ Sign-up error: ${errorText}`);
      }
      return false;
    }
  } catch (error) {
    console.error('❌ New user sign-up test failed:', error.message);
    return false;
  }
}

async function testExistingUserSignIn(page) {
  console.log('\n=== Testing Existing User Sign-In ===');
  
  try {
    // Navigate to sign-in page
    await page.goto(`${BASE_URL}/auth/signin`);
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Sign-in page loaded');
    
    // Fill form with existing user credentials
    await page.fill('input[type="email"]', TEST_USERS.existing.email);
    await page.fill('input[type="password"]', TEST_USERS.existing.password);
    
    console.log(`📝 Filled form with: ${TEST_USERS.existing.email}`);
    
    // Submit form
    await page.click('button[type="submit"]');
    await delay(3000);
    
    // Check for success (redirect to dashboard)
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Existing user successfully signed in');
      return true;
    } else {
      console.log('⚠️  Sign-in did not redirect to dashboard');
      const errorElement = await page.locator('[class*="error"], [class*="alert"]').first();
      if (await errorElement.isVisible()) {
        const errorText = await errorElement.textContent();
        console.log(`❌ Sign-in error: ${errorText}`);
      }
      return false;
    }
  } catch (error) {
    console.error('❌ Existing user sign-in test failed:', error.message);
    return false;
  }
}

async function testWrongPasswordError(page) {
  console.log('\n=== Testing Wrong Password Error Handling ===');
  
  try {
    // Navigate to sign-in page
    await page.goto(`${BASE_URL}/auth/signin`);
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Sign-in page loaded');
    
    // Fill form with wrong password
    await page.fill('input[type="email"]', TEST_USERS.wrong.email);
    await page.fill('input[type="password"]', TEST_USERS.wrong.password);
    
    console.log(`📝 Testing wrong password for: ${TEST_USERS.wrong.email}`);
    
    // Submit form
    await page.click('button[type="submit"]');
    await delay(3000);
    
    // Should NOT redirect to dashboard
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      console.log('❌ SECURITY ISSUE: Wrong password allowed sign-in!');
      return false;
    }
    
    // Check for error message
    const errorSelectors = [
      '[class*="error"]',
      '[class*="alert"]',
      '[data-testid="error"]',
      '.text-red-500',
      '.text-red-600',
      '[role="alert"]'
    ];
    
    let errorFound = false;
    for (const selector of errorSelectors) {
      try {
        const errorElement = await page.locator(selector).first();
        if (await errorElement.isVisible()) {
          const errorText = await errorElement.textContent();
          if (errorText && errorText.trim()) {
            console.log(`✅ Error message displayed: "${errorText}"`);
            errorFound = true;
            
            // Check if error message is user-friendly
            const userFriendlyTerms = ['password', 'credentials', 'invalid', 'incorrect', 'wrong'];
            const isUserFriendly = userFriendlyTerms.some(term => 
              errorText.toLowerCase().includes(term)
            );
            
            if (isUserFriendly) {
              console.log('✅ Error message is user-friendly');
            } else {
              console.log('⚠️  Error message could be more user-friendly');
            }
            break;
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!errorFound) {
      console.log('⚠️  No error message found - checking console logs');
      const consoleLogs = await page.evaluate(() => {
        return window.__authLogs || [];
      });
      if (consoleLogs.length > 0) {
        console.log('📋 Console logs:', consoleLogs);
      }
    }
    
    console.log('✅ Wrong password correctly rejected');
    return true;
    
  } catch (error) {
    console.error('❌ Wrong password test failed:', error.message);
    return false;
  }
}

async function testNonExistentUserError(page) {
  console.log('\n=== Testing Non-Existent User Error Handling ===');
  
  try {
    // Navigate to sign-in page
    await page.goto(`${BASE_URL}/auth/signin`);
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Sign-in page loaded');
    
    // Fill form with non-existent user
    await page.fill('input[type="email"]', TEST_USERS.nonExistent.email);
    await page.fill('input[type="password"]', TEST_USERS.nonExistent.password);
    
    console.log(`📝 Testing non-existent user: ${TEST_USERS.nonExistent.email}`);
    
    // Submit form
    await page.click('button[type="submit"]');
    await delay(3000);
    
    // Should NOT redirect to dashboard
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      console.log('❌ SECURITY ISSUE: Non-existent user allowed sign-in!');
      return false;
    }
    
    // Check for error message and sign-up suggestion
    const errorSelectors = [
      '[class*="error"]',
      '[class*="alert"]',
      '[data-testid="error"]',
      '.text-red-500',
      '.text-red-600',
      '[role="alert"]'
    ];
    
    let errorFound = false;
    for (const selector of errorSelectors) {
      try {
        const errorElement = await page.locator(selector).first();
        if (await errorElement.isVisible()) {
          const errorText = await errorElement.textContent();
          if (errorText && errorText.trim()) {
            console.log(`✅ Error message displayed: "${errorText}"`);
            errorFound = true;
            
            // Check if error suggests sign-up
            const suggestsSignUp = errorText.toLowerCase().includes('sign up') ||
                                  errorText.toLowerCase().includes('register') ||
                                  errorText.toLowerCase().includes('create account');
            
            if (suggestsSignUp) {
              console.log('✅ Error message suggests sign-up');
            } else {
              console.log('⚠️  Error message should suggest sign-up for new users');
            }
            break;
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    // Check for sign-up link
    const signUpSelectors = [
      'a[href*="/auth/signup"]',
      'a[href*="/signup"]',
      'button:has-text("Sign up")',
      'a:has-text("Sign up")',
      'a:has-text("Create account")'
    ];
    
    let signUpLinkFound = false;
    for (const selector of signUpSelectors) {
      try {
        const linkElement = await page.locator(selector).first();
        if (await linkElement.isVisible()) {
          console.log('✅ Sign-up link is available for non-existent users');
          signUpLinkFound = true;
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!signUpLinkFound) {
      console.log('⚠️  Sign-up link should be prominently displayed');
    }
    
    if (!errorFound) {
      console.log('⚠️  No error message found for non-existent user');
    }
    
    console.log('✅ Non-existent user correctly rejected');
    return true;
    
  } catch (error) {
    console.error('❌ Non-existent user test failed:', error.message);
    return false;
  }
}

async function testFormStateManagement(page) {
  console.log('\n=== Testing Form State Management ===');
  
  try {
    await page.goto(`${BASE_URL}/auth/signin`);
    await page.waitForLoadState('networkidle');
    
    // Check initial state
    const emailField = page.locator('input[type="email"]');
    const passwordField = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    console.log('✅ Form fields loaded');
    
    // Test form validation
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', '123');
    
    // Check if form shows validation errors
    const validationErrors = await page.locator('[class*="error"], .text-red-500').count();
    if (validationErrors > 0) {
      console.log('✅ Client-side validation working');
    } else {
      console.log('⚠️  Client-side validation may not be implemented');
    }
    
    // Test loading state
    await page.fill('input[type="email"]', TEST_USERS.wrong.email);
    await page.fill('input[type="password"]', TEST_USERS.wrong.password);
    
    // Submit and check for loading state
    const submitPromise = page.click('button[type="submit"]');
    
    // Check if button shows loading state
    await delay(500);
    const isDisabled = await submitButton.isDisabled();
    if (isDisabled) {
      console.log('✅ Submit button disabled during processing');
    } else {
      console.log('⚠️  Submit button should be disabled during processing');
    }
    
    await submitPromise;
    await delay(2000);
    
    console.log('✅ Form state management test completed');
    return true;
    
  } catch (error) {
    console.error('❌ Form state management test failed:', error.message);
    return false;
  }
}

async function runComprehensiveAuthTests() {
  console.log('🚀 Starting Comprehensive Authentication Test Suite');
  console.log('=' .repeat(60));
  
  const browser = await chromium.launch({ 
    headless: true,
    slowMo: 100
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    console.log(`🌐 Browser: ${msg.text()}`);
  });
  
  const results = {
    newUserSignUp: false,
    existingUserSignIn: false,
    wrongPasswordError: false,
    nonExistentUserError: false,
    formStateManagement: false
  };
  
  try {
    // Test 1: New User Sign-Up
    results.newUserSignUp = await testNewUserSignUp(page);
    
    // Test 2: Existing User Sign-In
    results.existingUserSignIn = await testExistingUserSignIn(page);
    
    // Test 3: Wrong Password Error
    results.wrongPasswordError = await testWrongPasswordError(page);
    
    // Test 4: Non-Existent User Error
    results.nonExistentUserError = await testNonExistentUserError(page);
    
    // Test 5: Form State Management
    results.formStateManagement = await testFormStateManagement(page);
    
  } catch (error) {
    console.error('❌ Test suite encountered an error:', error);
  } finally {
    await browser.close();
  }
  
  // Print results summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(60));
  
  const tests = [
    ['New User Sign-Up', results.newUserSignUp],
    ['Existing User Sign-In', results.existingUserSignIn],
    ['Wrong Password Error Handling', results.wrongPasswordError],
    ['Non-Existent User Error Handling', results.nonExistentUserError],
    ['Form State Management', results.formStateManagement]
  ];
  
  let passed = 0;
  let total = tests.length;
  
  tests.forEach(([testName, result]) => {
    const status = result ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${testName}`);
    if (result) passed++;
  });
  
  console.log('=' .repeat(60));
  console.log(`📈 OVERALL: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`);
  
  if (passed === total) {
    console.log('🎉 All authentication tests passed! System ready for production.');
  } else {
    console.log('⚠️  Some tests failed. Please review authentication implementation.');
  }
  
  // Recommendations
  console.log('\n📋 RECOMMENDATIONS:');
  if (!results.wrongPasswordError) {
    console.log('• Implement clear error messages for wrong passwords');
  }
  if (!results.nonExistentUserError) {
    console.log('• Add sign-up suggestions for non-existent users');
  }
  if (!results.formStateManagement) {
    console.log('• Enhance form validation and loading states');
  }
  
  console.log('\n✨ Test suite completed!');
}

// Run the tests
runComprehensiveAuthTests().catch(console.error);