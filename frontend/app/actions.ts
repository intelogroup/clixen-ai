"use server";

import { neon } from "@neondatabase/serverless";
import { stackServerApp } from "@/stack";

const sql = neon(process.env.DATABASE_URL!);

export async function getUserData() {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return null;
    }

    // Get user data from neon_auth.users_sync
    const [userData] = await sql`
      SELECT * FROM neon_auth.users_sync 
      WHERE id = ${user.id} AND deleted_at IS NULL
    `;

    return userData || null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

export async function getAllUsers() {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Get all active users
    const users = await sql`
      SELECT id, name, email, created_at 
      FROM neon_auth.users_sync 
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
    `;

    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users');
  }
}

export async function getUserProfile(userId: string) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const [profile] = await sql`
      SELECT raw_json, id, name, email, created_at
      FROM neon_auth.users_sync 
      WHERE id = ${userId} AND deleted_at IS NULL
    `;

    return profile || null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new Error('Failed to fetch user profile');
  }
}
