async function disableOAuthInProject() {
  console.log('🔧 Attempting to disable OAuth in Stack Auth project...');
  
  const projectId = '9a382a23-2903-4653-b4e5-ee032cec183b';
  const serverKey = 'ssk_dvwz56wxp5x3eqxq4swz44s8gm16vsrjxzvb4j88jd6a8';  // Server key for admin operations
  
  try {
    // First, let's check current project config with admin access
    console.log('📍 Checking current project config with server key...');
    const getCurrentConfigUrl = `https://api.stack-auth.com/api/v1/projects/current`;
    
    const currentResponse = await fetch(getCurrentConfigUrl, {
      headers: {
        'x-stack-project-id': projectId,
        'x-stack-secret-server-key': serverKey,
        'x-stack-access-type': 'server',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📍 Current config response: ${currentResponse.status}`);
    
    if (currentResponse.ok) {
      const currentConfig = await currentResponse.json();
      console.log('📍 Current project config:', JSON.stringify(currentConfig, null, 2));
      
      // Check if we can update the project config to disable OAuth
      console.log('\n🔧 Attempting to update project to disable OAuth...');
      const updateUrl = `https://api.stack-auth.com/api/v1/projects/current`;
      
      const updatePayload = {
        config: {
          ...currentConfig.config,
          enabled_oauth_providers: [], // Disable all OAuth providers
          credential_enabled: true,
          sign_up_enabled: true
        }
      };
      
      const updateResponse = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          'x-stack-project-id': projectId,
          'x-stack-secret-server-key': serverKey,
          'x-stack-access-type': 'server',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatePayload)
      });
      
      console.log(`📍 Update response: ${updateResponse.status}`);
      
      if (updateResponse.ok) {
        const updateResult = await updateResponse.json();
        console.log('✅ Project updated successfully!', updateResult);
      } else {
        const errorText = await updateResponse.text();
        console.log('❌ Failed to update project:', errorText);
      }
      
    } else {
      const errorText = await currentResponse.text();
      console.error('❌ Failed to get project config:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Operation failed:', error.message);
  }
}

disableOAuthInProject().catch(console.error);