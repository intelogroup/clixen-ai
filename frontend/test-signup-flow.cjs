const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

// Mock NeonAuth user object (simulating what Stack Auth would return)
const mockNeonAuthUser = {
  id: 'neon-auth-user-' + Date.now(),
  primaryEmail: 'newuser@clixen.app',
  displayName: 'New Clixen User',
  // Other Stack Auth properties...
};

async function simulateUserSignup() {
  console.log('🚀 Simulating Complete User Signup Flow...\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to NeonDB');

    // Step 1: Simulate what happens when a user signs up via Stack Auth
    console.log('\n📝 Step 1: User signs up via NeonAuth (Stack Auth)...');
    console.log('Mock user from NeonAuth:', {
      id: mockNeonAuthUser.id,
      email: mockNeonAuthUser.primaryEmail,
      displayName: mockNeonAuthUser.displayName
    });

    // Step 2: Check if profile already exists (from our createUserProfile action)
    console.log('\n🔍 Step 2: Checking if profile already exists...');
    let existingProfile = await prisma.profile.findUnique({
      where: { neonAuthUserId: mockNeonAuthUser.id }
    });

    if (existingProfile) {
      console.log('⚠️  Profile exists, cleaning up for test...');
      await prisma.usageLog.deleteMany({
        where: { neonAuthUserId: mockNeonAuthUser.id }
      });
      await prisma.profile.delete({
        where: { neonAuthUserId: mockNeonAuthUser.id }
      });
    }

    // Step 3: Create user profile (simulating createUserProfile() server action)
    console.log('\n👤 Step 3: Creating user profile...');
    const userProfile = await prisma.profile.create({
      data: {
        neonAuthUserId: mockNeonAuthUser.id,
        email: mockNeonAuthUser.primaryEmail,
        displayName: mockNeonAuthUser.displayName || mockNeonAuthUser.primaryEmail,
        tier: "FREE",
        trialActive: true,
        quotaUsed: 0,
        quotaLimit: 50,
      }
    });

    console.log('✅ User profile created successfully!');
    console.log('Profile details:', {
      id: userProfile.id,
      email: userProfile.email,
      tier: userProfile.tier,
      trialExpiresAt: userProfile.trialExpiresAt,
      quotaLimit: userProfile.quotaLimit
    });

    // Step 4: Simulate getUserData() server action for dashboard
    console.log('\n📊 Step 4: Fetching user data for dashboard...');
    const { user, profile } = await simulateGetUserData(mockNeonAuthUser.id);
    
    console.log('✅ Dashboard data retrieved!');
    console.log('User info:', {
      email: user.primaryEmail,
      displayName: user.displayName
    });
    console.log('Profile info:', {
      tier: profile.tier,
      quotaUsed: profile.quotaUsed,
      quotaLimit: profile.quotaLimit,
      trialActive: profile.trialActive
    });

    // Step 5: Calculate trial info (for dashboard display)
    const trialDaysLeft = Math.max(0, Math.ceil((new Date(profile.trialExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    const isTrialExpired = trialDaysLeft === 0 && profile.tier === 'FREE';

    console.log('\n📅 Step 5: Trial system status:');
    console.log('Trial days left:', trialDaysLeft);
    console.log('Trial expired:', isTrialExpired);
    console.log('Can use automations:', !isTrialExpired || profile.tier !== 'FREE');

    // Step 6: Simulate user using an automation (quota update)
    console.log('\n🤖 Step 6: User uses automation (weather request)...');
    const updatedProfile = await prisma.profile.update({
      where: { neonAuthUserId: mockNeonAuthUser.id },
      data: {
        quotaUsed: { increment: 1 },
        lastActivityAt: new Date(),
      }
    });

    // Create usage log
    await prisma.usageLog.create({
      data: {
        profileId: userProfile.id,
        neonAuthUserId: mockNeonAuthUser.id,
        action: 'weather',
        workflowType: 'n8n_workflow',
        success: true,
        processingTimeMs: 1250
      }
    });

    console.log('✅ Automation request logged!');
    console.log('Updated quota usage:', updatedProfile.quotaUsed, '/', updatedProfile.quotaLimit);

    // Step 7: Simulate Telegram integration
    console.log('\n💬 Step 7: Simulating Telegram account linking...');
    const telegramChatId = '123456789';
    const linkedProfile = await prisma.profile.update({
      where: { neonAuthUserId: mockNeonAuthUser.id },
      data: {
        telegramChatId: telegramChatId,
        telegramUsername: 'test_user_123',
        telegramFirstName: 'Test',
        telegramLastName: 'User',
        telegramLinkedAt: new Date(),
        lastActivityAt: new Date(),
      }
    });

    console.log('✅ Telegram account linked!');
    console.log('Telegram chat ID:', linkedProfile.telegramChatId);

    // Step 8: Test complete user flow summary
    console.log('\n📋 Step 8: Complete user profile summary:');
    const finalProfile = await prisma.profile.findUnique({
      where: { neonAuthUserId: mockNeonAuthUser.id },
      include: {
        usageLogs: true
      }
    });

    console.log('Final user state:', {
      email: finalProfile.email,
      tier: finalProfile.tier,
      trialActive: finalProfile.trialActive,
      quotaUsed: finalProfile.quotaUsed,
      telegramLinked: !!finalProfile.telegramChatId,
      totalUsageLogs: finalProfile.usageLogs.length,
      lastActivity: finalProfile.lastActivityAt
    });

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await prisma.usageLog.deleteMany({
      where: { neonAuthUserId: mockNeonAuthUser.id }
    });
    await prisma.profile.delete({
      where: { neonAuthUserId: mockNeonAuthUser.id }
    });

    console.log('\n🎉 Complete signup flow test successful!');
    console.log('✅ All systems working: NeonAuth → NeonDB → Prisma → Dashboard');

  } catch (error) {
    console.error('\n❌ Signup flow test failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to simulate getUserData server action
async function simulateGetUserData(neonAuthUserId) {
  const profile = await prisma.profile.findUnique({
    where: { neonAuthUserId }
  });

  return {
    user: mockNeonAuthUser, // In real app, this comes from neonAuth.getUser()
    profile: profile
  };
}

// Run the signup flow test
simulateUserSignup();