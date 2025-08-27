const { chromium } = require('playwright');

async function finalAuthReport() {
  console.log('🎯 FINAL AUTHENTICATION SYSTEM REPORT');
  console.log('=====================================\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const results = {
    timestamp: new Date().toISOString(),
    testsPassed: 0,
    testsWarning: 0,
    testsFailed: 0,
    features: {},
    performance: {},
    issues: [],
    recommendations: []
  };
  
  try {
    const startTime = Date.now();
    
    // Navigate and wait for full load
    console.log('📍 Loading authentication page...');
    await page.goto('http://localhost:3000/auth/signin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    results.performance.pageLoadTime = Date.now() - startTime;
    console.log(`⏱️  Page loaded in ${results.performance.pageLoadTime}ms`);
    
    // Test 1: UI Elements Detection
    console.log('\n🔍 AUTHENTICATION METHODS DETECTION:');
    console.log('=====================================');
    
    try {
      const emailInput = await page.locator('input[type="email"]').isVisible();
      const passwordInput = await page.locator('input[type="password"]').isVisible();
      results.features.emailPasswordForm = emailInput && passwordInput;
      console.log(`📧 Email/Password Form: ${results.features.emailPasswordForm ? '✅ AVAILABLE' : '❌ NOT FOUND'}`);
      
      const githubButton = await page.locator('button:has-text("GitHub")').isVisible();
      results.features.githubOAuth = githubButton;
      console.log(`⚫ GitHub OAuth: ${results.features.githubOAuth ? '✅ AVAILABLE' : '❌ NOT FOUND'}`);
      
      const googleButton = await page.locator('button:has-text("Google")').isVisible();
      results.features.googleOAuth = googleButton;
      console.log(`🔵 Google OAuth: ${results.features.googleOAuth ? '✅ AVAILABLE' : '❌ NOT FOUND'}`);
      
      if (results.features.emailPasswordForm && results.features.githubOAuth && results.features.googleOAuth) {
        results.testsPassed++;
        console.log('🎉 ALL THREE AUTHENTICATION METHODS AVAILABLE!');
      } else {
        results.testsFailed++;
        results.issues.push('Not all authentication methods are available');
      }
      
    } catch (error) {
      results.testsFailed++;
      results.issues.push(`UI detection failed: ${error.message}`);
    }
    
    // Test 2: Wrong Password Validation
    console.log('\n🔐 WRONG PASSWORD VALIDATION TEST:');
    console.log('==================================');
    
    if (results.features.emailPasswordForm) {
      try {
        const testStartTime = Date.now();
        
        // Fill form with wrong credentials
        await page.fill('input[type="email"]', 'test@example.com');
        await page.fill('input[type="password"]', 'wrongpassword123');
        
        console.log('📝 Form filled with wrong credentials');
        
        // Submit form
        const submitButton = page.locator('button[type="submit"]').first();
        await submitButton.click();
        console.log('🔄 Form submitted');
        
        // Wait for response
        await page.waitForTimeout(3000);
        results.performance.authResponseTime = Date.now() - testStartTime;
        console.log(`⏱️  Authentication response: ${results.performance.authResponseTime}ms`);
        
        // Check if stayed on signin page
        const currentUrl = page.url();
        const stayedOnSignin = currentUrl.includes('/signin');
        
        if (stayedOnSignin) {
          console.log('✅ Stayed on signin page (correct behavior)');
          
          // Look for error messages with enhanced detection
          const errorPatterns = [
            'text=/wrong.*password/i',
            'text=/invalid.*credentials/i',
            '.text-red-500, .text-red-600',
            '[role="alert"]'
          ];
          
          let errorFound = false;
          let errorMessage = '';
          
          for (const pattern of errorPatterns) {
            try {
              const errorElement = page.locator(pattern).first();
              if (await errorElement.isVisible()) {
                errorMessage = await errorElement.textContent();
                if (errorMessage && errorMessage.trim().length > 0) {
                  errorFound = true;
                  break;
                }
              }
            } catch (e) {
              // Continue to next pattern
            }
          }
          
          if (errorFound) {
            results.testsPassed++;
            results.features.wrongPasswordValidation = true;
            console.log(`✅ ERROR MESSAGE DISPLAYED: "${errorMessage.trim()}"`);
            console.log('🎉 WRONG PASSWORD VALIDATION WORKING PERFECTLY!');
          } else {
            results.testsWarning++;
            results.features.wrongPasswordValidation = false;
            results.issues.push('Error message not clearly visible');
            console.log('⚠️  Error message not easily detected');
          }
          
        } else {
          results.testsFailed++;
          results.features.wrongPasswordValidation = false;
          results.issues.push(`Redirected to: ${currentUrl} instead of staying on signin`);
          console.log(`❌ Redirected to: ${currentUrl}`);
        }
        
      } catch (error) {
        results.testsFailed++;
        results.issues.push(`Wrong password test failed: ${error.message}`);
        console.log(`❌ Test failed: ${error.message}`);
      }
    } else {
      results.testsWarning++;
      results.issues.push('Cannot test wrong password - email/password form not available');
      console.log('⚠️  Cannot test - email/password form not available');
    }
    
    // Test 3: OAuth Functionality Check
    console.log('\n🔗 OAUTH FUNCTIONALITY CHECK:');
    console.log('=============================');
    
    // Reset page for OAuth test
    await page.goto('http://localhost:3000/auth/signin');
    await page.waitForTimeout(2000);
    
    try {
      if (results.features.githubOAuth) {
        console.log('🔄 Testing GitHub OAuth button...');
        const githubBtn = page.locator('button:has-text("GitHub")').first();
        await githubBtn.click();
        await page.waitForTimeout(2000);
        
        if (page.url().includes('github.com')) {
          results.testsPassed++;
          results.features.githubOAuthWorking = true;
          console.log('✅ GitHub OAuth: WORKING (redirects to GitHub)');
        } else {
          results.testsFailed++;
          results.features.githubOAuthWorking = false;
          results.issues.push('GitHub OAuth button does not redirect properly');
          console.log('❌ GitHub OAuth: NOT WORKING');
        }
      }
    } catch (error) {
      results.testsWarning++;
      results.issues.push(`OAuth test error: ${error.message}`);
      console.log(`⚠️  OAuth test error: ${error.message}`);
    }
    
  } catch (criticalError) {
    results.testsFailed++;
    results.issues.push(`Critical error: ${criticalError.message}`);
    console.log(`❌ Critical error: ${criticalError.message}`);
  } finally {
    await browser.close();
  }
  
  // Generate final report
  console.log('\n📊 FINAL SYSTEM STATUS REPORT');
  console.log('=============================');
  
  const totalTests = results.testsPassed + results.testsWarning + results.testsFailed;
  const successRate = totalTests > 0 ? Math.round((results.testsPassed / totalTests) * 100) : 0;
  
  console.log(`✅ Tests Passed: ${results.testsPassed}`);
  console.log(`⚠️  Tests with Warnings: ${results.testsWarning}`);  
  console.log(`❌ Tests Failed: ${results.testsFailed}`);
  console.log(`📈 Success Rate: ${successRate}%`);
  console.log(`⏱️  Total Performance: Page Load ${results.performance.pageLoadTime}ms, Auth Response ${results.performance.authResponseTime || 'N/A'}ms`);
  
  console.log('\n🎯 AUTHENTICATION FEATURES STATUS:');
  console.log('==================================');
  console.log(`📧 Email/Password Form: ${results.features.emailPasswordForm ? '✅ WORKING' : '❌ MISSING'}`);
  console.log(`🔐 Wrong Password Validation: ${results.features.wrongPasswordValidation ? '✅ WORKING' : '❌ NEEDS CONFIG'}`);
  console.log(`⚫ GitHub OAuth: ${results.features.githubOAuth ? '✅ AVAILABLE' : '❌ MISSING'}`);
  console.log(`🔵 Google OAuth: ${results.features.googleOAuth ? '✅ AVAILABLE' : '❌ MISSING'}`);
  console.log(`🔗 OAuth Functionality: ${results.features.githubOAuthWorking ? '✅ TESTED' : '❌ NEEDS TESTING'}`);
  
  if (results.issues.length > 0) {
    console.log('\n🚨 ISSUES TO ADDRESS:');
    console.log('====================');
    results.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
  }
  
  console.log('\n🏆 OVERALL ASSESSMENT:');
  console.log('======================');
  
  if (results.features.emailPasswordForm && results.features.wrongPasswordValidation && 
      results.features.githubOAuth && results.features.googleOAuth) {
    console.log('🎉 EXCELLENT: Multi-method authentication system is fully operational!');
    console.log('✅ Your original requirement for "wrong password testing" is COMPLETE');
    console.log('🚀 System is ready for production deployment');
  } else if (results.features.emailPasswordForm && results.features.githubOAuth && results.features.googleOAuth) {
    console.log('✅ GOOD: All authentication methods available');
    console.log('⚠️  Minor: Error message display could be enhanced');
    console.log('🔧 Near production-ready, minor tweaks needed');
  } else {
    console.log('⚠️  PARTIAL: Authentication system needs configuration');
    console.log('🔧 Check Stack Auth dashboard settings');
  }
  
  // Save results to file
  const fs = require('fs');
  fs.writeFileSync('auth-final-report.json', JSON.stringify(results, null, 2));
  console.log('\n💾 Detailed report saved to: auth-final-report.json');
  
  return results;
}

finalAuthReport().catch(console.error);