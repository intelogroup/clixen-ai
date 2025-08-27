const { chromium } = require('playwright');

async function runNeonAuthTest() {
    console.log('🚀 Starting NeonAuth integration tests...');
    
    const browser = await chromium.launch({ headless: true }); // Headless mode for server environment
    const page = await browser.newPage();
    
    try {
        // Test 1: Load signup page and wait for NeonAuth component
        console.log('\n📝 Test 1: Loading signup page and checking NeonAuth component...');
        await page.goto('http://localhost:3000/auth/signup', { timeout: 60000 });
        
        const title = await page.title();
        console.log(`✅ Page loaded - Title: ${title}`);
        
        // Wait for the page to fully load and check for loading states
        await page.waitForTimeout(3000);
        
        // Check if we're showing the loading component
        const loadingElement = await page.locator('.animate-pulse').count();
        console.log(`Loading indicator: ${loadingElement > 0 ? '🔄 Present (still loading)' : '✅ Component loaded'}`);
        
        // Wait a bit more for the actual form to load
        if (loadingElement > 0) {
            console.log('⏳ Waiting for NeonAuth component to load...');
            await page.waitForTimeout(5000);
        }
        
        // Check for various possible selectors that NeonAuth might use
        const possibleSelectors = [
            'input[type="email"]',
            'input[name="email"]',
            'input[placeholder*="email" i]',
            'input[placeholder*="Email" i]',
            'input[type="password"]',
            'input[name="password"]',
            'input[placeholder*="password" i]',
            'input[placeholder*="Password" i]',
            'button[type="submit"]',
            'button:has-text("Sign up")',
            'button:has-text("Sign Up")',
            'button:has-text("Create")',
            'form',
            '[role="form"]'
        ];
        
        console.log('\n🔍 Scanning for form elements...');
        const foundElements = {};
        
        for (const selector of possibleSelectors) {
            const count = await page.locator(selector).count();
            if (count > 0) {
                foundElements[selector] = count;
                console.log(`✅ Found: ${selector} (${count})`);
            }
        }
        
        if (Object.keys(foundElements).length === 0) {
            console.log('❌ No form elements found with standard selectors');
            
            // Let's examine what's actually on the page
            console.log('\n🔬 Examining page content...');
            const pageContent = await page.content();
            
            // Check for error indicators
            if (pageContent.includes('Authentication Error') || pageContent.includes('Sign Up Error')) {
                console.log('❌ Found error indicators in page content');
            } else if (pageContent.includes('animate-pulse')) {
                console.log('⏳ Page is still in loading state');
            } else {
                console.log('🤔 Page loaded but no recognizable form elements found');
            }
            
            // Log any visible text that might give us clues
            const visibleText = await page.locator('body').innerText();
            console.log('\n📄 Visible page text (first 500 chars):');
            console.log(visibleText.substring(0, 500));
        } else {
            console.log(`\n✅ Found ${Object.keys(foundElements).length} types of form elements`);
            
            // Try to find email and password fields specifically
            let emailField = null;
            let passwordField = null;
            let submitButton = null;
            
            // Check for email fields
            for (const selector of ['input[type="email"]', 'input[name="email"]', 'input[placeholder*="email" i]']) {
                if (await page.locator(selector).count() > 0) {
                    emailField = selector;
                    break;
                }
            }
            
            // Check for password fields
            for (const selector of ['input[type="password"]', 'input[name="password"]', 'input[placeholder*="password" i]']) {
                if (await page.locator(selector).count() > 0) {
                    passwordField = selector;
                    break;
                }
            }
            
            // Check for submit buttons
            for (const selector of ['button[type="submit"]', 'button:has-text("Sign up")', 'button:has-text("Sign Up")', 'button:has-text("Create")']) {
                if (await page.locator(selector).count() > 0) {
                    submitButton = selector;
                    break;
                }
            }
            
            console.log(`\n📧 Email field: ${emailField ? '✅ ' + emailField : '❌ Not found'}`);
            console.log(`🔒 Password field: ${passwordField ? '✅ ' + passwordField : '❌ Not found'}`);
            console.log(`🚀 Submit button: ${submitButton ? '✅ ' + submitButton : '❌ Not found'}`);
            
            // If we found the necessary elements, try to test the signup flow
            if (emailField && passwordField && submitButton) {
                console.log('\n👤 Test 2: Testing signup flow with NeonAuth...');
                const timestamp = Date.now();
                const testEmail = `neontest${timestamp}@example.com`;
                const testPassword = 'NeonTest123!';
                
                await page.fill(emailField, testEmail);
                await page.fill(passwordField, testPassword);
                
                console.log(`📧 Email filled: ${testEmail}`);
                console.log(`🔒 Password filled: [hidden]`);
                
                // Take a screenshot before submitting
                await page.screenshot({ path: 'before-submit.png' });
                console.log('📸 Screenshot saved: before-submit.png');
                
                await page.click(submitButton);
                console.log('📤 Form submitted...');
                
                // Wait for response
                await page.waitForTimeout(8000);
                
                const finalUrl = page.url();
                console.log(`📍 Final URL: ${finalUrl}`);
                
                // Take a screenshot after submitting
                await page.screenshot({ path: 'after-submit.png' });
                console.log('📸 Screenshot saved: after-submit.png');
                
                if (finalUrl.includes('/dashboard')) {
                    console.log('✅ SUCCESS: Redirected to dashboard!');
                    
                    // Check dashboard content
                    const dashboardContent = await page.locator('body').innerText();
                    console.log('\n🏠 Dashboard content preview:');
                    console.log(dashboardContent.substring(0, 300));
                    
                } else {
                    console.log('⚠️ Not redirected to dashboard');
                    
                    // Check for any error messages
                    const currentContent = await page.locator('body').innerText();
                    console.log('\n📄 Current page content:');
                    console.log(currentContent.substring(0, 500));
                }
            }
        }
        
        // Test 3: Check signin page
        console.log('\n🔑 Test 3: Checking signin page...');
        await page.goto('http://localhost:3000/auth/signin', { timeout: 60000 });
        await page.waitForTimeout(3000);
        
        const signinEmailField = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').count();
        const signinPasswordField = await page.locator('input[type="password"], input[name="password"], input[placeholder*="password" i]').count();
        
        console.log(`Signin email field: ${signinEmailField > 0 ? '✅ Found' : '❌ Not found'}`);
        console.log(`Signin password field: ${signinPasswordField > 0 ? '✅ Found' : '❌ Not found'}`);
        
        // Take final screenshot
        await page.screenshot({ path: 'signin-page.png' });
        console.log('📸 Screenshot saved: signin-page.png');
        
        console.log('\n🎉 NeonAuth integration test completed!');
        console.log('\n📸 Screenshots saved in current directory for debugging:');
        console.log('  - before-submit.png');
        console.log('  - after-submit.png'); 
        console.log('  - signin-page.png');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        
        // Take screenshot of error state
        try {
            await page.screenshot({ path: 'error-state.png' });
            console.log('📸 Error screenshot saved: error-state.png');
        } catch (screenshotError) {
            console.log('Could not take error screenshot');
        }
    } finally {
        await browser.close();
    }
}

// Run the test
runNeonAuthTest();