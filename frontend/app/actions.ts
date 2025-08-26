"use server";

import { stackServerApp } from "@/stack";
import { sql } from "@/lib/database";
import { redirect } from "next/navigation";
import { UserProfile } from "@/lib/database";

export async function createUserProfile() {
  const user = await stackServerApp.getUser();
  
  if (!user) {
    redirect("/handler/sign-in");
  }

  // Check if profile already exists
  const existingProfile = await sql`
    SELECT * FROM profiles WHERE stack_user_id = ${user.id}
  `;

  if (existingProfile.length === 0) {
    // Create new profile in your existing database
    await sql`
      INSERT INTO profiles (
        stack_user_id,
        email,
        display_name,
        trial_started_at,
        trial_expires_at,
        trial_active,
        quota_used,
        quota_limit,
        tier,
        created_at,
        last_activity_at
      ) VALUES (
        ${user.id},
        ${user.primaryEmail},
        ${user.displayName || user.primaryEmail},
        NOW(),
        NOW() + INTERVAL '7 days',
        true,
        0,
        50,
        'free',
        NOW(),
        NOW()
      )
    `;
  }

  return user;
}

export async function getUserData(): Promise<{user: any, profile: UserProfile | null}> {
  const user = await stackServerApp.getUser();
  
  if (!user) {
    return { user: null, profile: null };
  }

  const profile = await sql`
    SELECT * FROM profiles WHERE stack_user_id = ${user.id}
  `;

  return {
    user,
    profile: (profile[0] as UserProfile) || null
  };
}

export async function updateUserQuota(amount: number = 1) {
  const user = await stackServerApp.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  await sql`
    UPDATE profiles 
    SET quota_used = quota_used + ${amount}, last_activity_at = NOW()
    WHERE stack_user_id = ${user.id}
  `;
}

export async function linkTelegramAccount(chatId: string, username?: string) {
  const user = await stackServerApp.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  await sql`
    UPDATE profiles 
    SET telegram_chat_id = ${chatId}, 
        telegram_username = ${username},
        last_activity_at = NOW()
    WHERE stack_user_id = ${user.id}
  `;
}