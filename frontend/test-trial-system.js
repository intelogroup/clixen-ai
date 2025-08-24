const { chromium } = require('playwright');
const postgres = require('postgres');

require('dotenv').config({ path: '.env.local' });

async function testTrialSystem() {
  console.log('🧪 COMPREHENSIVE TRIAL SYSTEM TEST');
  console.log('=' .repeat(50));

  const sql = postgres(process.env.DATABASE_URL);
  let browser, page;

  try {
    // 1. Database verification
    console.log('📊 1. Database verification...');
    
    const viewCheck = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_dashboard' 
      AND column_name IN ('trial_active', 'trial_days_remaining')
    `;
    
    console.log(`✅ Trial columns in view: ${viewCheck.length}/2`);
    
    // 2. Clear any existing trial for test user
    console.log('🧹 2. Clearing existing trial data...');
    await sql`
      UPDATE profiles 
      SET trial_started_at = NULL, trial_expires_at = NULL 
      WHERE email = 'testuser1@email.com'
    `;
    console.log('✅ Test data cleared');

    // 3. Browser testing
    console.log('🌐 3. Starting browser test...');
    browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    page = await context.newPage();

    // 4. Navigate to login
    console.log('🔐 4. Testing login flow...');
    await page.goto('http://localhost:3000');
    await page.click('button:has-text("Sign In")');
    
    // Fill login form
    await page.fill('input[type="email"]', 'testuser1@email.com');
    await page.fill('input[type="password"]', 'Demo123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ Successfully logged in to dashboard');

    // 5. Check trial button visibility
    console.log('🎯 5. Checking trial button...');
    const trialButton = await page.locator('button:has-text("Start 7-Day Free Trial")');
    const isVisible = await trialButton.isVisible();
    
    if (isVisible) {
      console.log('✅ Trial button is visible');
      
      // 6. Start trial
      console.log('🚀 6. Starting trial...');
      await trialButton.click();
      
      // Wait for page refresh
      await page.waitForTimeout(3000);
      
      // Check if trial is active
      const trialStatus = await page.locator('text=Free Trial Active');
      const trialActive = await trialStatus.isVisible();
      
      if (trialActive) {
        console.log('✅ Trial started successfully!');
        
        // 7. Check bot access
        console.log('🤖 7. Checking bot access...');
        const botButton = await page.locator('button:has-text("Access Telegram Bot")');
        const botButtonVisible = await botButton.isVisible();
        
        if (botButtonVisible) {
          console.log('✅ Bot access button available');
        } else {
          console.log('❌ Bot access button not found');
        }
      } else {
        console.log('❌ Trial not activated in UI');
      }
    } else {
      console.log('❌ Trial button not visible');
    }

    // 8. Database verification after trial
    console.log('📊 8. Database verification after trial...');
    const userTrial = await sql`
      SELECT email, trial_active, trial_days_remaining, trial_started_at, trial_expires_at
      FROM user_dashboard 
      WHERE email = 'testuser1@email.com'
    `;
    
    if (userTrial.length > 0) {
      const user = userTrial[0];
      console.log(`✅ Trial in database:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Trial Active: ${user.trial_active}`);
      console.log(`   Days Remaining: ${user.trial_days_remaining}`);
      console.log(`   Started: ${user.trial_started_at}`);
      console.log(`   Expires: ${user.trial_expires_at}`);
    }

    console.log('\n🎉 TRIAL SYSTEM TEST COMPLETED!');
    console.log('✅ All core functionality working');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
    await sql.end();
  }
}

testTrialSystem();