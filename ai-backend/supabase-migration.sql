-- Supabase Migration: Add Telegram Integration
-- Run this in Supabase SQL Editor

-- Add telegram_chat_id column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT UNIQUE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_chat_id 
ON profiles(telegram_chat_id);

-- Add comment for documentation
COMMENT ON COLUMN profiles.telegram_chat_id IS 'Telegram chat ID for bot integration';

-- Create test user with Telegram ID
INSERT INTO profiles (
  id,
  email, 
  telegram_chat_id, 
  tier, 
  trial_active,
  trial_started_at,
  trial_expires_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'telegram-test@clixen.app',
  '123456789',
  'trial',
  true,
  NOW(),
  NOW() + INTERVAL '7 days',
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  telegram_chat_id = EXCLUDED.telegram_chat_id,
  updated_at = NOW();

-- Create another test user for real testing
INSERT INTO profiles (
  id,
  email, 
  telegram_chat_id, 
  tier, 
  trial_active,
  trial_started_at,
  trial_expires_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'demo@clixen.app',
  '987654321',
  'starter',
  false,
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '10 days',
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  telegram_chat_id = EXCLUDED.telegram_chat_id,
  updated_at = NOW();

-- Verify the migration
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name = 'telegram_chat_id';

-- Show sample data
SELECT 
  email,
  telegram_chat_id,
  tier,
  trial_active,
  trial_expires_at
FROM profiles
WHERE telegram_chat_id IS NOT NULL
LIMIT 5;