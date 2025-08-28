require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyTester13() {
  try {
    console.log('Verifying Tester13@email.com in Neon database...\n');
    
    // Query for the specific user
    const user = await prisma.profile.findUnique({
      where: {
        email: 'Tester13@email.com'
      }
    });
    
    if (user) {
      console.log('✅ USER FOUND IN NEON DATABASE - PROFILES TABLE');
      console.log('================================================');
      console.log('Email:', user.email);
      console.log('Password: Jimkali90#235 (Note: Password stored in Stack Auth, not in profiles table)');
      console.log('\nDatabase Record Details:');
      console.log('- Profile ID:', user.id);
      console.log('- NeonAuth User ID:', user.neonAuthUserId);
      console.log('- Display Name:', user.displayName);
      console.log('- Account Tier:', user.tier);
      console.log('- Trial Status:', user.trialActive ? 'Active' : 'Inactive');
      console.log('- Trial Started:', user.trialStartedAt);
      console.log('- Trial Expires:', user.trialExpiresAt);
      console.log('- Quota Used:', user.quotaUsed, 'of', user.quotaLimit, 'requests');
      console.log('- Created At:', user.createdAt);
      console.log('- Updated At:', user.updatedAt);
      console.log('================================================');
      
      // Count total users
      const totalUsers = await prisma.profile.count();
      console.log(`\nTotal users in database: ${totalUsers}`);
      
    } else {
      console.log('❌ User Tester13@email.com NOT found in database');
    }
    
  } catch (error) {
    console.error('Error querying database:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyTester13();