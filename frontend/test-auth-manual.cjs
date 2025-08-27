const { chromium } = require('playwright');

async function runManualAuthTest() {
    console.log('🚀 Starting manual authentication tests...');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        // Test 1: Check if signup page loads
        console.log('\n📝 Test 1: Loading signup page...');
        await page.goto('http://localhost:3000/auth/signup', { timeout: 30000 });
        const title = await page.title();
        console.log(`✅ Page loaded - Title: ${title}`);
        
        // Test 2: Check form elements exist
        console.log('\n🔍 Test 2: Checking form elements...');
        const emailInput = await page.locator('input[type="email"]').count();
        const passwordInput = await page.locator('input[type="password"]').count();
        const submitButton = await page.locator('button[type="submit"]').count();
        
        console.log(`Email input: ${emailInput > 0 ? '✅ Found' : '❌ Not found'}`);
        console.log(`Password input: ${passwordInput > 0 ? '✅ Found' : '❌ Not found'}`);
        console.log(`Submit button: ${submitButton > 0 ? '✅ Found' : '❌ Not found'}`);
        
        // Test 3: Try signup with test data
        console.log('\n👤 Test 3: Testing signup flow...');
        const timestamp = Date.now();
        const testEmail = `manualtest${timestamp}@example.com`;
        const testPassword = 'ManualTest123!';
        
        await page.fill('input[type="email"]', testEmail);
        await page.fill('input[type="password"]', testPassword);
        
        console.log(`📧 Email filled: ${testEmail}`);
        console.log(`🔒 Password filled: [hidden]`);
        
        await page.click('button[type="submit"]');
        console.log('📤 Form submitted...');
        
        // Wait for response
        await page.waitForTimeout(5000);
        
        const finalUrl = page.url();
        console.log(`📍 Final URL: ${finalUrl}`);
        
        if (finalUrl.includes('/dashboard')) {
            console.log('✅ SUCCESS: Redirected to dashboard');
            
            // Test 4: Check dashboard elements
            console.log('\n🏠 Test 4: Checking dashboard elements...');
            const dashboardText = await page.locator('text=Dashboard, text=Welcome, text=Trial').count();
            const userInfo = await page.locator(`text="${testEmail.split('@')[0]}", text="${testEmail}"`).count();
            
            console.log(`Dashboard content: ${dashboardText > 0 ? '✅ Found' : '⚠️ Minimal content'}`);
            console.log(`User info displayed: ${userInfo > 0 ? '✅ Found' : '⚠️ Not visible'}`);
            
            // Test 5: Test logout
            console.log('\n🚪 Test 5: Testing logout...');
            const logoutButton = page.locator('button:has-text("Sign out"), button:has-text("Logout"), a:has-text("Sign out"), a:has-text("Logout")');
            const logoutCount = await logoutButton.count();
            
            if (logoutCount > 0) {
                await logoutButton.first().click();
                await page.waitForTimeout(2000);
                
                const logoutUrl = page.url();
                console.log(`Post-logout URL: ${logoutUrl}`);
                console.log(`Logout successful: ${!logoutUrl.includes('/dashboard') ? '✅ Yes' : '❌ No'}`);
            } else {
                console.log('⚠️ No logout button found');
            }
        } else {
            console.log('⚠️ Not redirected to dashboard - may have different flow');
            
            // Check for error messages
            const errorMessages = await page.locator('[role="alert"], .error, .invalid').count();
            if (errorMessages > 0) {
                const errorText = await page.locator('[role="alert"], .error, .invalid').first().textContent();
                console.log(`❌ Error message: ${errorText}`);
            }
        }
        
        // Test 6: Test signin page
        console.log('\n🔑 Test 6: Testing signin page...');
        await page.goto('http://localhost:3000/auth/signin');
        
        const signinEmailInput = await page.locator('input[type="email"]').count();
        const signinPasswordInput = await page.locator('input[type="password"]').count();
        
        console.log(`Signin form elements: ${signinEmailInput > 0 && signinPasswordInput > 0 ? '✅ Complete' : '❌ Missing elements'}`);
        
        // Test signin with created credentials
        if (finalUrl.includes('/dashboard')) {
            await page.fill('input[type="email"]', testEmail);
            await page.fill('input[type="password"]', testPassword);
            await page.click('button[type="submit"]');
            
            await page.waitForTimeout(3000);
            
            const signinFinalUrl = page.url();
            console.log(`Signin result: ${signinFinalUrl.includes('/dashboard') ? '✅ Successful login' : '⚠️ Different flow'}`);
        }
        
        console.log('\n🎉 Manual authentication test completed!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the test
runManualAuthTest();