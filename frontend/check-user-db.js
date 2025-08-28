// Check if the test user was created in the database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTestUser() {
  try {
    console.log('🔍 Checking for testinguser@email.com in database...');
    
    // Find the user profile by email
    const profile = await prisma.profile.findUnique({
      where: { email: 'testinguser@email.com' },
      select: {
        id: true,
        neonAuthUserId: true,
        email: true,
        displayName: true,
        tier: true,
        trialActive: true,
        trialStartedAt: true,
        trialExpiresAt: true,
        quotaUsed: true,
        quotaLimit: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (profile) {
      console.log('✅ User found in database!');
      console.log('👤 User Profile:');
      console.log(`   ID: ${profile.id}`);
      console.log(`   NeonAuth ID: ${profile.neonAuthUserId}`);
      console.log(`   Email: ${profile.email}`);
      console.log(`   Display Name: ${profile.displayName || 'Not set'}`);
      console.log(`   Tier: ${profile.tier}`);
      console.log(`   Trial Active: ${profile.trialActive}`);
      console.log(`   Trial Started: ${profile.trialStartedAt}`);
      console.log(`   Trial Expires: ${profile.trialExpiresAt}`);
      console.log(`   Quota Used: ${profile.quotaUsed}/${profile.quotaLimit}`);
      console.log(`   Created: ${profile.createdAt}`);
      console.log(`   Updated: ${profile.updatedAt}`);
      
      // Calculate trial days remaining
      const now = new Date();
      const expiresAt = new Date(profile.trialExpiresAt);
      const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
      console.log(`   Trial Days Remaining: ${daysRemaining} days`);
      
      return { success: true, profile };
    } else {
      console.log('❌ User not found in database');
      return { success: false, error: 'User not found' };
    }
  } catch (error) {
    console.error('💥 Error checking database:', error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkTestUser().then(result => {
  console.log('\n=== DATABASE CHECK RESULT ===');
  if (result.success) {
    console.log('🎉 NeonAuth user creation successful!');
    console.log('✅ User profile created with proper trial settings');
  } else {
    console.log('❌ Database verification failed:', result.error);
  }
}).catch(error => {
  console.error('Fatal error:', error);
});