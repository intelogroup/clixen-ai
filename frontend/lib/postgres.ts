import postgres from 'postgres'

// Database connection using the connection string from environment
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// Create postgres connection
const sql = postgres(connectionString, {
  // Connection pool configuration
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Idle connection timeout in seconds
  connect_timeout: 10, // Connection timeout in seconds
  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

export default sql

// Helper function to test connection
export async function testConnection() {
  try {
    const result = await sql`SELECT NOW() as current_time, version() as version`
    console.log('✅ Database connection successful:', result[0])
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}

// Helper function to check if tables exist
export async function checkSchema() {
  try {
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    console.log('📋 Existing tables:', tables.map(t => t.table_name))
    return tables.map(t => t.table_name)
  } catch (error) {
    console.error('❌ Schema check failed:', error)
    return []
  }
}