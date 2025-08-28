// Debug database query using CommonJS
const { PrismaClient } = require('@prisma/client');

// Set environment variables
process.env.DATABASE_URL = "postgresql://neondb_owner:npg_t3OGhafQiub2@ep-odd-moon-ade1z4vk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
process.env.DATABASE_URL_UNPOOLED = "postgresql://neondb_owner:npg_t3OGhafQiub2@ep-odd-moon-ade1z4vk.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function debugDatabaseQuery() {
  try {
    console.log('🔍 DEBUG: Testing database connection...');
    
    // Test basic connection
    console.log('📊 Step 1: Testing database connection');
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful!');
    
    // Check all tables exist
    console.log('\n📊 Step 2: Checking database tables');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log('📋 Available tables:', tables.map(t => t.table_name));
    
    // Count total profiles
    console.log('\n📊 Step 3: Counting total profiles');
    const profileCount = await prisma.profile.count();
    console.log(`📊 Total profiles in database: ${profileCount}`);
    
    if (profileCount === 0) {
      console.log('⚠️  No profiles found in database');
      return { success: false, error: 'No profiles in database' };
    }
    
    // List all profiles
    console.log('\n📊 Step 4: Listing all profiles');
    const allProfiles = await prisma.profile.findMany({
      select: {
        id: true,
        neonAuthUserId: true,
        email: true,
        displayName: true,
        tier: true,
        trialActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📋 Found ${allProfiles.length} profile(s):`);
    allProfiles.forEach((profile, index) => {
      console.log(`  ${index + 1}. ID: ${profile.id}`);
      console.log(`     NeonAuth ID: ${profile.neonAuthUserId}`);
      console.log(`     Email: ${profile.email}`);
      console.log(`     Display Name: ${profile.displayName || 'Not set'}`);
      console.log(`     Tier: ${profile.tier}`);
      console.log(`     Trial Active: ${profile.trialActive}`);
      console.log(`     Created: ${profile.createdAt}`);
      console.log('');
    });
    
    // Search specifically for testinguser@email.com
    console.log('\n📊 Step 5: Searching for testinguser@email.com');
    const testUser = await prisma.profile.findUnique({
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
    
    if (testUser) {
      console.log('✅ FOUND: testinguser@email.com in database!');
      console.log('👤 User Details:');
      console.log(`   Profile ID: ${testUser.id}`);
      console.log(`   NeonAuth ID: ${testUser.neonAuthUserId}`);
      console.log(`   Email: ${testUser.email}`);
      console.log(`   Display Name: ${testUser.displayName || 'Not set'}`);
      console.log(`   Tier: ${testUser.tier}`);
      console.log(`   Trial Active: ${testUser.trialActive}`);
      console.log(`   Trial Started: ${testUser.trialStartedAt}`);
      console.log(`   Trial Expires: ${testUser.trialExpiresAt}`);
      console.log(`   Quota: ${testUser.quotaUsed}/${testUser.quotaLimit}`);
      console.log(`   Created: ${testUser.createdAt}`);
      console.log(`   Updated: ${testUser.updatedAt}`);
      
      // Calculate days remaining
      if (testUser.trialExpiresAt) {
        const now = new Date();
        const expires = new Date(testUser.trialExpiresAt);
        const daysLeft = Math.ceil((expires - now) / (1000 * 60 * 60 * 24));
        console.log(`   Trial Days Left: ${daysLeft} days`);
      }
      
      return { success: true, user: testUser, found: true };
    } else {
      console.log('❌ testinguser@email.com NOT FOUND in database');
      
      // Check if there are any profiles with similar emails
      const similarEmails = await prisma.profile.findMany({
        where: {
          email: { contains: 'testing' }
        },
        select: { email: true, createdAt: true }
      });
      
      if (similarEmails.length > 0) {
        console.log('🔍 Found similar emails:', similarEmails);
      }
      
      return { success: false, error: 'Test user not found', found: false };
    }
    
  } catch (error) {
    console.error('💥 Database query error:', error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug
debugDatabaseQuery().then(result => {
  console.log('\n=== DEBUG RESULT ===');
  if (result.success && result.found) {
    console.log('🎉 SUCCESS: Test user found in database!');
    console.log('✅ NeonAuth signup process worked correctly');
    console.log('✅ Database integration is functioning properly');
  } else if (result.success && !result.found) {
    console.log('⚠️  WARNING: Database is working but test user not found');
    console.log('❓ This could mean:');
    console.log('   - User creation failed silently');
    console.log('   - User was created with different email');
    console.log('   - Database transaction was rolled back');
  } else {
    console.log('❌ ERROR: Database connection or query failed');
    console.log('🐛 Error:', result.error);
  }
}).catch(error => {
  console.error('💥 Fatal error:', error);
});