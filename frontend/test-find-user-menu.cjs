const { chromium } = require('playwright');

async function findUserMenu() {
    console.log('🎯 Finding the user menu and logout functionality');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        // Create user quickly
        const timestamp = Date.now();
        const testEmail = `menutest${timestamp}@example.com`;
        const testPassword = 'MenuTest123!';
        
        console.log('👤 Creating user...');
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
            console.log('❌ User creation failed');
            return;
        }
        
        console.log('✅ User on dashboard');
        
        // Wait for full page load
        await page.waitForTimeout(3000);
        
        // I noticed from the content there's "FO" (user initials) and 👤 icon
        // Let's look for user avatar/initials button
        console.log('\n🔍 Looking for user avatar/initials...');
        
        // The user initials should be first 2 letters of email
        const expectedInitials = testEmail.substring(0, 2).toUpperCase(); // "ME"
        console.log(`Expected initials: ${expectedInitials}`);
        
        // Look for user menu triggers
        const userMenuSelectors = [
            `button:has-text("${expectedInitials}")`,
            'button:has-text("👤")',
            'button[data-testid="user-button"]',
            'button[aria-label*="user menu" i]',
            'button[aria-label*="account menu" i]',
            '[data-testid="avatar"]',
            // Look for buttons near the user email
            `xpath=//button[contains(text(), "${testEmail.split('@')[0]}")]`,
            // NeonAuth/Stack specific
            '[data-stack-user-button]'
        ];
        
        let userMenuButton = null;
        let usedSelector = '';
        
        for (const selector of userMenuSelectors) {
            try {
                const count = await page.locator(selector).count();
                if (count > 0) {
                    userMenuButton = page.locator(selector);
                    usedSelector = selector;
                    console.log(`✅ Found user menu button: ${selector}`);
                    break;
                }
            } catch (e) {
                // Skip xpath or other selector issues
                continue;
            }
        }
        
        // If not found by selector, analyze all buttons systematically
        if (!userMenuButton) {
            console.log('🔍 Analyzing all buttons to find user menu...');
            
            const buttonAnalysis = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.map((btn, index) => {
                    const rect = btn.getBoundingClientRect();
                    return {
                        index,
                        text: btn.textContent?.trim() || '',
                        innerHTML: btn.innerHTML,
                        className: btn.className,
                        id: btn.id,
                        ariaLabel: btn.getAttribute('aria-label') || '',
                        title: btn.title || '',
                        visible: rect.width > 0 && rect.height > 0,
                        position: `${Math.round(rect.top)},${Math.round(rect.left)}`
                    };
                });
            });
            
            console.log('\n📋 All buttons analysis:');
            buttonAnalysis.forEach((btn, i) => {
                if (btn.visible && (btn.text || btn.ariaLabel || btn.title)) {
                    console.log(`${i + 1}: "${btn.text}" | HTML: ${btn.innerHTML.substring(0, 50)} | Class: ${btn.className} | Aria: ${btn.ariaLabel}`);
                }
            });
            
            // Look for likely user menu button
            const userMenuCandidate = buttonAnalysis.find(btn => 
                btn.visible && (
                    btn.text.length <= 3 || // Short text like initials
                    btn.innerHTML.includes('👤') ||
                    btn.className.includes('user') ||
                    btn.className.includes('avatar') ||
                    btn.ariaLabel.toLowerCase().includes('user') ||
                    btn.ariaLabel.toLowerCase().includes('menu') ||
                    btn.ariaLabel.toLowerCase().includes('account')
                )
            );
            
            if (userMenuCandidate) {
                console.log(`🎯 User menu candidate found: "${userMenuCandidate.text}" (index: ${userMenuCandidate.index})`);
                userMenuButton = page.locator('button').nth(userMenuCandidate.index);
                usedSelector = `button nth(${userMenuCandidate.index})`;
            }
        }
        
        // Test the user menu button
        if (userMenuButton) {
            console.log(`\n🖱️ Clicking user menu: ${usedSelector}`);
            
            // Take screenshot before clicking
            await page.screenshot({ path: 'before-user-menu-click.png' });
            
            await userMenuButton.click();
            await page.waitForTimeout(2000);
            
            // Take screenshot after clicking to see if menu opened
            await page.screenshot({ path: 'after-user-menu-click.png' });
            
            // Now look for logout options
            console.log('🔍 Looking for logout options after menu click...');
            
            const logoutOptions = [
                'button:has-text("Sign out")',
                'button:has-text("Logout")', 
                'button:has-text("Sign Out")',
                'a:has-text("Sign out")',
                'a:has-text("Logout")',
                'button:has-text("Log out")',
                '[data-testid="sign-out"]',
                '[data-stack-action="sign-out"]'
            ];
            
            let logoutFound = false;
            for (const logoutSelector of logoutOptions) {
                const count = await page.locator(logoutSelector).count();
                if (count > 0) {
                    console.log(`✅ Found logout option: ${logoutSelector}`);
                    
                    // Click logout
                    await page.locator(logoutSelector).first().click();
                    await page.waitForTimeout(3000);
                    
                    const postLogoutUrl = page.url();
                    const loggedOut = !postLogoutUrl.includes('/dashboard');
                    
                    console.log(`📍 After logout click: ${postLogoutUrl}`);
                    console.log(`Logout result: ${loggedOut ? '✅ SUCCESS!' : '❌ Still on dashboard'}`);
                    
                    if (loggedOut) {
                        console.log('\n🎉 LOGOUT SUCCESSFUL! Testing re-signin...');
                        
                        // Test re-signin
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
                        
                        console.log(`📍 Re-signin URL: ${resigninUrl}`);
                        console.log(`Re-signin result: ${resigninSuccess ? '✅ SUCCESS!' : '❌ FAILED'}`);
                        
                        // Final screenshot
                        await page.screenshot({ path: 'final-state.png' });
                        console.log('📸 Screenshots saved: before-user-menu-click.png, after-user-menu-click.png, final-state.png');
                    }
                    
                    logoutFound = true;
                    break;
                }
            }
            
            if (!logoutFound) {
                console.log('❌ No logout option found after clicking user menu');
                
                // Check what appeared after clicking
                const menuContent = await page.locator('body').innerText();
                console.log('\n📄 Content after menu click:');
                console.log(menuContent.substring(0, 500));
            }
            
        } else {
            console.log('❌ Could not identify user menu button');
        }
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        await browser.close();
    }
}

findUserMenu();