const { chromium } = require("playwright");

async function testUserCreation() {
  console.log("🚀 Starting test user creation with performance monitoring...");
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Monitor network requests for performance
  const performanceMetrics = {
    loadTime: 0,
    networkRequests: 0,
    jsErrors: [],
    bundleSize: 0
  };
  
  page.on("response", (response) => {
    performanceMetrics.networkRequests++;
    if (response.url().includes(".js") || response.url().includes(".css")) {
      console.log(`📦 Asset loaded: ${response.url()} (${response.status()})`);
    }
  });
  
  page.on("pageerror", (error) => {
    performanceMetrics.jsErrors.push(error.message);
    console.log(`❌ JavaScript Error: ${error.message}`);
  });
  
  try {
    // Test landing page performance
    console.log("\\n📊 Testing landing page performance...");
    const startTime = Date.now();
    
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
    performanceMetrics.loadTime = Date.now() - startTime;
    
    console.log(`✅ Landing page loaded in ${performanceMetrics.loadTime}ms`);
    
    // Take screenshot of landing page
    await page.screenshot({ path: "/root/repo/frontend/test-landing-optimized.png" });
    
    // Test navigation to signup
    console.log("\\n🔄 Navigating to signup page...");
    const signupStartTime = Date.now();
    
    // Click on "Get Started" or "Start Free Trial" button
    const signupButton = page.locator("a[href=\"/auth/signup\"]").first();
    await signupButton.click();
    
    // Wait for signup page to load
    await page.waitForURL("**/auth/signup");
    const signupLoadTime = Date.now() - signupStartTime;
    
    console.log(`✅ Signup page loaded in ${signupLoadTime}ms`);
    await page.screenshot({ path: "/root/repo/frontend/test-signup-page.png" });
    
    // Fill out the signup form
    console.log("\\n📝 Testing user creation with credentials:");
    console.log("   Email: Testo123@email.com");
    console.log("   Password: Jimtest123r5");
    
    // Look for email and password inputs
    const emailInput = page.locator("input[type=\"email\"], input[name=\"email\"]");
    const passwordInput = page.locator("input[type=\"password\"], input[name=\"password\"]");
    
    if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
      await emailInput.fill("Testo123@email.com");
      await passwordInput.fill("Jimtest123r5");
      
      // Look for and click submit button
      const submitButton = page.locator("button[type=\"submit\"], button:has-text(\"Sign Up\"), button:has-text(\"Create Account\")");
      if (await submitButton.count() > 0) {
        await submitButton.click();
        
        // Wait for either success redirect or error message
        try {
          await page.waitForURL("**/dashboard", { timeout: 10000 });
          console.log("✅ User creation successful\! Redirected to dashboard");
          
          // Take screenshot of dashboard
          await page.screenshot({ path: "/root/repo/frontend/test-dashboard-optimized.png" });
          
        } catch (error) {
          console.log("⚠️ Checking for error messages or auth requirements");
          
          // Check for any error messages
          const errorMessage = await page.locator("[role=\"alert\"], .error, .text-red-500, .text-red-600").textContent().catch(() => null);
          if (errorMessage) {
            console.log(`❌ Error message: ${errorMessage}`);
          }
        }
      } else {
        console.log("❌ No submit button found on signup page");
      }
    } else {
      console.log("❌ Email or password input not found on signup page");
    }
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  } finally {
    // Performance summary
    console.log("\\n📈 Performance Summary:");
    console.log(`   Landing page load time: ${performanceMetrics.loadTime}ms`);
    console.log(`   Network requests: ${performanceMetrics.networkRequests}`);
    console.log(`   JavaScript errors: ${performanceMetrics.jsErrors.length}`);
    
    await browser.close();
    console.log("\\n✅ Test completed\!");
  }
}

// Run the test
testUserCreation().catch(console.error);
