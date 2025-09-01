async function testPasswordEndpoints() {
  console.log('🔍 Testing Stack Auth password-related signup endpoints...');
  
  const projectId = '9a382a23-2903-4653-b4e5-ee032cec183b';
  const clientKey = 'pck_1q71129623yjqedeqrmkbs3r29t2tkse6ffta17k1seqr';

  const testEmail = `test-pwd-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  
  const endpoints = [
    // Based on documentation patterns
    'https://api.stack-auth.com/api/v1/auth/password/sign-up',
    'https://api.stack-auth.com/api/v1/auth/password/signup',
    'https://api.stack-auth.com/api/v1/auth/credentials/sign-up',
    'https://api.stack-auth.com/api/v1/auth/email-password/signup',
    'https://api.stack-auth.com/api/v1/signup',
    'https://api.stack-auth.com/api/v1/auth/sign-up',
    'https://api.stack-auth.com/api/v1/users/create',
    // Try without 'auth' prefix
    'https://api.stack-auth.com/api/v1/password/sign-up',
    'https://api.stack-auth.com/api/v1/password/signup',
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n📍 Testing endpoint: ${endpoint}`);
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-stack-project-id': projectId,
          'x-stack-publishable-client-key': clientKey,
          'x-stack-access-type': 'client'
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword
        })
      });
      
      console.log(`  Response: ${response.status}`);
      
      if (response.status === 200 || response.status === 201) {
        console.log('✅ SUCCESS! Found working endpoint!');
        const responseData = await response.json();
        console.log('  Response data:', JSON.stringify(responseData, null, 2));
        break;
      } else if (response.status === 400) {
        const errorData = await response.json();
        console.log('⚠️  400 error (might be validation):', JSON.stringify(errorData, null, 2));
      } else if (response.status === 404) {
        console.log('❌ 404 - endpoint does not exist');
      } else {
        const errorText = await response.text();
        console.log(`  Error: ${errorText.substring(0, 300)}`);
      }
      
    } catch (error) {
      console.log(`  Network error: ${error.message}`);
    }
  }
  
  // Also check what methods are available
  console.log('\n📍 Testing available methods on /api/v1/auth...');
  try {
    const response = await fetch('https://api.stack-auth.com/api/v1/auth', {
      method: 'OPTIONS',
      headers: {
        'x-stack-project-id': projectId,
        'x-stack-publishable-client-key': clientKey,
        'x-stack-access-type': 'client'
      }
    });
    
    console.log(`OPTIONS response: ${response.status}`);
    if (response.ok) {
      const allowHeader = response.headers.get('allow');
      console.log(`Allowed methods: ${allowHeader}`);
    }
  } catch (error) {
    console.log(`OPTIONS request failed: ${error.message}`);
  }
}

testPasswordEndpoints().catch(console.error);