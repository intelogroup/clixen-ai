
const { chromium } = require('playwright');

async function runBrowserTests() {
  console.log('🚀 Launching browser for testing...');
  
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const errors = [];
  const warnings = [];
  const successes = [];
  
  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    } else if (msg.type() === 'warning') {
      warnings.push(msg.text());
    }
  });
  
  // Listen for page errors
  page.on('pageerror', error => {
    errors.push(`Page Error: ${error.message}`);
  });
  
  try {
    console.log('📄 Test 1: Loading landing page...');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    
    // Check if page loaded successfully
    const title = await page.title();
    console.log(`   Page title: ${title}`);
    
    if (title.includes('Clixen')) {
      successes.push('Landing page loaded with correct title');
      console.log('   ✅ Landing page loaded successfully');
    } else {
      errors.push('Landing page title incorrect');
      console.log('   ❌ Landing page title issue');
    }
    
    console.log('\n🔐 Test 2: Testing authentication modal...');
    
    // Try to find and click sign in button
    const signInButton = await page.locator('button:has-text("Sign In")').first();
    if (await signInButton.isVisible()) {
      await signInButton.click();
      await page.waitForTimeout(1000);
      
      // Check if modal appears
      const modal = await page.locator('[class*="modal"], [class*="dialog"]').first();
      if (await modal.isVisible({ timeout: 3000 })) {
        successes.push('Authentication modal opens correctly');
        console.log('   ✅ Authentication modal opens');
        
        // Close modal
        const closeButton = await page.locator('button[aria-label*="close"], button:has-text("✕"), svg').first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
          console.log('   ✅ Modal can be closed');
        }
      } else {
        errors.push('Authentication modal does not appear');
        console.log('   ❌ Authentication modal not found');
      }
    } else {
      errors.push('Sign In button not found');
      console.log('   ❌ Sign In button not found');
    }
    
    console.log('\n🧭 Test 3: Testing navigation...');
    
    // Test navigation to different sections
    const sections = ['features', 'pricing'];
    for (const section of sections) {
      const link = await page.locator(`a[href*="${section}"], button:has-text("${section}")`).first();
      if (await link.isVisible()) {
        await link.click();
        await page.waitForTimeout(500);
        successes.push(`Navigation to ${section} works`);
        console.log(`   ✅ ${section} navigation works`);
      }
    }
    
    console.log('\n📱 Test 4: Testing responsive design...');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const mobileMenuButton = await page.locator('[class*="mobile"], button[class*="menu"]').first();
    if (await mobileMenuButton.isVisible()) {
      successes.push('Mobile menu button visible');
      console.log('   ✅ Mobile responsive elements detected');
    } else {
      console.log('   ℹ️  No mobile menu found (might be OK)');
    }
    
    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    
    console.log('\n🔍 Test 5: Checking component rendering...');
    
    // Check for key components
    const components = [
      { name: 'Navigation', selector: 'nav, header' },
      { name: 'Main content', selector: 'main, [class*="main"]' },
      { name: 'Footer', selector: 'footer' },
      { name: 'CTA buttons', selector: 'button, [class*="button"]' }
    ];
    
    for (const component of components) {
      const element = await page.locator(component.selector).first();
      if (await element.isVisible()) {
        successes.push(`${component.name} renders correctly`);
        console.log(`   ✅ ${component.name} found and visible`);
      } else {
        warnings.push(`${component.name} not found`);
        console.log(`   ⚠️  ${component.name} not found`);
      }
    }
    
  } catch (error) {
    errors.push(`Test execution error: ${error.message}`);
    console.log(`\n❌ Test execution error: ${error.message}`);
  } finally {
    await browser.close();
  }
  
  // Results summary
  console.log('\n📊 Browser Test Results:');
  console.log(`   ✅ Successes: ${successes.length}`);
  console.log(`   ❌ Errors: ${errors.length}`);
  console.log(`   ⚠️  Warnings: ${warnings.length}`);
  
  if (successes.length > 0) {
    console.log('\n✅ Successful Tests:');
    successes.forEach((success, i) => console.log(`   ${i + 1}. ${success}`));
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach((warning, i) => console.log(`   ${i + 1}. ${warning}`));
  }
  
  if (errors.length > 0) {
    console.log('\n❌ Errors Found:');
    errors.forEach((error, i) => console.log(`   ${i + 1}. ${error}`));
  }
  
  console.log(`\n🎯 Overall Result: ${errors.length === 0 ? 'PASS' : 'FAIL'}`);
  
  return {
    successes,
    warnings,  
    errors,
    passed: errors.length === 0
  };
}

runBrowserTests().catch(console.error);
  