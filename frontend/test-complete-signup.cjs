const { chromium } = require('playwright');

async function testCompleteSignup() {
    console.log('🚀 Testing complete signup flow with password confirmation...');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        // Load signup page
        await page.goto('http://localhost:3000/auth/signup', { timeout: 60000 });
        await page.waitForTimeout(3000);
        
        console.log('✅ Signup page loaded');
        
        // Fill signup form including password confirmation
        const timestamp = Date.now();
        const testEmail = `completetest${timestamp}@example.com`;
        const testPassword = 'CompleteTest123!';
        
        console.log(`📧 Testing with email: ${testEmail}`);
        
        // Fill email
        await page.fill('input[type="email"]', testEmail);
        
        // Fill password (first password field)
        const passwordFields = page.locator('input[type="password"]');
        await passwordFields.nth(0).fill(testPassword);
        
        // Fill password confirmation (second password field)
        const passwordCount = await passwordFields.count();
        if (passwordCount > 1) {
            await passwordFields.nth(1).fill(testPassword);
            console.log('✅ Password confirmation filled');
        }
        
        // Submit the form
        await page.click('button[type="submit"]');
        console.log('📤 Form submitted with password confirmation');
        
        // Wait longer for processing
        await page.waitForTimeout(8000);
        
        const finalUrl = page.url();
        console.log(`📍 Final URL: ${finalUrl}`);
        
        if (finalUrl.includes('/dashboard')) {
            console.log('🎉 SUCCESS: User created and redirected to dashboard!');
            
            // Test dashboard content
            const dashboardContent = await page.locator('body').innerText();
            console.log('\n🏠 Dashboard content preview:');
            console.log(dashboardContent.substring(0, 400));
            
        } else {
            console.log('⚠️ Not redirected to dashboard - checking current state...');
            
            const currentContent = await page.locator('body').innerText();
            console.log('\n📄 Current page content:');
            console.log(currentContent.substring(0, 500));
        }
        
        // Take screenshot
        await page.screenshot({ path: 'complete-signup-test.png' });
        console.log('\n📸 Screenshot saved: complete-signup-test.png');
        
    } catch (error) {
        console.error('\n❌ Test error:', error.message);
    } finally {
        await browser.close();
    }
}

testCompleteSignup();
