import { neon } from "@neondatabase/serverless";

// Use your existing database connection
export const sql = neon(process.env.DATABASE_URL!);

// Helper function for server actions (use template literals with sql`...`)
export async function executeQuery<T = any>(queryFn: () => Promise<any>): Promise<T[]> {
  try {
    const result = await queryFn();
    return result as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// User profile type
export interface UserProfile {
  id: string;
  stack_user_id: string;
  email: string;
  display_name?: string;
  telegram_chat_id?: string;
  telegram_username?: string;
  trial_started_at: Date;
  trial_expires_at: Date;
  trial_active: boolean;
  quota_used: number;
  quota_limit: number;
  tier: 'free' | 'starter' | 'pro';
  created_at: Date;
  last_activity_at?: Date;
}