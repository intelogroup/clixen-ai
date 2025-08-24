import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.log('URL:', supabaseUrl ? 'Found' : 'Missing')
  console.log('Service Key:', supabaseServiceKey ? 'Found' : 'Missing')
  process.exit(1)
}

console.log('🔗 Testing Supabase connection...')
console.log('URL:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testConnection() {
  try {
    console.log('\n📊 Testing database connection...')
    
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (connectionError) {
      console.error('❌ Connection failed:', connectionError.message)
      return false
    }
    
    console.log('✅ Database connection successful!')
    
    // List all tables in public schema
    console.log('\n📋 Checking database schema...')
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_list')
      .then(async (result) => {
        if (result.error) {
          // Fallback: try to query pg_tables directly
          return await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
        }
        return result
      })
    
    if (tablesError) {
      console.log('⚠️  Could not fetch table list:', tablesError.message)
      console.log('Trying direct table checks...')
      
      // Check specific tables we know should exist
      const tablesToCheck = ['profiles', 'usage_logs', 'telegram_temp_users', 'user_audit_log']
      
      for (const table of tablesToCheck) {
        try {
          const { error } = await supabase
            .from(table)
            .select('*')
            .limit(1)
          
          if (error) {
            console.log(`❌ Table '${table}': ${error.message}`)
          } else {
            console.log(`✅ Table '${table}': Found`)
          }
        } catch (err) {
          console.log(`❌ Table '${table}': ${err.message}`)
        }
      }
    } else {
      console.log('✅ Tables found:', tables?.map(t => t.table_name || t).slice(0, 10))
    }
    
    // Test creating a user
    console.log('\n👤 Testing user creation...')
    
    const testEmail = 'test@clixen.app'
    const testPassword = 'TestPassword123!'
    
    // Check if test user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', testEmail)
      .single()
    
    if (existingUser) {
      console.log('✅ Test user already exists:', existingUser.email)
      console.log('   - User ID:', existingUser.id)
      console.log('   - Tier:', existingUser.tier)
      console.log('   - Trial Active:', existingUser.trial_active)
      console.log('   - Credits Used:', existingUser.quota_used || 0)
      console.log('   - Credits Limit:', existingUser.quota_limit || 50)
    } else {
      console.log('🔨 Creating test user...')
      
      // Create auth user first
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true
      })
      
      if (authError) {
        console.error('❌ Auth user creation failed:', authError.message)
      } else {
        console.log('✅ Auth user created:', authUser.user.id)
        
        // Create profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authUser.user.id,
            auth_user_id: authUser.user.id,
            email: testEmail,
            tier: 'free',
            trial_active: true,
            trial_started_at: new Date().toISOString(),
            trial_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            quota_used: 0,
            quota_limit: 50
          })
          .select()
          .single()
        
        if (profileError) {
          console.error('❌ Profile creation failed:', profileError.message)
        } else {
          console.log('✅ Test user profile created!')
          console.log('   - Email:', profile.email)
          console.log('   - Trial expires:', profile.trial_expires_at)
        }
      }
    }
    
    console.log('\n🎉 Supabase connection test completed!')
    return true
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return false
  }
}

testConnection().then((success) => {
  process.exit(success ? 0 : 1)
})
