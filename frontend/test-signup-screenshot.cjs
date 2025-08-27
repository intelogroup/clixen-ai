const { chromium } = require("playwright");

async function takeSignupScreenshot() {
  console.log("📸 Taking screenshot of signup page to inspect form structure...");
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to signup page
    console.log("🔍 Loading signup page...");
    await page.goto("http://localhost:3000/auth/signup", { waitUntil: "networkidle" });
    
    // Wait a bit for any dynamic content to load
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ 
      path: "/root/repo/frontend/signup-page-inspection.png",
      fullPage: true
    });
    console.log("✅ Screenshot saved: signup-page-inspection.png");
    
    // Try to find form elements with more general selectors
    console.log("\n🔍 Searching for form elements...");
    
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]', 
      'input[placeholder*="email" i]',
      'input[placeholder*="Email" i]',
      '[data-testid*="email"]',
      '.stack-input input[type="text"]'
    ];
    
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[placeholder*="password" i]',
      'input[placeholder*="Password" i]',
      '[data-testid*="password"]'
    ];
    
    for (const selector of emailSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.count() > 0) {
          console.log(`✅ Found email input with selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ No email input found with selector: ${selector}`);
      }
    }
    
    for (const selector of passwordSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.count() > 0) {
          console.log(`✅ Found password input with selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ No password input found with selector: ${selector}`);
      }
    }
    
    // Get page content for inspection
    const allInputs = await page.locator('input').all();
    console.log(`\n📝 Found ${allInputs.length} input elements total`);
    
    for (let i = 0; i < allInputs.length; i++) {
      const input = allInputs[i];
      const type = await input.getAttribute('type') || 'text';
      const name = await input.getAttribute('name') || 'no-name';
      const placeholder = await input.getAttribute('placeholder') || 'no-placeholder';
      console.log(`   Input ${i + 1}: type="${type}", name="${name}", placeholder="${placeholder}"`);
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  } finally {
    await browser.close();
    console.log("\n✅ Screenshot inspection completed!");
  }
}

// Run the inspection
takeSignupScreenshot().catch(console.error);