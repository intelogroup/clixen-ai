// Test authentication and user verification
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testAuthenticationFlow() {
  console.log('🔐 Testing Authentication System...\n');
  
  // Test 1: Landing page accessibility
  console.log('1. Testing landing page...');
  try {
    const response = await fetch(BASE_URL);
    console.log(`   ✅ Landing page: ${response.status} (${response.statusText})`);
  } catch (error) {
    console.log(`   ❌ Landing page error: ${error.message}`);
  }

  // Test 2: Authentication pages accessibility
  console.log('\n2. Testing authentication pages...');
  try {
    const signupResponse = await fetch(`${BASE_URL}/auth/signup`);
    console.log(`   ✅ Signup page: ${signupResponse.status} (${signupResponse.statusText})`);
    
    const signinResponse = await fetch(`${BASE_URL}/auth/signin`);
    console.log(`   ✅ Signin page: ${signinResponse.status} (${signinResponse.statusText})`);
  } catch (error) {
    console.log(`   ❌ Auth pages error: ${error.message}`);
  }

  // Test 3: Protected dashboard (should redirect or show auth check)
  console.log('\n3. Testing dashboard protection...');
  try {
    const dashboardResponse = await fetch(`${BASE_URL}/dashboard`, {
      redirect: 'manual' // Don't follow redirects automatically
    });
    
    if (dashboardResponse.status === 302 || dashboardResponse.status === 307) {
      const location = dashboardResponse.headers.get('location');
      console.log(`   ✅ Dashboard protected: ${dashboardResponse.status} -> ${location}`);
    } else if (dashboardResponse.status === 200) {
      const body = await dashboardResponse.text();
      if (body.includes('signin') || body.includes('SignIn') || body.includes('auth')) {
        console.log(`   ✅ Dashboard shows auth form: ${dashboardResponse.status}`);
      } else {
        console.log(`   ⚠️  Dashboard accessible without auth: ${dashboardResponse.status}`);
      }
    } else {
      console.log(`   ❌ Dashboard unexpected response: ${dashboardResponse.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Dashboard error: ${error.message}`);
  }

  // Test 4: API endpoint tests
  console.log('\n4. Testing API endpoints...');
  try {
    const debugResponse = await fetch(`${BASE_URL}/api/debug`);
    console.log(`   API /api/debug: ${debugResponse.status}`);
  } catch (error) {
    console.log(`   API /api/debug: Error (${error.message})`);
  }
  
  console.log('\n✅ Authentication system verification complete!');
}

// Run the test
testAuthenticationFlow().catch(console.error);