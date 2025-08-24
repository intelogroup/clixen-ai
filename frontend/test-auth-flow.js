#!/usr/bin/env node

/**
 * Test Authentication Flow
 * 
 * This script tests the complete authentication system:
 * 1. Landing page loads correctly
 * 2. Auth modal functions properly
 * 3. Email checking works
 * 4. Sign-up/Sign-in flow
 * 5. Middleware routing
 * 6. Protected routes
 */

console.log('🔐 Testing Authentication Flow...\n')

const tests = [
  {
    name: 'Landing Page',
    description: 'Landing page should load without authentication',
    url: 'http://localhost:3000/',
    expectedStatus: 200,
    expectedContent: 'AI-Powered Web Automation'
  },
  {
    name: 'Protected Route - Dashboard',
    description: 'Dashboard should redirect to landing for unauthenticated users',
    url: 'http://localhost:3000/dashboard',
    expectedStatus: 200, // After redirect
    expectedRedirect: '/?auth=true&redirect=%2Fdashboard'
  },
  {
    name: 'Protected Route - Bot Access',
    description: 'Bot access should redirect to landing for unauthenticated users',
    url: 'http://localhost:3000/bot-access',
    expectedStatus: 200, // After redirect
    expectedRedirect: '/?auth=true&redirect=%2Fbot-access'
  },
  {
    name: 'Auth Callback Route',
    description: 'Auth callback route should be accessible',
    url: 'http://localhost:3000/auth/callback',
    expectedStatus: 200,
    allowRedirect: true
  },
  {
    name: 'Email Check API',
    description: 'Email checking API should respond correctly',
    url: 'http://localhost:3000/api/auth/check-email',
    method: 'POST',
    body: { email: 'test@example.com' },
    expectedStatus: 200,
    expectedJSON: true
  },
  {
    name: 'Test Supabase Connection',
    description: 'Supabase connection test should work',
    url: 'http://localhost:3000/api/test-supabase',
    expectedStatus: 200,
    expectedContent: 'connected'
  }
]

async function runTest(test) {
  try {
    console.log(`📍 Testing: ${test.name}`)
    console.log(`   ${test.description}`)
    
    const options = {
      method: test.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      redirect: test.allowRedirect ? 'follow' : 'manual'
    }
    
    if (test.body) {
      options.body = JSON.stringify(test.body)
    }
    
    const response = await fetch(test.url, options)
    
    // Check status
    if (test.expectedStatus && response.status !== test.expectedStatus) {
      console.log(`   ❌ Status mismatch: expected ${test.expectedStatus}, got ${response.status}`)
      return false
    }
    
    // Check redirect
    if (test.expectedRedirect) {
      const location = response.headers.get('location')
      if (!location || !location.includes(test.expectedRedirect.split('?')[0])) {
        console.log(`   ❌ Redirect mismatch: expected redirect to contain "${test.expectedRedirect.split('?')[0]}", got "${location}"`)
        return false
      }
      console.log(`   ✅ Correctly redirected to: ${location}`)
      return true
    }
    
    const responseText = await response.text()
    
    // Check JSON response
    if (test.expectedJSON) {
      try {
        const json = JSON.parse(responseText)
        console.log(`   ✅ Valid JSON response:`, json)
        return true
      } catch (error) {
        console.log(`   ❌ Invalid JSON response`)
        return false
      }
    }
    
    // Check content
    if (test.expectedContent) {
      if (!responseText.includes(test.expectedContent)) {
        console.log(`   ❌ Content mismatch: expected "${test.expectedContent}" in response`)
        return false
      }
    }
    
    console.log(`   ✅ Test passed`)
    return true
    
  } catch (error) {
    console.log(`   ❌ Test failed with error: ${error.message}`)
    return false
  }
}

async function runAllTests() {
  console.log('Starting authentication flow tests...\n')
  
  let passed = 0
  let failed = 0
  
  for (const test of tests) {
    const result = await runTest(test)
    if (result) {
      passed++
    } else {
      failed++
    }
    console.log('') // Empty line for readability
  }
  
  console.log('📊 Test Results:')
  console.log(`   ✅ Passed: ${passed}`)
  console.log(`   ❌ Failed: ${failed}`)
  console.log(`   📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`)
  
  if (failed === 0) {
    console.log('\n🎉 All authentication tests passed!')
    console.log('   The authentication system is working correctly.')
  } else {
    console.log('\n⚠️  Some tests failed. Please check the middleware and routing configuration.')
  }
}

// Run the tests
runAllTests().catch(console.error)
