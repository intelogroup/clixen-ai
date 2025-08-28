// Debug the createUserProfile function
const { PrismaClient } = require('@prisma/client');

// Set environment variables
process.env.DATABASE_URL = "postgresql://neondb_owner:npg_t3OGhafQiub2@ep-odd-moon-ade1z4vk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
process.env.DATABASE_URL_UNPOOLED = "postgresql://neondb_owner:npg_t3OGhafQiub2@ep-odd-moon-ade1z4vk.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Simulate createUserProfile function behavior
async function debugCreateProfile() {
  try {
    console.log('🔍 DEBUG: Testing profile creation logic...');
    
    // The issue: NeonAuth creates users, but our server action might be failing
    // Let's manually create a profile for the testinguser email to test the logic
    
    console.log('\n📊 Step 1: Simulate NeonAuth user data');
    // This simulates what NeonAuth would provide
    const mockUser = {
      id: 'debug-test-user-id-12345', // This would be the NeonAuth user ID
      primaryEmail: 'testinguser@email.com',
      displayName: null // NeonAuth might not have display name initially
    };
    
    console.log('🧪 Mock user data:', mockUser);
    
    console.log('\n📊 Step 2: Test upsert logic from createUserProfile()');
    
    // This is the exact logic from app/actions.ts createUserProfile()
    const profile = await prisma.profile.upsert({
      where: { neonAuthUserId: mockUser.id },
      update: {
        // Update only essential fields to avoid unnecessary writes
        lastActivityAt: new Date(),
        email: mockUser.primaryEmail,
        displayName: mockUser.displayName || mockUser.primaryEmail
      },
      create: {
        neonAuthUserId: mockUser.id,
        email: mockUser.primaryEmail,
        displayName: mockUser.displayName || mockUser.primaryEmail,
        tier: "FREE",
        role: "MEMBER",
        trialActive: true,
        quotaUsed: 0,
        quotaLimit: 50,
      }
    });
    
    console.log('✅ Profile created/updated successfully!');
    console.log('📋 Profile details:', {
      id: profile.id,
      neonAuthUserId: profile.neonAuthUserId,
      email: profile.email,
      displayName: profile.displayName,
      tier: profile.tier,
      trialActive: profile.trialActive
    });
    
    console.log('\n📊 Step 3: Verify profile exists in database');
    const foundProfile = await prisma.profile.findUnique({
      where: { email: 'testinguser@email.com' }
    });
    
    if (foundProfile) {
      console.log('✅ Profile found in database after creation!');
      return { success: true, created: true, profile: foundProfile };
    } else {
      console.log('❌ Profile not found even after creation - database issue?');
      return { success: false, error: 'Profile creation failed' };
    }
    
  } catch (error) {
    console.error('💥 Error in createUserProfile simulation:', error);
    
    if (error.code === 'P2002') {
      console.log('🔄 Unique constraint violation - profile might already exist');
    } else if (error.code === 'P1001') {
      console.log('🔌 Database connection error');
    } else if (error.code === 'P2025') {
      console.log('🔍 Record not found for update');
    }
    
    return { success: false, error: error.message, code: error.code };
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug
debugCreateProfile().then(result => {
  console.log('\n=== PROFILE CREATION DEBUG RESULT ===');
  if (result.success) {
    console.log('🎉 SUCCESS: Profile creation logic works!');
    console.log('✅ Database schema and operations are correct');
    console.log('🤔 This means the issue is likely:');
    console.log('   - NeonAuth user data not being passed correctly');
    console.log('   - Server action not being called during signup flow');
    console.log('   - Environment variables not loaded in server context');
  } else {
    console.log('❌ FAILURE: Profile creation logic has issues');
    console.log('🐛 Error:', result.error);
    console.log('🐛 Code:', result.code);
    console.log('🔧 This indicates a fundamental problem with:');
    console.log('   - Database schema/constraints');
    console.log('   - Prisma configuration');
    console.log('   - Database permissions');
  }
}).catch(error => {
  console.error('💥 Fatal error:', error);
});