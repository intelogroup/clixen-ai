const puppeteer = require('playwright');

async function testEmailPasswordSignup() {
  console.log('🚀 Testing email/password signup specifically...');
  
  const browser = await puppeteer.chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Enable console logging
  page.on('console', msg => {
    console.log(`[BROWSER]: ${msg.text()}`);
  });

  // Listen for network requests and responses
  page.on('request', request => {
    if (request.url().includes('/api/') || request.url().includes('auth') || request.url().includes('stack')) {
      console.log(`[REQUEST]: ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', response => {
    if (response.url().includes('/api/') || response.url().includes('auth') || response.url().includes('stack')) {
      console.log(`[RESPONSE]: ${response.status()} ${response.url()}`);
      if (!response.ok()) {
        console.log(`[ERROR RESPONSE]: Status ${response.status()}: ${response.statusText()}`);
      }
    }
  });

  try {
    console.log('📍 Navigating to signup page...');
    await page.goto('http://localhost:3000/auth/signup', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('📍 Waiting for page to fully load...');
    await page.waitForTimeout(8000); // Wait longer for Stack Auth to fully render
    
    // Take screenshot of current state
    await page.screenshot({ path: 'email-password-signup-loaded.png', fullPage: true });
    console.log('📸 Screenshot saved: email-password-signup-loaded.png');

    // Check what elements are actually available
    console.log('📍 Analyzing available form elements...');
    
    // Look for text that mentions email/password or credential signup
    const credentialText = await page.$$('text=/email|password|credentials|sign.*up.*email/i');
    console.log(`📍 Found ${credentialText.length} credential-related text elements`);

    // Look for any links or buttons that might switch to email/password mode
    const switchLinks = await page.$$('text=/email|password|use.*email|sign.*up.*email/i');
    console.log(`📍 Found ${switchLinks.length} potential mode switch elements`);

    // Print all visible text on the page for debugging
    const bodyText = await page.$eval('body', el => el.innerText);
    console.log('📍 Page content preview:', bodyText.substring(0, 500));

    // Look specifically for form elements that aren't OAuth buttons
    const allInputs = await page.$$('input');
    console.log(`📍 Total inputs found: ${allInputs.length}`);
    
    for (let i = 0; i < allInputs.length; i++) {
      const input = allInputs[i];
      const type = await input.getAttribute('type');
      const placeholder = await input.getAttribute('placeholder');
      const name = await input.getAttribute('name');
      console.log(`  Input ${i+1}: type="${type}" placeholder="${placeholder}" name="${name}"`);
    }

    // Look for buttons that might reveal email/password form
    const allButtons = await page.$$('button');
    console.log(`📍 Total buttons found: ${allButtons.length}`);
    
    for (let i = 0; i < allButtons.length; i++) {
      const button = allButtons[i];
      const text = await button.textContent();
      const onclick = await button.getAttribute('onclick');
      console.log(`  Button ${i+1}: text="${text?.substring(0, 50)}" onclick="${onclick}"`);
    }

    // Try to find and click any "sign up with email" or similar button
    const emailSignupButtons = await page.$$('text=/sign.*up.*email|email.*sign|continue.*email|use.*email/i');
    if (emailSignupButtons.length > 0) {
      console.log('📍 Found potential email signup button, clicking...');
      await emailSignupButtons[0].click();
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'email-password-after-click.png', fullPage: true });
      console.log('📸 Screenshot after click saved: email-password-after-click.png');
      
      // Check for email/password inputs again
      const emailInputs = await page.$$('input[type="email"]');
      const passwordInputs = await page.$$('input[type="password"]');
      console.log(`📍 After clicking: ${emailInputs.length} email inputs, ${passwordInputs.length} password inputs`);
    } else {
      console.log('❌ No email signup button found');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'email-password-error.png', fullPage: true });
    console.log('📸 Error screenshot saved: email-password-error.png');
  }

  await browser.close();
  console.log('🏁 Email/password signup test completed');
}

testEmailPasswordSignup().catch(console.error);