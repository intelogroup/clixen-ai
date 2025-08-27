const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function testUserCreation() {
  console.log('🧪 Testing NeonDB + Prisma User Creation...\n');
  
  try {
    // Test database connection
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Test user profile creation (simulating what happens after NeonAuth signup)
    const testUser = {
      neonAuthUserId: 'test-user-' + Date.now(),
      email: 'testuser@example.com',
      displayName: 'Test User',
      tier: 'FREE',
      trialActive: true,
      quotaUsed: 0,
      quotaLimit: 50
    };

    console.log('\n2. Creating test user profile...');
    console.log('User data:', JSON.stringify(testUser, null, 2));

    // Check if user already exists (cleanup from previous tests)
    const existingUser = await prisma.profile.findUnique({
      where: { email: testUser.email }
    });

    if (existingUser) {
      console.log('⚠️  User already exists, deleting for clean test...');
      await prisma.profile.delete({
        where: { email: testUser.email }
      });
    }

    // Create new user profile
    const createdUser = await prisma.profile.create({
      data: testUser
    });

    console.log('✅ User profile created successfully!');
    console.log('Created user:', JSON.stringify({
      id: createdUser.id,
      email: createdUser.email,
      displayName: createdUser.displayName,
      tier: createdUser.tier,
      trialExpiresAt: createdUser.trialExpiresAt,
      quotaLimit: createdUser.quotaLimit
    }, null, 2));

    // Test user retrieval
    console.log('\n3. Testing user retrieval...');
    const retrievedUser = await prisma.profile.findUnique({
      where: { neonAuthUserId: testUser.neonAuthUserId }
    });

    if (retrievedUser) {
      console.log('✅ User retrieval successful!');
      console.log('Retrieved user email:', retrievedUser.email);
    } else {
      console.log('❌ User retrieval failed');
    }

    // Test quota update
    console.log('\n4. Testing quota update...');
    const updatedUser = await prisma.profile.update({
      where: { neonAuthUserId: testUser.neonAuthUserId },
      data: {
        quotaUsed: { increment: 5 },
        lastActivityAt: new Date()
      }
    });

    console.log('✅ Quota update successful!');
    console.log('Updated quota:', updatedUser.quotaUsed);

    // Test usage log creation
    console.log('\n5. Testing usage log creation...');
    const usageLog = await prisma.usageLog.create({
      data: {
        profileId: createdUser.id,
        neonAuthUserId: testUser.neonAuthUserId,
        action: 'weather',
        workflowType: 'automation',
        success: true,
        processingTimeMs: 250
      }
    });

    console.log('✅ Usage log created successfully!');
    console.log('Log ID:', usageLog.id);

    // Test trial calculation
    const trialDaysLeft = Math.max(0, Math.ceil((new Date(createdUser.trialExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    console.log('\n6. Trial system test:');
    console.log('Trial expires at:', createdUser.trialExpiresAt);
    console.log('Days left:', trialDaysLeft);
    console.log('Trial active:', createdUser.trialActive);

    // Cleanup test data
    console.log('\n7. Cleaning up test data...');
    await prisma.usageLog.deleteMany({
      where: { profileId: createdUser.id }
    });
    await prisma.profile.delete({
      where: { id: createdUser.id }
    });
    console.log('✅ Cleanup completed');

    console.log('\n🎉 All tests passed! NeonDB + Prisma integration is working correctly.');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testUserCreation();