const { chromium } = require('playwright');

async function testSimpleLogout() {
    console.log('🎯 Simple test: Create user → Find logout → Test logout');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        console.log('\n1️⃣ Creating user...');
        
        const timestamp = Date.now();
        const testEmail = `simple${timestamp}@example.com`;
        const testPassword = 'Simple123!';
        
        // Go to signup
        await page.goto('http://localhost:3000/auth/signup', { timeout: 45000 });
        console.log('📄 Signup page loaded');
        
        await page.waitForTimeout(4000); // Wait for form to load
        
        // Fill form
        await page.fill('input[type="email"]', testEmail);
        const passwordFields = page.locator('input[type="password"]');
        await passwordFields.nth(0).fill(testPassword);
        if (await passwordFields.count() > 1) {
            await passwordFields.nth(1).fill(testPassword);
        }
        
        // Submit
        await page.click('button[type="submit"]');
        console.log('📤 Form submitted');
        
        // Wait for redirect
        await page.waitForTimeout(8000);
        
        const currentUrl = page.url();
        console.log(`📍 Current URL: ${currentUrl}`);
        
        // Check if we're on dashboard (even if URL is different)
        const pageContent = await page.locator('body').innerText();
        const isOnDashboard = pageContent.includes('Welcome,') || 
                             pageContent.includes('Trial') || 
                             pageContent.includes('Clixen AI') &&
                             pageContent.includes('Account Status');
        
        console.log(`Dashboard loaded: ${isOnDashboard ? '✅ YES' : '❌ NO'}`);
        
        if (isOnDashboard) {
            console.log('\n2️⃣ Looking for logout button...');
            
            // Look for our custom "Sign Out" button
            const logoutButton = page.locator('button:has-text("Sign Out")');
            const logoutCount = await logoutButton.count();
            
            console.log(`Custom logout button: ${logoutCount > 0 ? '✅ FOUND' : '❌ NOT FOUND'}`);
            
            if (logoutCount > 0) {
                console.log('\n3️⃣ Testing logout...');
                
                await logoutButton.click();
                console.log('🖱️ Logout button clicked');
                
                await page.waitForTimeout(5000);
                
                const postLogoutUrl = page.url();
                const postLogoutContent = await page.locator('body').innerText();
                
                const loggedOut = postLogoutUrl.includes('/auth/signin') || 
                                postLogoutContent.includes('Sign in') || 
                                !postLogoutContent.includes('Welcome,');
                
                console.log(`📍 After logout: ${postLogoutUrl}`);
                console.log(`Logout success: ${loggedOut ? '✅ YES' : '❌ NO'}`);
                
                if (loggedOut) {
                    console.log('\n4️⃣ Testing re-login...');
                    
                    // Go to signin page if not already there
                    if (!postLogoutUrl.includes('/auth/signin')) {
                        await page.goto('http://localhost:3000/auth/signin');
                        await page.waitForTimeout(2000);
                    }
                    
                    // Login
                    await page.fill('input[type="email"]', testEmail);
                    await page.fill('input[type="password"]', testPassword);
                    await page.click('button[type="submit"]');
                    
                    await page.waitForTimeout(6000);
                    
                    const loginContent = await page.locator('body').innerText();
                    const loginSuccess = loginContent.includes('Welcome,') && loginContent.includes('Trial');
                    
                    console.log(`Re-login success: ${loginSuccess ? '✅ YES' : '❌ NO'}`);
                    
                    if (loginSuccess) {
                        console.log('\n🎉 COMPLETE SUCCESS! Auth flow is working:');
                        console.log('  ✅ User signup');
                        console.log('  ✅ Dashboard access');
                        console.log('  ✅ Logout functionality'); 
                        console.log('  ✅ Re-login functionality');
                        console.log('  ✅ Session management');
                    }
                }
            } else {
                console.log('\n📋 Page analysis for debugging:');
                const allButtons = await page.locator('button').allTextContents();
                console.log('All buttons found:');
                allButtons.forEach((text, i) => {
                    if (text.trim()) {
                        console.log(`  ${i + 1}: "${text.trim()}"`);
                    }
                });
            }
        }
        
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
    } finally {
        await browser.close();
    }
}

testSimpleLogout();