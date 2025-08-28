require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('Connecting to Neon database...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Found' : 'Not found');
    
    // Count total users
    const userCount = await prisma.profile.count();
    console.log(`\nTotal users in profiles table: ${userCount}`);
    
    // Check for specific user
    const testUser = await prisma.profile.findUnique({
      where: {
        email: 'Tester13@email.com'
      }
    });
    
    if (testUser) {
      console.log('\n✅ User found in database!');
      console.log('User details:');
      console.log('- ID:', testUser.id);
      console.log('- Email:', testUser.email);
      console.log('- Display Name:', testUser.displayName);
      console.log('- NeonAuth User ID:', testUser.neonAuthUserId);
      console.log('- Tier:', testUser.tier);
      console.log('- Trial Active:', testUser.trialActive);
      console.log('- Trial Started:', testUser.trialStartedAt);
      console.log('- Trial Expires:', testUser.trialExpiresAt);
      console.log('- Telegram Linked:', testUser.telegramChatId ? 'Yes' : 'No');
      console.log('- Quota Used:', testUser.quotaUsed, '/', testUser.quotaLimit);
    } else {
      console.log('\n❌ User Tester13@email.com not found in database');
    }
    
    // List all users (if any)
    if (userCount > 0) {
      console.log('\n📋 All users in database:');
      const allUsers = await prisma.profile.findMany({
        select: {
          id: true,
          email: true,
          displayName: true,
          neonAuthUserId: true,
          tier: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      allUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.email}`);
        console.log(`   - ID: ${user.id}`);
        console.log(`   - NeonAuth ID: ${user.neonAuthUserId}`);
        console.log(`   - Name: ${user.displayName || 'Not set'}`);
        console.log(`   - Tier: ${user.tier}`);
        console.log(`   - Created: ${user.createdAt}`);
      });
    } else {
      console.log('\n📋 No users found in the database');
    }
    
  } catch (error) {
    console.error('Database error:', error.message);
    if (error.code === 'P2021') {
      console.log('\n⚠️ The profiles table might not exist. Running prisma migration...');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();