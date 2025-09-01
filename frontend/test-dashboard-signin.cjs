const { chromium } = require('@playwright/test');

async function testDashboardAccess() {
  console.log('🧪 Testing dashboard access for created user...');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const userEmail = 'dashboarduser1756734529986@example.com';
  const userPassword = 'Dashboard123';
  
  try {
    console.log(`👤 Testing dashboard access for: ${userEmail}`);
    
    // Navigate to signin
    console.log('📄 Step 1: Navigate to signin page');
    await page.goto('http://localhost:3000/auth/signin', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    console.log('✅ Signin page loaded');
    
    // Fill signin form
    console.log('📄 Step 2: Fill signin credentials');
    await page.fill('input[type="email"]', userEmail);
    await page.fill('input[type="password"]', userPassword);
    
    console.log('📄 Step 3: Submit signin');
    await page.click('button[type="submit"]');
    
    // Wait for redirect and dashboard loading
    await page.waitForTimeout(8000);
    
    const finalUrl = page.url();
    console.log('📍 After signin URL:', finalUrl);
    
    if (finalUrl.includes('/dashboard')) {
      console.log('✅ Successfully accessed dashboard!');
      
      // Take screenshot of dashboard
      await page.screenshot({ path: 'dashboard-access-test.png' });
      
      // Check dashboard content
      const content = await page.content();
      
      const dashboardFeatures = {
        hasUserEmail: content.includes(userEmail),
        hasWelcome: content.includes('Welcome') || content.includes('welcome'),
        hasTrialInfo: content.includes('trial') || content.includes('Trial') || content.includes('7'),
        hasQuotaInfo: content.includes('50') || content.includes('quota'),
        hasClixenBranding: content.includes('Clixen'),
        hasNavigation: content.includes('nav') || content.includes('dashboard'),
        hasLogoutButton: content.includes('Sign out') || content.includes('Logout'),
        hasUpgradeSection: content.includes('upgrade') || content.includes('Upgrade'),
        hasTelegramInfo: content.includes('telegram') || content.includes('@clixen_bot'),
        hasFeatures: content.includes('automation') || content.includes('feature')
      };
      
      console.log('\n📊 Dashboard Content Analysis:');
      Object.entries(dashboardFeatures).forEach(([feature, present]) => {
        console.log(`   ${present ? '✅' : '❌'} ${feature}: ${present}`);
      });
      
      // Count how many features are present
      const presentFeatures = Object.values(dashboardFeatures).filter(Boolean).length;
      const totalFeatures = Object.keys(dashboardFeatures).length;
      const completenessPercent = Math.round((presentFeatures / totalFeatures) * 100);
      
      console.log(`\n📈 Dashboard Completeness: ${presentFeatures}/${totalFeatures} (${completenessPercent}%)`);
      
      return {
        success: true,
        dashboardAccess: true,
        features: dashboardFeatures,
        completeness: completenessPercent,
        url: finalUrl
      };
      
    } else {
      console.log('❌ Failed to access dashboard');
      await page.screenshot({ path: 'dashboard-access-failed.png' });
      
      // Check for errors on current page
      const content = await page.content();
      const hasErrors = content.includes('error') || content.includes('Error');
      
      return {
        success: false,
        dashboardAccess: false,
        error: 'No dashboard redirect',
        hasErrors: hasErrors,
        url: finalUrl
      };
    }
    
  } catch (error) {
    console.error('💥 Error during dashboard test:', error.message);
    await page.screenshot({ path: 'dashboard-test-error.png' });
    return { 
      success: false, 
      error: error.message,
      dashboardAccess: false 
    };
  } finally {
    await browser.close();
  }
}

// Run the test
testDashboardAccess().then(result => {
  console.log('\n=== DASHBOARD ACCESS TEST RESULT ===');
  
  if (result.success && result.dashboardAccess) {
    console.log('🎉 SUCCESS: Dashboard access verified!');
    console.log(`✅ User can sign in and access dashboard`);
    console.log(`📊 Dashboard completeness: ${result.completeness}%`);
    
    if (result.completeness >= 70) {
      console.log('✅ Dashboard appears fully functional');
    } else {
      console.log('⚠️  Dashboard may have missing content');
    }
    
    console.log('\n🔧 Dashboard Features Present:');
    if (result.features) {
      const presentFeatures = Object.entries(result.features)
        .filter(([_, present]) => present)
        .map(([feature, _]) => feature);
      presentFeatures.forEach(feature => console.log(`   • ${feature}`));
    }
    
  } else {
    console.log('❌ FAILED: Dashboard access test failed');
    console.log('🐛 Error:', result.error);
    
    if (result.hasErrors) {
      console.log('⚠️  Page contains error messages');
    }
  }
}).catch(error => {
  console.error('💥 Fatal error:', error);
});