import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting Global Test Teardown...');
  
  // Clean up any test data if needed
  // For now, just log completion
  
  console.log('✨ Global teardown completed');
}

export default globalTeardown;