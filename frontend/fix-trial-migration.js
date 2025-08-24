const postgres = require('postgres');

require('dotenv').config({ path: '.env.local' });

async function fixTrialMigration() {
  console.log('🔧 FIXING TRIAL MIGRATION');
  console.log('=' .repeat(40));
  
  const connectionString = process.env.DATABASE_URL;
  const sql = postgres(connectionString);
  
  try {
    // Add trial columns
    console.log('1. Adding trial columns...');
    await sql`
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP WITH TIME ZONE
    `;
    console.log('✅ Trial columns added');
    
    // Create indexes
    console.log('2. Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_profiles_trial_expires ON profiles(trial_expires_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_profiles_trial_started ON profiles(trial_started_at)`;
    console.log('✅ Indexes created');
    
    // Update user_dashboard view
    console.log('3. Updating user_dashboard view...');
    await sql`DROP VIEW IF EXISTS user_dashboard`;
    
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
          COALESCE(SUM(CASE WHEN da.status = 'completed' THEN 1 ELSE 0 END), 0) as documents_analyzed,
          COALESCE(SUM(we.credits_used), 0) as total_credits_spent
      FROM profiles p
      LEFT JOIN workflow_executions we ON p.id = we.user_id
      LEFT JOIN document_analytics da ON p.id = da.user_id
      GROUP BY 
          p.id, p.email, p.full_name, p.tier, p.credits_remaining, 
          p.api_key, p.onboarding_completed, p.created_at, p.updated_at,
          p.trial_started_at, p.trial_expires_at
    `;
    console.log('✅ View updated');
    
    // Test the migration
    console.log('4. Testing columns...');
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      AND column_name IN ('trial_started_at', 'trial_expires_at')
    `;
    
    console.log('📊 Trial columns:');
    columns.forEach(col => {
      console.log(`   ✅ ${col.column_name} (${col.data_type})`);
    });
    
    // Test view
    const viewCols = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_dashboard' 
      AND column_name IN ('trial_active', 'trial_days_remaining')
    `;
    
    console.log('📊 View columns:');
    viewCols.forEach(col => {
      console.log(`   ✅ ${col.column_name}`);
    });
    
    console.log('\n🎉 TRIAL SYSTEM MIGRATION SUCCESSFUL!');
    console.log('Ready for 7-day free trials!');
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
  } finally {
    await sql.end();
  }
}

fixTrialMigration();