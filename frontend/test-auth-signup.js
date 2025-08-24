#!/usr/bin/env node

/**
 * Test Auth Signup Flow
 * Tests if the profile creation error is resolved
 */

console.log('🧪 Testing Auth Signup Flow...\n')

const testEmail = `test${Date.now()}@clixen.app`
const testPassword = 'TestPassword123!'

async function testSignup() {
  try {
    console.log(`📧 Testing signup with email: ${testEmail}`)
    
    // Test the auth signup endpoint
    const signupResponse = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: testEmail, 
        password: testPassword 
      })
    })
    
    const signupResult = await signupResponse.json()
    console.log('📝 Signup response:', signupResult)
    
    if (signupResult.error) {
      console.log('❌ Signup failed:', signupResult.error)
    } else {
      console.log('✅ Signup successful!')
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message)
  }
}

// Test database connection first
async function testDbConnection() {
  try {
    console.log('🔗 Testing database connection...')
    
    const response = await fetch('http://localhost:3000/api/test-supabase')
    const result = await response.json()
    
    console.log('📊 Database status:', result.success ? '✅ Connected' : '❌ Failed')
    
    if (result.data) {
      console.log('📋 Tables status:', result.data.tables)
      console.log('👤 Test user status:', result.data.testUser)
    }
    
    return result.success
    
  } catch (error) {
    console.error('💥 Database test failed:', error.message)
    return false
  }
}

// Run tests
testDbConnection()
  .then(dbOk => {
    if (dbOk) {
      console.log('\n🎯 Database connected, testing signup flow...\n')
      return testSignup()
    } else {
      console.log('❌ Database not available, skipping signup test')
    }
  })
  .catch(error => {
    console.error('💥 Test suite failed:', error.message)
  })
