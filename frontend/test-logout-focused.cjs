const { chromium } = require('playwright');

async function testLogoutFocused() {
    console.log('🎯 Focused test: Creating user → Finding logout → Testing re-signin');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        // Quick user creation
        console.log('\n1️⃣ Creating test user...');
        const timestamp = Date.now();
        const testEmail = `focustest${timestamp}@example.com`;
        const testPassword = 'FocusTest123!';
        
        await page.goto('http://localhost:3000/auth/signup', { timeout: 30000 });
        await page.waitForTimeout(3000);
        
        await page.fill('input[type="email"]', testEmail);
        const passwordFields = page.locator('input[type="password"]');
        await passwordFields.nth(0).fill(testPassword);
        if (await passwordFields.count() > 1) {
            await passwordFields.nth(1).fill(testPassword);
        }
        
        await page.click('button[type="submit"]');
        await page.waitForTimeout(6000);
        
        if (!page.url().includes('/dashboard')) {
            console.log('❌ User creation failed, cannot test logout');
            return;
        }
        
        console.log('✅ User created successfully');
        console.log(`📧 Email: ${testEmail}`);
        
        // Focus on finding logout
        console.log('\n2️⃣ Searching for logout functionality...');
        
        // Wait for dashboard to load completely
        await page.waitForTimeout(3000);
        
        // Get page structure for debugging
        const pageText = await page.locator('body').innerText();
        console.log('\n📄 Dashboard content:');
        console.log(pageText.substring(0, 400));
        console.log('...');
        
        // Look for NeonAuth specific logout patterns
        const neonAuthLogoutSelectors = [
            // Standard logout patterns
            'button:has-text("Sign out")',
            'button:has-text("Logout")',
            'button:has-text("Sign Out")',
            'a:has-text("Sign out")',
            'a:has-text("Logout")',
            
            // NeonAuth/Stack specific patterns  
            '[data-stack="sign-out"]',
            '[data-testid="sign-out"]',
            'button[data-stack-action="sign-out"]',
            
            // User avatar/menu patterns
            'button[aria-label*="user" i]',
            'button[aria-label*="account" i]',
            'button[aria-label*="profile" i]',
            '[data-testid="user-button"]',
            '[data-testid="avatar"]',
            
            // Look for specific user initials or email
            `button:has-text("${testEmail.charAt(0).toUpperCase()}")`,
            'button[aria-haspopup="menu"]',
            '[role="button"][aria-haspopup="menu"]'
        ];
        
        let logoutButton = null;
        let logoutMethod = '';
        
        // Try each selector
        for (const selector of neonAuthLogoutSelectors) {
            const count = await page.locator(selector).count();
            if (count > 0) {
                logoutButton = page.locator(selector);
                logoutMethod = selector;
                console.log(`✅ Found potential logout: ${selector}`);
                break;
            }
        }
        
        // If no direct logout found, look for user menus
        if (!logoutButton) {
            console.log('🔍 No direct logout found, checking for user menus...');
            
            // Get all buttons and examine their content
            const allButtons = await page.locator('button').all();
            
            for (let i = 0; i < allButtons.length; i++) {
                const button = allButtons[i];
                const text = await button.textContent();
                const ariaLabel = await button.getAttribute('aria-label');
                const title = await button.getAttribute('title');
                const className = await button.getAttribute('class');
                
                // Check if this might be a user menu button
                const isUserButton = (
                    text?.length <= 3 || // Short text like initials "DA"
                    ariaLabel?.toLowerCase().includes('user') ||
                    ariaLabel?.toLowerCase().includes('account') ||
                    ariaLabel?.toLowerCase().includes('profile') ||
                    ariaLabel?.toLowerCase().includes('menu') ||
                    className?.includes('user') ||
                    className?.includes('avatar')
                );
                
                if (isUserButton) {
                    console.log(`🎯 Found potential user menu button: "${text}" (aria: "${ariaLabel}", class: "${className}")`);
                    
                    // Click it and see if logout appears
                    await button.click();
                    await page.waitForTimeout(1000);
                    
                    // Now look for logout options
                    for (const selector of neonAuthLogoutSelectors.slice(0, 5)) { // Just the basic ones
                        const count = await page.locator(selector).count();
                        if (count > 0) {
                            logoutButton = page.locator(selector);
                            logoutMethod = `${selector} (from menu)`;
                            console.log(`✅ Found logout in menu: ${selector}`);
                            break;
                        }
                    }
                    
                    if (logoutButton) break;
                }
            }
        }
        
        // Test logout if found
        if (logoutButton) {
            console.log(`\n3️⃣ Testing logout using: ${logoutMethod}`);
            
            await logoutButton.first().click();
            await page.waitForTimeout(4000);
            
            const postLogoutUrl = page.url();
            const loggedOut = !postLogoutUrl.includes('/dashboard');
            
            console.log(`📍 After logout: ${postLogoutUrl}`);
            console.log(`Logout result: ${loggedOut ? '✅ SUCCESS' : '❌ FAILED'}`);
            
            if (loggedOut) {
                // Test re-signin
                console.log('\n4️⃣ Testing re-signin...');
                
                if (!postLogoutUrl.includes('/auth/signin')) {
                    await page.goto('http://localhost:3000/auth/signin');
                    await page.waitForTimeout(2000);
                }
                
                await page.fill('input[type="email"]', testEmail);
                await page.fill('input[type="password"]', testPassword);
                await page.click('button[type="submit"]');
                await page.waitForTimeout(5000);
                
                const resigninUrl = page.url();
                const resigninSuccess = resigninUrl.includes('/dashboard');
                
                console.log(`📍 After re-signin: ${resigninUrl}`);
                console.log(`Re-signin result: ${resigninSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
                
                if (resigninSuccess) {
                    // Verify session data is preserved
                    const newDashboard = await page.locator('body').innerText();
                    const hasUserData = newDashboard.includes(testEmail.split('@')[0]) || newDashboard.includes('Welcome');
                    const hasTrialData = newDashboard.includes('Trial') || newDashboard.includes('7');
                    
                    console.log('\n📊 Session data verification:');
                    console.log(`User data: ${hasUserData ? '✅ Preserved' : '⚠️ Missing'}`);
                    console.log(`Trial data: ${hasTrialData ? '✅ Preserved' : '⚠️ Missing'}`);
                }
            }
            
        } else {
            console.log('\n❌ Could not find logout functionality');
            
            // Final attempt: Look at the actual HTML structure
            console.log('\n🔬 Analyzing page structure...');
            const buttons = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('button, a')).map(el => ({
                    text: el.textContent?.trim() || '',
                    classes: el.className || '',
                    id: el.id || '',
                    ariaLabel: el.getAttribute('aria-label') || ''
                })).filter(el => el.text.length < 20); // Focus on short button texts
            });
            
            console.log('📋 All short buttons/links:');
            buttons.forEach((btn, i) => {
                if (btn.text) {
                    console.log(`  ${i + 1}: "${btn.text}" (${btn.classes} ${btn.ariaLabel})`);
                }
            });
        }
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        await browser.close();
    }
}

testLogoutFocused();