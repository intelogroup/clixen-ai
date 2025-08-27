const { chromium } = require('playwright');

async function testLogoutSigninFlow() {
    console.log('🔄 Testing complete logout → signin flow...');
    
    const browser = await chromium.launch({ headless: true }); // Headless mode for server environment
    const page = await browser.newPage();
    
    try {
        // Step 1: Create a new user account
        console.log('\n👤 Step 1: Creating new user account...');
        const timestamp = Date.now();
        const testEmail = `logouttest${timestamp}@example.com`;
        const testPassword = 'LogoutTest123!';
        
        await page.goto('http://localhost:3000/auth/signup');
        await page.waitForTimeout(3000);
        
        // Fill signup form
        await page.fill('input[type="email"]', testEmail);
        const passwordFields = page.locator('input[type="password"]');
        await passwordFields.nth(0).fill(testPassword);
        if (await passwordFields.count() > 1) {
            await passwordFields.nth(1).fill(testPassword);
        }
        
        await page.click('button[type="submit"]');
        await page.waitForTimeout(6000);
        
        if (page.url().includes('/dashboard')) {
            console.log('✅ User created and logged in successfully');
            console.log(`📧 Test user: ${testEmail}`);
            
            // Take screenshot of logged-in dashboard
            await page.screenshot({ path: 'dashboard-logged-in.png' });
            console.log('📸 Screenshot saved: dashboard-logged-in.png');
            
            // Step 2: Find and examine logout button options
            console.log('\n🔍 Step 2: Searching for logout button...');
            
            // Check various possible logout button locations
            const logoutSelectors = [
                'button:has-text("Sign out")',
                'button:has-text("Logout")', 
                'button:has-text("Sign Out")',
                'a:has-text("Sign out")',
                'a:has-text("Logout")',
                'a:has-text("Sign Out")',
                '[data-testid="logout"]',
                '[aria-label*="logout" i]',
                '[aria-label*="sign out" i]',
                'button:has-text("Log out")',
                // Check for user menu/dropdown
                'button:has-text("DA")', // User initials
                '[data-testid="user-menu"]',
                '.user-menu',
                'button[aria-haspopup="menu"]',
                // Check for icons that might be logout buttons
                'button svg[data-testid="logout-icon"]',
                'button[title*="logout" i]',
                'button[title*="sign out" i]'
            ];
            
            let logoutButton = null;
            let usedSelector = '';
            
            for (const selector of logoutSelectors) {
                const count = await page.locator(selector).count();
                if (count > 0) {
                    logoutButton = page.locator(selector).first();
                    usedSelector = selector;
                    console.log(`✅ Found logout button: ${selector}`);
                    break;
                }
            }
            
            if (!logoutButton) {
                console.log('🔍 No obvious logout button found, examining page structure...');
                
                // Look for user initials or profile section that might contain logout
                const userInitials = await page.locator('button:has-text("DA")').count();
                if (userInitials > 0) {
                    console.log('👤 Found user initials button, clicking to see menu...');
                    await page.click('button:has-text("DA")');
                    await page.waitForTimeout(1000);
                    
                    // Now look for logout in the opened menu
                    for (const selector of logoutSelectors) {
                        const count = await page.locator(selector).count();
                        if (count > 0) {
                            logoutButton = page.locator(selector).first();
                            usedSelector = selector + ' (from user menu)';
                            console.log(`✅ Found logout button in menu: ${selector}`);
                            break;
                        }
                    }
                }
                
                // If still not found, take screenshot and examine HTML
                if (!logoutButton) {
                    await page.screenshot({ path: 'dashboard-searching-logout.png' });
                    console.log('📸 Screenshot saved: dashboard-searching-logout.png');
                    
                    // Get all buttons and links text to see what's available
                    const allButtons = await page.locator('button, a').allTextContents();
                    console.log('\n📋 All clickable elements found:');
                    allButtons.forEach((text, index) => {
                        if (text.trim()) {
                            console.log(`  ${index + 1}: "${text.trim()}"`);
                        }
                    });
                    
                    // Look for any element that might be a logout by text content
                    const possibleLogout = allButtons.find(text => 
                        text.toLowerCase().includes('logout') || 
                        text.toLowerCase().includes('sign out') ||
                        text.toLowerCase().includes('log out')
                    );
                    
                    if (possibleLogout) {
                        logoutButton = page.locator(`button:has-text("${possibleLogout}"), a:has-text("${possibleLogout}")`).first();
                        usedSelector = `Text: "${possibleLogout}"`;
                        console.log(`✅ Found logout by text content: "${possibleLogout}"`);
                    }
                }
            }
            
            // Step 3: Attempt logout
            if (logoutButton) {
                console.log(`\n🚪 Step 3: Attempting logout using: ${usedSelector}`);
                
                await logoutButton.click();
                await page.waitForTimeout(3000);
                
                const postLogoutUrl = page.url();
                const isLoggedOut = !postLogoutUrl.includes('/dashboard');
                
                console.log(`📍 Post-logout URL: ${postLogoutUrl}`);
                console.log(`Logout successful: ${isLoggedOut ? '✅ Yes' : '❌ No'}`);
                
                if (isLoggedOut) {
                    // Take screenshot after logout
                    await page.screenshot({ path: 'after-logout.png' });
                    console.log('📸 Screenshot saved: after-logout.png');
                    
                    // Step 4: Test re-signin
                    console.log('\n🔐 Step 4: Testing re-signin...');
                    
                    // Navigate to signin page if not already there
                    if (!postLogoutUrl.includes('/auth/signin')) {
                        await page.goto('http://localhost:3000/auth/signin');
                        await page.waitForTimeout(2000);
                    }
                    
                    // Fill signin form
                    await page.fill('input[type="email"]', testEmail);
                    await page.fill('input[type="password"]', testPassword);
                    await page.click('button[type="submit"]');
                    await page.waitForTimeout(4000);
                    
                    const signinUrl = page.url();
                    const signinSuccess = signinUrl.includes('/dashboard');
                    
                    console.log(`📍 Post-signin URL: ${signinUrl}`);
                    console.log(`Re-signin successful: ${signinSuccess ? '✅ Yes' : '❌ No'}`);
                    
                    if (signinSuccess) {
                        await page.screenshot({ path: 'after-resign-in.png' });
                        console.log('📸 Screenshot saved: after-resign-in.png');
                        
                        // Verify user data is still there
                        const dashboardContent = await page.locator('body').innerText();
                        const hasUserEmail = dashboardContent.includes(testEmail) || dashboardContent.includes(testEmail.split('@')[0]);
                        const hasTrialInfo = dashboardContent.toLowerCase().includes('trial');
                        
                        console.log('\n📊 Post-signin verification:');
                        console.log(`User data preserved: ${hasUserEmail ? '✅ Yes' : '⚠️ Not visible'}`);
                        console.log(`Trial info preserved: ${hasTrialInfo ? '✅ Yes' : '⚠️ Not visible'}`);
                    }
                    
                } else {
                    console.log('❌ Logout failed - still on dashboard page');
                    
                    // Maybe the logout requires confirmation?
                    console.log('🔍 Checking for logout confirmation dialog...');
                    const confirmButtons = await page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("OK")').count();
                    if (confirmButtons > 0) {
                        console.log('✅ Found confirmation dialog, clicking confirm...');
                        await page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("OK")').first().click();
                        await page.waitForTimeout(2000);
                        
                        const finalUrl = page.url();
                        console.log(`Final URL after confirmation: ${finalUrl}`);
                        console.log(`Logout with confirmation: ${!finalUrl.includes('/dashboard') ? '✅ Success' : '❌ Failed'}`);
                    }
                }
                
            } else {
                console.log('❌ Could not find logout button');
                console.log('💡 The logout functionality might be:');
                console.log('   - In a hidden dropdown menu');
                console.log('   - Accessible via keyboard shortcut');
                console.log('   - Implemented differently in NeonAuth');
                console.log('   - Located in a different section of the UI');
            }
            
        } else {
            console.log('❌ User creation failed - cannot test logout');
        }
        
        // Test completed
        
    } catch (error) {
        console.error('\n❌ Test error:', error.message);
        
        try {
            await page.screenshot({ path: 'logout-test-error.png' });
            console.log('📸 Error screenshot saved: logout-test-error.png');
        } catch (e) {
            console.log('Could not save error screenshot');
        }
    } finally {
        await browser.close();
    }
}

// Run the logout/signin test
testLogoutSigninFlow();