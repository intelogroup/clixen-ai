// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function createTestUser() {
  console.log('🔧 Creating test user for authentication testing...');
  
  try {
    // Create a test user profile
    const testUserId = crypto.randomUUID();
    const testEmail = 'testuser@clixen.app';
    
    // Check if user already exists
    const existing = await prisma.profile.findUnique({
      where: { email: testEmail }
    });
    
    if (existing) {
      console.log('✅ Test user already exists:', testEmail);
      console.log('   User ID:', existing.neonAuthUserId);
      return existing;
    }
    
    // Create new test user
    const user = await prisma.profile.create({
      data: {
        neonAuthUserId: testUserId,
        email: testEmail,
        displayName: 'Test User',
        tier: 'FREE',
        trialActive: true,
        trialStartedAt: new Date(),
        trialExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        quotaUsed: 0,
        quotaLimit: 50,
        lastActivityAt: new Date(),
      }
    });
    
    console.log('✅ Test user created successfully!');
    console.log('   Email:', user.email);
    console.log('   User ID:', user.neonAuthUserId);
    console.log('   Trial expires:', user.trialExpiresAt);
    
    return user;
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTestUser().catch(console.error);