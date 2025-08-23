import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Global Test Setup...');
  
  // Verify development server is running
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    console.log('✅ Development server is running');
    
    // Check if database is accessible
    const response = await page.evaluate(async () => {
      try {
        // Try to make a test request to see if API is working
        const res = await fetch('/api/user');
        return { status: res.status, ok: res.ok };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('🔍 API Health Check:', response);
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('🎯 Global setup completed successfully');
}

export default globalSetup;