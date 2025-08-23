const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabase() {
  console.log('🔍 Database Connection Test...');
  
  try {
    // Test connection with profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      console.error('❌ Profiles table error:', profilesError);
      return;
    }
    
    console.log('✅ Database connected successfully');
    console.log('📊 Total users in database:', profiles.length);
    console.log('');
    
    if (profiles.length > 0) {
      console.log('👥 Existing Users:');
      profiles.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email || 'No email'}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Tier: ${user.tier}`);
        console.log(`   Credits: ${user.credits}`);
        console.log(`   Stripe Customer: ${user.stripe_customer_id ? 'Yes' : 'No'}`);
        console.log(`   Created: ${user.created_at}`);
        console.log('');
      });
    } else {
      console.log('📝 No existing users found in database');
    }
    
    // Test other tables
    const { data: sessions } = await supabase.from('user_sessions').select('count');
    const { data: executions } = await supabase.from('workflow_executions').select('count');
    const { data: metrics } = await supabase.from('usage_metrics').select('count');
    
    console.log('📈 Database Table Stats:');
    console.log(`   Sessions: ${sessions?.length || 0}`);
    console.log(`   Executions: ${executions?.length || 0}`);
    console.log(`   Metrics: ${metrics?.length || 0}`);
    
  } catch (error) {
    console.error('💥 Database connection failed:', error.message);
  }
}

checkDatabase();