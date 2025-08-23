const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function takeScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Create screenshots directory
  const screenshotDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const pages = [
    { name: 'landing', url: 'http://localhost:3005', description: 'Landing page' },
    { name: 'dashboard', url: 'http://localhost:3005/dashboard', description: 'Dashboard page' },
    { name: 'profile', url: 'http://localhost:3005/profile', description: 'Profile page' }
  ];

  console.log('🖥️  Taking screenshots of UI pages...\n');

  for (const pageInfo of pages) {
    try {
      console.log(`📸 Capturing ${pageInfo.description}: ${pageInfo.url}`);
      
      // Navigate to page
      await page.goto(pageInfo.url, { waitUntil: 'networkidle', timeout: 30000 });
      
      // Wait for any animations or loading
      await page.waitForTimeout(2000);
      
      // Take full page screenshot
      const screenshotPath = path.join(screenshotDir, `${pageInfo.name}-desktop.png`);
      await page.screenshot({ 
        path: screenshotPath, 
        fullPage: true 
      });
      
      // Take mobile viewport screenshot
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForTimeout(1000);
      const mobileScreenshotPath = path.join(screenshotDir, `${pageInfo.name}-mobile.png`);
      await page.screenshot({ 
        path: mobileScreenshotPath, 
        fullPage: true 
      });
      
      // Reset to desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      console.log(`✅ Screenshots saved: ${pageInfo.name}-desktop.png & ${pageInfo.name}-mobile.png`);
    } catch (error) {
      console.log(`❌ Failed to capture ${pageInfo.name}: ${error.message}`);
    }
  }

  // Also try to capture auth modal on landing page
  try {
    console.log(`📸 Capturing auth modal on landing page...`);
    await page.goto('http://localhost:3005', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Try to click login button to open modal
    const loginButton = await page.locator('button:has-text("Get Started"), button:has-text("Sign In"), button:has-text("Login")').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForTimeout(1000);
      
      const authModalPath = path.join(screenshotDir, 'auth-modal-desktop.png');
      await page.screenshot({ path: authModalPath, fullPage: true });
      console.log(`✅ Auth modal screenshot saved: auth-modal-desktop.png`);
    }
  } catch (error) {
    console.log(`⚠️  Could not capture auth modal: ${error.message}`);
  }

  await browser.close();
  
  console.log(`\n🎉 Screenshot capture complete! Check the 'screenshots' folder.`);
  console.log(`📁 Location: ${screenshotDir}`);
}

takeScreenshots().catch(console.error);