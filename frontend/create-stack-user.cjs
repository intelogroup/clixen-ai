require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createUserDirectly() {
  try {
    console.log('Creating user directly in database...');
    
    // Create user profile directly in the database
    const newUser = await prisma.profile.create({
      data: {
        neonAuthUserId: 'manual-' + Date.now(), // Unique ID since we're bypassing Stack Auth
        email: 'Tester13@email.com',
        displayName: 'Test User 13',
        tier: 'FREE',
        trialActive: true,
        trialStartedAt: new Date(),
        trialExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        quotaUsed: 0,
        quotaLimit: 50
      }
    });
    
    console.log('\n✅ User created successfully!');
    console.log('User details:');
    console.log('- ID:', newUser.id);
    console.log('- Email:', newUser.email);
    console.log('- Display Name:', newUser.displayName);
    console.log('- NeonAuth User ID:', newUser.neonAuthUserId);
    console.log('- Tier:', newUser.tier);
    console.log('- Trial Active:', newUser.trialActive);
    console.log('- Trial Expires:', newUser.trialExpiresAt);
    console.log('- Quota Limit:', newUser.quotaLimit);
    
    // Verify the user exists
    const verification = await prisma.profile.findUnique({
      where: {
        email: 'Tester13@email.com'
      }
    });
    
    if (verification) {
      console.log('\n✅ Verification successful! User exists in profiles table.');
      console.log('Database record confirmed for:', verification.email);
    }
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('\n⚠️ User with email Tester13@email.com already exists in database');
      
      // Try to fetch existing user
      const existingUser = await prisma.profile.findUnique({
        where: {
          email: 'Tester13@email.com'
        }
      });
      
      if (existingUser) {
        console.log('\nExisting user details:');
        console.log('- ID:', existingUser.id);
        console.log('- Email:', existingUser.email);
        console.log('- Display Name:', existingUser.displayName);
        console.log('- Created:', existingUser.createdAt);
      }
    } else {
      console.error('Error creating user:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createUserDirectly();