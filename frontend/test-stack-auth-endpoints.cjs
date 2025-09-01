async function testStackAuthEndpoints() {
  console.log('🔍 Testing various Stack Auth API endpoints...');
  
  const projectId = '9a382a23-2903-4653-b4e5-ee032cec183b';
  const clientKey = 'pck_1q71129623yjqedeqrmkbs3r29t2tkse6ffta17k1seqr';
  const serverKey = 'ssk_dvwz56wxp5x3eqxq4swz44s8gm16vsrjxzvb4j88jd6a8';

  const testEmail = `test-endpoints-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  
  const endpoints = [
    // Common signup endpoint patterns
    'https://api.stack-auth.com/api/v1/auth/signup',
    'https://api.stack-auth.com/api/v1/users',
    'https://api.stack-auth.com/api/v1/auth/register',
    'https://api.stack-auth.com/api/v1/auth/signup/password',
    'https://api.stack-auth.com/api/v1/auth/signup/email-password',
    'https://api.stack-auth.com/api/v1/auth/credentials/signup',
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n📍 Testing endpoint: ${endpoint}`);
    
    try {
      // Try with client access type
      const clientResponse = await fetch(endpoint, {
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
      
      console.log(`  Client access: ${clientResponse.status}`);
      if (!clientResponse.ok && clientResponse.status !== 405) {
        const errorText = await clientResponse.text();
        console.log(`  Client error: ${errorText.substring(0, 200)}`);
      }
      
      // Try with server access type if client failed
      if (!clientResponse.ok) {
        const serverResponse = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-stack-project-id': projectId,
            'x-stack-secret-server-key': serverKey,
            'x-stack-access-type': 'server'
          },
          body: JSON.stringify({
            email: testEmail,
            password: testPassword
          })
        });
        
        console.log(`  Server access: ${serverResponse.status}`);
        if (!serverResponse.ok && serverResponse.status !== 405) {
          const errorText = await serverResponse.text();
          console.log(`  Server error: ${errorText.substring(0, 200)}`);
        }
      }
      
    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }
  }
  
  // Also try to find documentation about signup endpoints
  console.log('\n📍 Looking for API documentation...');
  
  try {
    const docsResponse = await fetch('https://api.stack-auth.com/api/v1/', {
      headers: {
        'x-stack-project-id': projectId,
        'x-stack-publishable-client-key': clientKey,
        'x-stack-access-type': 'client'
      }
    });
    
    console.log(`📍 API root response: ${docsResponse.status}`);
    if (docsResponse.ok) {
      const docsText = await docsResponse.text();
      console.log(`📍 API root content preview: ${docsText.substring(0, 500)}`);
    }
  } catch (error) {
    console.log(`📍 API root error: ${error.message}`);
  }
}

testStackAuthEndpoints().catch(console.error);