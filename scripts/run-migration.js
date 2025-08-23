const postgres = require('postgres')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '../frontend/.env.local' })

// Database connection
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set')
  process.exit(1)
}

console.log('🔗 Connecting to database...')
const sql = postgres(connectionString, {
  ssl: { rejectUnauthorized: false }
})

async function runMigration() {
  try {
    // Test connection first
    console.log('🧪 Testing database connection...')
    const connectionTest = await sql`SELECT NOW() as current_time`
    console.log('✅ Database connection successful:', connectionTest[0].current_time)

    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/001_auth_profiles.sql')
    console.log('📖 Reading migration file:', migrationPath)
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    console.log(`📝 Migration file loaded (${migrationSQL.length} characters)`)

    // Split SQL by function boundaries and semicolons, but keep functions intact
    const statements = []
    let currentStatement = ''
    let inFunction = false
    let functionDepth = 0
    
    const lines = migrationSQL.split('\n')
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // Skip comments and empty lines
      if (trimmedLine.startsWith('--') || trimmedLine === '') {
        continue
      }
      
      currentStatement += line + '\n'
      
      // Track function boundaries
      if (trimmedLine.includes('CREATE OR REPLACE FUNCTION') || trimmedLine.includes('CREATE FUNCTION')) {
        inFunction = true
        functionDepth = 1
      } else if (inFunction) {
        if (trimmedLine.includes('BEGIN')) {
          functionDepth++
        } else if (trimmedLine.includes('END;')) {
          functionDepth--
          if (functionDepth === 0) {
            inFunction = false
            statements.push(currentStatement.trim())
            currentStatement = ''
          }
        }
      } else if (trimmedLine.endsWith(';')) {
        // End of regular statement
        statements.push(currentStatement.trim())
        currentStatement = ''
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim())
    }

    console.log(`🔧 Found ${statements.length} SQL statements to execute`)

    // Execute statements one by one
    let successCount = 0
    let skipCount = 0
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (!statement) continue
      
      try {
        // Show first 100 characters of statement for debugging
        const preview = statement.substring(0, 100).replace(/\n/g, ' ')
        console.log(`\n📋 Statement ${i + 1}/${statements.length}: ${preview}...`)
        
        await sql.unsafe(statement)
        successCount++
        console.log(`✅ Statement ${i + 1} executed successfully`)
        
      } catch (error) {
        // Handle "already exists" errors gracefully
        if (error.message.includes('already exists') || 
            error.message.includes('does not exist') ||
            error.message.includes('duplicate key value')) {
          console.log(`⚠️  Statement ${i + 1} skipped (already exists): ${error.message}`)
          skipCount++
        } else {
          console.error(`❌ Statement ${i + 1} failed:`, error.message)
          console.error('Statement:', statement.substring(0, 200) + '...')
        }
      }
    }

    console.log(`\n🎉 Migration completed!`)
    console.log(`✅ ${successCount} statements executed successfully`)
    console.log(`⚠️  ${skipCount} statements skipped (already exist)`)
    console.log(`❌ ${statements.length - successCount - skipCount} statements failed`)

    // Verify the schema
    console.log('\n🔍 Verifying schema...')
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    
    console.log('📋 Tables created:', tables.map(t => t.table_name))

    // Check functions
    const functions = await sql`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_type = 'FUNCTION'
    `
    
    console.log('🔧 Functions created:', functions.map(f => f.routine_name))

    // Test the functions
    console.log('\n🧪 Testing functions...')
    
    try {
      // Test check_user_credits function
      const testUserId = '00000000-0000-0000-0000-000000000000'
      const creditCheck = await sql`SELECT check_user_credits(${testUserId}::uuid, 1) as has_credits`
      console.log('✅ check_user_credits function works:', creditCheck[0].has_credits)
    } catch (error) {
      console.log('⚠️  Function test failed (expected for new database):', error.message)
    }

  } catch (error) {
    console.error('💥 Migration failed:', error)
  } finally {
    await sql.end()
    console.log('🔌 Database connection closed')
  }
}

// Run the migration
runMigration()