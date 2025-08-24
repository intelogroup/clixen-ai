const postgres = require('postgres');

require('dotenv').config({ path: '.env.local' });

async function fixTrialViewCorrected() {
  console.log('🔧 FIXING TRIAL VIEW (CORRECTED)');
  console.log('=' .repeat(40));
  
  const connectionString = process.env.DATABASE_URL;
  const sql = postgres(connectionString);
  
  try {
    // Drop and recreate view with correct structure
    console.log('1. Dropping old view...');
    await sql`DROP VIEW IF EXISTS user_dashboard`;
    
    console.log('2. Creating new view with correct column names...');
    await sql`
      CREATE VIEW user_dashboard AS
      SELECT 
          p.id,
          p.email,
          p.full_name,
          p.tier,
          p.credits_remaining,
          p.api_key,
          p.onboarding_completed,
          p.created_at,
          p.updated_at,
          p.trial_started_at,
          p.trial_expires_at,
          CASE 
              WHEN p.trial_started_at IS NOT NULL AND p.trial_expires_at > NOW() THEN true
              ELSE false
          END AS trial_active,
          CASE 
              WHEN p.trial_expires_at IS NOT NULL THEN 
                  GREATEST(0, EXTRACT(day FROM p.trial_expires_at - NOW())::INTEGER)
              ELSE 0
          END AS trial_days_remaining,
          COALESCE(SUM(CASE WHEN we.status = 'completed' THEN 1 ELSE 0 END), 0) as successful_executions,
          COALESCE(COUNT(we.id), 0) as total_executions,
          0 as documents_analyzed,
          COALESCE(SUM(we.credits_consumed), 0) as total_credits_spent
      FROM profiles p
      LEFT JOIN workflow_executions we ON p.id = we.user_id
      GROUP BY 
          p.id, p.email, p.full_name, p.tier, p.credits_remaining, 
          p.api_key, p.onboarding_completed, p.created_at, p.updated_at,
          p.trial_started_at, p.trial_expires_at
    `;
    console.log('✅ View created successfully');
    
    // Test the view
    console.log('3. Testing view...');
    const viewTest = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'user_dashboard' 
      AND column_name IN ('trial_active', 'trial_days_remaining', 'trial_started_at', 'trial_expires_at')
      ORDER BY column_name
    `;
    
    console.log('📊 Trial columns in view:');
    viewTest.forEach(col => {
      console.log(`   ✅ ${col.column_name} (${col.data_type})`);
    });
    
    // Test a query
    console.log('4. Testing query...');
    const testQuery = await sql`
      SELECT id, email, tier, trial_active, trial_days_remaining 
      FROM user_dashboard 
      WHERE tier = 'free'
      LIMIT 3
    `;
    
    console.log(`📊 Found ${testQuery.length} free tier users`);
    testQuery.forEach(user => {
      console.log(`   👤 ${user.email}: trial_active=${user.trial_active}, days_remaining=${user.trial_days_remaining}`);
    });
    
    console.log('\n🎉 TRIAL VIEW FIXED SUCCESSFULLY!');
    console.log('✅ Trial system fully operational');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sql.end();
  }
}

fixTrialViewCorrected();