const { chromium } = require("playwright");

async function createTestUser() {
  console.log("🚀 Creating test user with NeonAuth...");
  console.log("   Email: Testo123@email.com");
  console.log("   Password: Jimtest123r5");
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to signup page
    console.log("\n🔍 Loading signup page...");
    await page.goto("http://localhost:3000/auth/signup", { waitUntil: "networkidle" });
    
    // Wait for form to be ready
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    console.log("✅ Signup form loaded");
    
    // Fill in the form
    console.log("\n📝 Filling out signup form...");
    
    // Fill email
    await page.fill('input[type="email"]', "Testo123@email.com");
    console.log("✅ Email filled");
    
    // Fill password
    await page.fill('input[name="password"]', "Jimtest123r5");
    console.log("✅ Password filled");
    
    // Fill password confirmation
    await page.fill('input[name="passwordRepeat"]', "Jimtest123r5");
    console.log("✅ Password confirmation filled");
    
    // Take screenshot before submission
    await page.screenshot({ path: "/root/repo/frontend/signup-form-filled.png" });
    console.log("📸 Screenshot taken: signup-form-filled.png");
    
    // Look for submit button
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Sign Up")',
      'button:has-text("Create Account")',
      'button:has-text("Get Started")',
      '[role="button"]:has-text("Sign Up")'
    ];
    
    let submitButton = null;
    for (const selector of submitSelectors) {
      try {
        const button = page.locator(selector);
        if (await button.count() > 0) {
          submitButton = button;
          console.log(`✅ Found submit button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ No submit button found with selector: ${selector}`);
      }
    }
    
    if (submitButton) {
      console.log("\n🚀 Submitting signup form...");
      await submitButton.click();
      
      // Wait for either success redirect or error message
      try {
        // Wait for redirect to dashboard
        await page.waitForURL("**/dashboard", { timeout: 15000 });
        console.log("🎉 SUCCESS! User created and redirected to dashboard");
        
        // Take screenshot of dashboard
        await page.screenshot({ path: "/root/repo/frontend/test-user-dashboard.png" });
        console.log("📸 Dashboard screenshot saved: test-user-dashboard.png");
        
        // Check if we can see user profile info
        const userInfo = await page.textContent('body').catch(() => 'Unable to get page content');
        if (userInfo.includes('Testo123@email.com')) {
          console.log("✅ User email confirmed on dashboard");
        }
        
      } catch (redirectError) {
        console.log("⚠️ No immediate redirect - checking for error messages or additional steps...");
        
        // Wait a bit more for any async operations
        await page.waitForTimeout(3000);
        
        // Check for error messages
        const errorSelectors = [
          '[role="alert"]',
          '.error',
          '.text-red-500',
          '.text-red-600',
          '[class*="error"]'
        ];
        
        for (const selector of errorSelectors) {
          try {
            const errorElement = page.locator(selector);
            if (await errorElement.count() > 0) {
              const errorText = await errorElement.textContent();
              console.log(`❌ Error message found: ${errorText}`);
            }
          } catch (e) {
            // Silent fail for error checking
          }
        }
        
        // Take screenshot of current state
        await page.screenshot({ path: "/root/repo/frontend/signup-after-submit.png" });
        console.log("📸 Post-submit screenshot saved: signup-after-submit.png");
        
        // Check if we're still on signup page or moved somewhere else
        const currentUrl = page.url();
        console.log(`📍 Current URL: ${currentUrl}`);
        
        if (currentUrl.includes('/dashboard')) {
          console.log("🎉 Actually, we ARE on the dashboard! User creation successful!");
        } else if (currentUrl.includes('/auth/')) {
          console.log("⚠️ Still on auth page - might need email verification or have validation errors");
        }
      }
      
    } else {
      console.log("❌ Could not find submit button");
      
      // Get all buttons for debugging
      const allButtons = await page.locator('button').all();
      console.log(`\n🔍 Found ${allButtons.length} buttons on page:`);
      for (let i = 0; i < allButtons.length; i++) {
        const button = allButtons[i];
        const text = await button.textContent() || 'no-text';
        const type = await button.getAttribute('type') || 'no-type';
        console.log(`   Button ${i + 1}: type="${type}", text="${text}"`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    
    // Take screenshot on error
    await page.screenshot({ path: "/root/repo/frontend/signup-error.png" });
    console.log("📸 Error screenshot saved: signup-error.png");
    
  } finally {
    await browser.close();
    console.log("\n✅ Test user creation attempt completed!");
  }
}

// Run the test
createTestUser().catch(console.error);