const { chromium } = require('playwright');

async function testLogoutWithDebug() {
    console.log('🔍 Testing logout functionality with detailed debugging...');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        // Step 1: Test page accessibility first
        console.log('\n📡 Step 1: Testing page accessibility...');
        await page.goto('http://localhost:3000/', { timeout: 30000 });
        console.log('✅ Home page accessible');
        
        await page.goto('http://localhost:3000/auth/signup', { timeout: 30000 });
        console.log('✅ Signup page accessible');
        
        // Wait for form to load
        await page.waitForTimeout(4000);
        
        // Check form elements
        const emailField = await page.locator('input[type="email"]').count();
        const passwordFields = await page.locator('input[type="password"]').count();
        const submitButton = await page.locator('button[type="submit"]').count();
        
        console.log(`📋 Form elements - Email: ${emailField}, Password: ${passwordFields}, Submit: ${submitButton}`);
        
        if (emailField === 0 || passwordFields === 0 || submitButton === 0) {
            console.log('❌ Required form elements missing');
            const pageContent = await page.locator('body').innerText();
            console.log('\n📄 Page content:');
            console.log(pageContent.substring(0, 300));
            return;
        }
        
        // Step 2: Create user account
        console.log('\n👤 Step 2: Creating user account...');
        const timestamp = Date.now();
        const testEmail = `debugtest${timestamp}@example.com`;
        const testPassword = 'DebugTest123!';
        
        console.log(`📧 Using email: ${testEmail}`);
        
        // Fill form step by step with verification
        await page.fill('input[type="email"]', testEmail);
        const emailValue = await page.locator('input[type="email"]').inputValue();
        console.log(`✅ Email filled: ${emailValue === testEmail ? 'Correct' : 'Incorrect'}`);
        
        // Fill first password
        const passwordFieldsLoc = page.locator('input[type="password"]');
        await passwordFieldsLoc.nth(0).fill(testPassword);
        console.log('✅ First password filled');
        
        // Fill password confirmation if exists
        const passwordCount = await passwordFieldsLoc.count();
        if (passwordCount > 1) {
            await passwordFieldsLoc.nth(1).fill(testPassword);
            console.log('✅ Password confirmation filled');
        }
        
        // Take screenshot before submit
        await page.screenshot({ path: 'before-submit-debug.png' });
        console.log('📸 Screenshot before submit: before-submit-debug.png');
        
        // Submit form
        console.log('📤 Submitting form...');
        await page.click('button[type="submit"]');
        
        // Wait and monitor URL changes
        let currentUrl = page.url();
        console.log(`📍 Immediate URL after submit: ${currentUrl}`);
        
        for (let i = 0; i < 10; i++) {
            await page.waitForTimeout(1000);
            const newUrl = page.url();
            if (newUrl !== currentUrl) {
                console.log(`📍 URL changed (${i + 1}s): ${newUrl}`);
                currentUrl = newUrl;
            }
            
            if (newUrl.includes('/dashboard')) {
                console.log('✅ Successfully redirected to dashboard!');
                break;
            }
        }
        
        await page.screenshot({ path: 'after-submit-debug.png' });
        console.log('📸 Screenshot after submit: after-submit-debug.png');
        
        if (currentUrl.includes('/dashboard')) {
            console.log('\n🎉 User creation successful! Now testing logout...');
            
            // Wait for dashboard to fully load
            await page.waitForTimeout(3000);
            
            // Get dashboard content
            const dashboardContent = await page.locator('body').innerText();
            console.log('\n📄 Dashboard content preview:');
            console.log(dashboardContent.substring(0, 400));
            
            // Step 3: Search for logout functionality extensively
            console.log('\n🔍 Step 3: Searching for logout functionality...');
            
            // First, let's get all clickable elements and their text
            const allClickables = await page.evaluate(() => {
                const elements = document.querySelectorAll('button, a, [role="button"], [onclick]');
                return Array.from(elements).map(el => ({
                    tagName: el.tagName,
                    text: el.textContent?.trim() || '',
                    title: el.title || '',
                    ariaLabel: el.getAttribute('aria-label') || '',
                    className: el.className || '',
                    id: el.id || ''
                })).filter(el => el.text || el.title || el.ariaLabel);
            });
            
            console.log('\n📋 All clickable elements found:');
            allClickables.forEach((el, index) => {
                if (el.text || el.title || el.ariaLabel) {
                    console.log(`  ${index + 1}: ${el.tagName} - "${el.text}" (title: "${el.title}", aria: "${el.ariaLabel}")`);
                }
            });
            
            // Look for logout-related elements
            const logoutRelated = allClickables.filter(el => {
                const searchText = `${el.text} ${el.title} ${el.ariaLabel}`.toLowerCase();
                return searchText.includes('logout') || 
                       searchText.includes('sign out') || 
                       searchText.includes('log out') ||
                       searchText.includes('exit') ||
                       searchText.includes('account') ||
                       searchText.includes('profile') ||
                       searchText.includes('menu');
            });
            
            console.log('\n🎯 Potential logout-related elements:');
            logoutRelated.forEach((el, index) => {
                console.log(`  ${index + 1}: ${el.tagName} - "${el.text}" (${el.title || el.ariaLabel})`);
            });
            
            // Try different approaches to find logout
            let logoutFound = false;
            
            // Approach 1: Direct text search
            const directLogoutSelectors = [
                'button:has-text("Sign out")',
                'button:has-text("Logout")',
                'button:has-text("Sign Out")',
                'a:has-text("Sign out")',
                'a:has-text("Logout")',
                'button:has-text("Log out")'
            ];
            
            for (const selector of directLogoutSelectors) {
                const count = await page.locator(selector).count();
                if (count > 0) {
                    console.log(`✅ Found direct logout: ${selector}`);
                    await page.locator(selector).first().click();
                    logoutFound = true;
                    break;
                }
            }
            
            // Approach 2: Look for user menu (initials button)
            if (!logoutFound) {
                console.log('\n🔍 Searching for user menu...');
                const userMenuSelectors = [
                    'button:has-text("DA")', // User initials from previous tests
                    `button:has-text("${testEmail.substring(0, 2).toUpperCase()}")`, // First 2 letters of email
                    'button[aria-haspopup="menu"]',
                    '[data-testid="user-menu"]',
                    '.user-menu'
                ];
                
                for (const selector of userMenuSelectors) {
                    const count = await page.locator(selector).count();
                    if (count > 0) {
                        console.log(`✅ Found user menu: ${selector}`);
                        await page.locator(selector).first().click();
                        await page.waitForTimeout(1000);
                        
                        // Now look for logout in the opened menu
                        for (const logoutSel of directLogoutSelectors) {
                            const logoutCount = await page.locator(logoutSel).count();
                            if (logoutCount > 0) {
                                console.log(`✅ Found logout in menu: ${logoutSel}`);
                                await page.locator(logoutSel).first().click();
                                logoutFound = true;
                                break;
                            }
                        }
                        
                        if (logoutFound) break;
                    }
                }
            }
            
            // Approach 3: Try account/profile related buttons
            if (!logoutFound) {
                console.log('\n🔍 Trying account/profile related buttons...');
                const accountSelectors = [
                    'button:has-text("Account")',
                    'button:has-text("Profile")',
                    'a:has-text("Account")',
                    'a:has-text("Profile")'
                ];
                
                for (const selector of accountSelectors) {
                    const count = await page.locator(selector).count();
                    if (count > 0) {
                        console.log(`🔍 Found account/profile button: ${selector}`);
                        await page.locator(selector).first().click();
                        await page.waitForTimeout(1000);
                        
                        // Look for logout after clicking
                        for (const logoutSel of directLogoutSelectors) {
                            const logoutCount = await page.locator(logoutSel).count();
                            if (logoutCount > 0) {
                                console.log(`✅ Found logout after clicking account: ${logoutSel}`);
                                await page.locator(logoutSel).first().click();
                                logoutFound = true;
                                break;
                            }
                        }
                        
                        if (logoutFound) break;
                    }
                }
            }
            
            // Step 4: Test logout result
            if (logoutFound) {
                console.log('\n🚪 Step 4: Testing logout result...');
                await page.waitForTimeout(3000);
                
                const postLogoutUrl = page.url();
                const isLoggedOut = !postLogoutUrl.includes('/dashboard');
                
                console.log(`📍 Post-logout URL: ${postLogoutUrl}`);
                console.log(`Logout successful: ${isLoggedOut ? '✅ Yes' : '❌ No'}`);
                
                await page.screenshot({ path: 'after-logout-debug.png' });
                console.log('📸 Screenshot after logout: after-logout-debug.png');
                
                // Step 5: Test re-signin
                if (isLoggedOut) {
                    console.log('\n🔐 Step 5: Testing re-signin...');
                    
                    // Navigate to signin if not already there
                    if (!postLogoutUrl.includes('/auth/signin')) {
                        await page.goto('http://localhost:3000/auth/signin');
                        await page.waitForTimeout(2000);
                    }
                    
                    // Re-signin
                    await page.fill('input[type="email"]', testEmail);
                    await page.fill('input[type="password"]', testPassword);
                    await page.click('button[type="submit"]');
                    await page.waitForTimeout(4000);
                    
                    const resigninUrl = page.url();
                    const resigninSuccess = resigninUrl.includes('/dashboard');
                    
                    console.log(`📍 Re-signin URL: ${resigninUrl}`);
                    console.log(`Re-signin successful: ${resigninSuccess ? '✅ Yes' : '❌ No'}`);
                    
                    await page.screenshot({ path: 'after-resignin-debug.png' });
                    console.log('📸 Screenshot after re-signin: after-resignin-debug.png');
                }
                
            } else {
                console.log('❌ Could not find logout functionality');
                console.log('💡 This might indicate:');
                console.log('   - NeonAuth uses a different logout mechanism');
                console.log('   - Logout is handled via API call rather than button');
                console.log('   - Session management is different from expected');
            }
            
        } else {
            console.log('❌ User creation failed');
            
            // Check for error messages
            const errorElements = await page.locator('[role="alert"], .error, .text-red-500').count();
            if (errorElements > 0) {
                const errorText = await page.locator('[role="alert"], .error, .text-red-500').first().textContent();
                console.log(`Error message: ${errorText}`);
            }
            
            console.log('\n📄 Current page content:');
            const currentContent = await page.locator('body').innerText();
            console.log(currentContent.substring(0, 500));
        }
        
    } catch (error) {
        console.error('\n❌ Test error:', error.message);
        
        try {
            await page.screenshot({ path: 'logout-debug-error.png' });
            console.log('📸 Error screenshot: logout-debug-error.png');
        } catch (e) {
            console.log('Could not save error screenshot');
        }
    } finally {
        await browser.close();
    }
}

testLogoutWithDebug();