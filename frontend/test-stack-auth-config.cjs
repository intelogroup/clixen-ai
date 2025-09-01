async function testStackAuthConfig() {
  console.log('🔍 Testing Stack Auth configuration...');
  
  const projectId = '9a382a23-2903-4653-b4e5-ee032cec183b';
  const clientKey = 'pck_1q71129623yjqedeqrmkbs3r29t2tkse6ffta17k1seqr';
  
  try {
    // Test Stack Auth project configuration
    const projectUrl = `https://api.stack-auth.com/api/v1/projects/current`;
    
    console.log('📍 Fetching project configuration...');
    const response = await fetch(projectUrl, {
      headers: {
        'x-stack-project-id': projectId,
        'x-stack-publishable-client-key': clientKey,
        'x-stack-access-type': 'client',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📍 Response status: ${response.status}`);
    
    if (response.ok) {
      const projectData = await response.json();
      console.log('✅ Project configuration:', JSON.stringify(projectData, null, 2));
      
      // Check available auth methods
      if (projectData.config && projectData.config.auth_methods) {
        console.log('📍 Available auth methods:', projectData.config.auth_methods);
      }
    } else {
      const errorText = await response.text();
      console.error('❌ Failed to fetch project config:', errorText);
    }
    
    // Test if we can create a user with email/password directly
    console.log('\n📍 Testing email/password signup endpoint...');
    const signupUrl = 'https://api.stack-auth.com/api/v1/auth/signup/email';
    
    const testEmail = `test-direct-${Date.now()}@test.com`;
    const testPassword = 'TestPassword123!';
    
    const signupResponse = await fetch(signupUrl, {
      method: 'POST',
      headers: {
        'x-stack-project-id': projectId,
        'x-stack-publishable-client-key': clientKey,
        'x-stack-access-type': 'client',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    
    console.log(`📍 Signup response status: ${signupResponse.status}`);
    
    if (signupResponse.ok) {
      const signupData = await signupResponse.json();
      console.log('✅ Email/password signup successful!', signupData);
    } else {
      const errorData = await signupResponse.text();
      console.log('❌ Email/password signup failed:', errorData);
      
      // Check if it's a method not enabled error
      if (signupResponse.status === 400 || signupResponse.status === 422) {
        console.log('💡 This might mean email/password auth is disabled in Stack Auth project settings');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testStackAuthConfig().catch(console.error);