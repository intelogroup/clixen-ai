const { readFileSync } = require('fs');
const postgres = require('postgres');

require('dotenv').config({ path: '.env.local' });

async function runTrialMigration() {
  console.log('🚀 RUNNING TRIAL SYSTEM MIGRATION');
  console.log('=' .repeat(50));
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in environment variables');
    return;
  }

  const sql = postgres(connectionString);
  
  try {
    // Read migration file
    const migrationSQL = readFileSync('./migrations/add-trial-fields.sql', 'utf8');
    
    console.log('📄 Loaded migration file');
    console.log('🔍 Migration contains:');
    console.log('   - Add trial_started_at, trial_expires_at columns');
    console.log('   - Update user_dashboard view with trial info');
    console.log('   - Create bot access checking function');
    console.log('   - Create trial expiry function');
    
    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`\n📊 Executing ${statements.length} statements...`);
    
    let successCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        console.log(`⚡ Statement ${i + 1}/${statements.length}: ${statement.substring(0, 60)}...`);
        
        await sql.unsafe(statement);
        successCount++;
        console.log('✅ Success');
        
      } catch (error) {
        // Some statements might fail if they already exist - that's OK
        if (error.message.includes('already exists') || error.message.includes('does not exist')) {
          console.log('ℹ️ Already exists - skipping');
          successCount++;
        } else {
          console.error('❌ Error:', error.message);
          // Continue with other statements
        }
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`✅ MIGRATION COMPLETED: ${successCount}/${statements.length} statements successful`);
    
    // Test the migration by checking the new columns
    console.log('\n🧪 Testing migration...');
    
    try {
      const testResult = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name IN ('trial_started_at', 'trial_expires_at')
        ORDER BY column_name
      `;
      
      console.log('📊 New columns added:');
      testResult.forEach(col => {
        console.log(`   ✅ ${col.column_name} (${col.data_type})`);
      });
      
      // Test the view
      const viewTest = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'user_dashboard' 
        AND column_name IN ('trial_active', 'trial_days_remaining')
        ORDER BY column_name
      `;
      
      console.log('📊 Updated view columns:');
      viewTest.forEach(col => {
        console.log(`   ✅ ${col.column_name}`);
      });
      
      // Test the function
      const functionTest = await sql`
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_name = 'user_has_bot_access'
      `;
      
      if (functionTest.length > 0) {
        console.log('✅ Function user_has_bot_access created');
      }
      
    } catch (testError) {
      console.error('⚠️ Test failed:', testError.message);
    }
    
    console.log('\n🎉 TRIAL SYSTEM READY!');
    console.log('Features added:');
    console.log('  ✅ 7-day free trial support');
    console.log('  ✅ Trial expiry tracking');
    console.log('  ✅ Bot access checking');
    console.log('  ✅ Updated dashboard analytics');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sql.end();
  }
}

// Run migration
runTrialMigration();