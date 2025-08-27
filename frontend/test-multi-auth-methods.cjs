const { chromium } = require('playwright');

async function testMultiAuthMethods() {
  console.log('🧪 Testing Multi-Method Authentication...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Navigate to signin page
    console.log('📍 Navigating to signin page...');
    await page.goto('http://localhost:3000/auth/signin');
    await page.waitForLoadState('networkidle');
    
    // Wait for authentication form to load
    console.log('⏳ Waiting for authentication form...');
    await page.waitForTimeout(3000);
    
    // Check for different authentication methods
    console.log('🔍 Checking available authentication methods...');
    
    // 1. Check for Email/Password Form
    const emailInput = await page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = await page.locator('input[type="password"], input[name="password"]').first();
    
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      console.log('✅ Email/Password authentication form detected');
      
      // Test wrong password scenario
      console.log('🔄 Testing wrong password validation...');
      await emailInput.fill('test@example.com');
      await passwordInput.fill('wrongpassword123');
      
      const submitButton = await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Sign In")').first();
      await submitButton.click();
      
      // Wait for error response
      await page.waitForTimeout(3000);
      
      // Check for error message
      const errorSelectors = [
        'text=/Invalid credentials|incorrect|wrong|error|failed/i',
        '[role="alert"]',
        '.error',
        '.text-red-500',
        '.text-red-600',
        '*:has-text("Invalid")',
        '*:has-text("incorrect")',
        '*:has-text("failed")'
      ];
      
      let passwordErrorFound = false;
      for (const selector of errorSelectors) {
        try {
          const errorElement = page.locator(selector);
          if (await errorElement.isVisible()) {
            const errorText = await errorElement.textContent();
            console.log('✅ Wrong password error displayed:', errorText?.trim());
            passwordErrorFound = true;
            break;
          }
        } catch (e) {
          // Continue checking
        }
      }
      
      if (!passwordErrorFound) {
        console.log('⚠️  No password error found - checking if still on signin page...');
        const currentUrl = page.url();
        if (currentUrl.includes('/signin')) {
          console.log('✅ User remains on signin page (expected for wrong password)');
        } else {
          console.log('❌ User was redirected - may indicate OAuth-only mode');
        }
      }
      
    } else {
      console.log('❌ Email/Password form not found - may not be enabled in Stack Auth dashboard');
    }
    
    // 2. Check for Google OAuth Button
    const googleButton = await page.locator('button:has-text("Google"), button:has-text("google"), a:has-text("Google")');
    if (await googleButton.isVisible()) {
      console.log('✅ Google OAuth button detected');
    } else {
      console.log('❌ Google OAuth button not found');
    }
    
    // 3. Check for GitHub OAuth Button  
    const githubButton = await page.locator('button:has-text("GitHub"), button:has-text("github"), a:has-text("GitHub")');
    if (await githubButton.isVisible()) {
      console.log('✅ GitHub OAuth button detected');
    } else {
      console.log('❌ GitHub OAuth button not found');
    }
    
    // 4. Check overall page content for debugging
    console.log('🔍 Authentication methods summary:');
    const pageContent = await page.textContent('body');
    
    if (pageContent?.includes('Email') || pageContent?.includes('email')) {
      console.log('  📧 Email-related content found');
    }
    if (pageContent?.includes('Google')) {
      console.log('  🔵 Google-related content found'); 
    }
    if (pageContent?.includes('GitHub')) {
      console.log('  ⚫ GitHub-related content found');
    }
    if (pageContent?.includes('Password') || pageContent?.includes('password')) {
      console.log('  🔐 Password-related content found');
    }
    
    // 5. Take screenshot for debugging
    await page.screenshot({ path: 'auth-methods-test.png', fullPage: true });
    console.log('📸 Screenshot saved as auth-methods-test.png');
    
    console.log('✅ Multi-method authentication test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Take error screenshot
    try {
      await page.screenshot({ path: 'auth-test-error.png', fullPage: true });
      console.log('📸 Error screenshot saved as auth-test-error.png');
    } catch (screenshotError) {
      console.error('Could not save error screenshot:', screenshotError.message);
    }
  } finally {
    await browser.close();
  }
}

// Add configuration check
async function checkConfiguration() {
  console.log('🔧 Checking authentication configuration...');
  
  const envVars = {
    'NEXT_PUBLIC_STACK_PROJECT_ID': process.env.NEXT_PUBLIC_STACK_PROJECT_ID,
    'NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY': process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY,
    'STACK_SECRET_SERVER_KEY': process.env.STACK_SECRET_SERVER_KEY ? 'Present' : 'Missing',
    'GOOGLE_CLIENT_ID': process.env.GOOGLE_CLIENT_ID ? 'Present' : 'Missing',
    'GOOGLE_CLIENT_SECRET': process.env.GOOGLE_CLIENT_SECRET ? 'Present' : 'Missing'
  };
  
  console.log('Environment variables:');
  for (const [key, value] of Object.entries(envVars)) {
    const status = value ? (value === 'Present' ? '✅' : '✅') : '❌';
    console.log(`  ${status} ${key}: ${value || 'Missing'}`);
  }
}

async function main() {
  await checkConfiguration();
  console.log('');
  await testMultiAuthMethods();
}

main().catch(console.error);