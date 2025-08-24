/**
 * Neon Data API utilities for REST-based database access
 */

const NEON_API_URL = process.env.NEON_DATA_API_URL || process.env.NEXT_PUBLIC_NEON_DATA_API_URL

if (!NEON_API_URL) {
  console.warn('⚠️ NEON_DATA_API_URL not configured')
}

interface NeonApiResponse<T = any> {
  data?: T[]
  error?: string
  status: number
}

class NeonAPI {
  private baseUrl: string

  constructor() {
    this.baseUrl = NEON_API_URL || ''
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<NeonApiResponse<T>> {
    try {
      console.log('🔗 [NEON API] Executing query:', sql.substring(0, 100) + '...')
      
      const response = await fetch(`${this.baseUrl}/v1/sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: sql,
          params
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        console.error('❌ [NEON API] Query failed:', data)
        return { 
          error: data.error || 'Database query failed', 
          status: response.status 
        }
      }

      console.log('✅ [NEON API] Query successful')
      return { 
        data: data.rows || data.result || data, 
        status: response.status 
      }
    } catch (error) {
      console.error('❌ [NEON API] Network error:', error)
      return { 
        error: error instanceof Error ? error.message : 'Network error', 
        status: 500 
      }
    }
  }

  // User management methods
  async createUser(userData: {
    id: string
    email: string
    full_name?: string
  }) {
    const sql = `
      INSERT INTO users (id, email, full_name, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *
    `
    return this.query(sql, [userData.id, userData.email, userData.full_name || null])
  }

  async getUserById(id: string) {
    const sql = `SELECT * FROM users WHERE id = $1`
    return this.query(sql, [id])
  }

  async getUserByEmail(email: string) {
    const sql = `SELECT * FROM users WHERE email = $1`
    return this.query(sql, [email])
  }

  async updateUser(id: string, updates: Partial<{
    email: string
    full_name: string
    trial_active: boolean
    trial_expires_at: string
    quota_limit: number
    quota_used: number
  }>) {
    const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ')
    const sql = `
      UPDATE users 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `
    return this.query(sql, [id, ...Object.values(updates)])
  }

  // Health check
  async healthCheck() {
    const sql = `SELECT 1 as healthy`
    return this.query(sql)
  }
}

export const neonApi = new NeonAPI()
export default neonApi
