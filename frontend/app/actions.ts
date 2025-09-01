"use server";

import { neonAuth } from "@/lib/neon-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { Profile, Team, ApiKey, TeamRole, TeamTier } from "@prisma/client";
import crypto from 'crypto';
import { getCachedUserProfile, invalidateUserCache } from "@/lib/cache";
import { trackUserQuery } from "@/lib/performance";

export async function createUserProfile() {
  const user = await neonAuth.getUser();
  
  if (!user) {
    redirect("/auth/signin");
  }

  // Track performance of profile creation
  await trackUserQuery('create_profile', async () => {
    // Use upsert for better performance - single database operation
    return prisma.profile.upsert({
      where: { neonAuthUserId: user.id },
      update: {
        // Update only essential fields to avoid unnecessary writes
        lastActivityAt: new Date(),
        email: user.primaryEmail!,
        displayName: user.displayName || user.primaryEmail!
      },
      create: {
        neonAuthUserId: user.id,
        email: user.primaryEmail!,
        displayName: user.displayName || user.primaryEmail!,
        tier: "FREE",
        role: "MEMBER",
        trialActive: true,
        quotaUsed: 0,
        quotaLimit: 50,
      }
    });
  });

  return user;
}

export async function getUserData(): Promise<{user: any, profile: Profile | null}> {
  const user = await neonAuth.getUser();
  
  if (!user) {
    return { user: null, profile: null };
  }

  // Use cached profile for better performance
  const profile = await getCachedUserProfile(user.id, async () => {
    return prisma.profile.findUnique({
      where: { neonAuthUserId: user.id },
      select: {
        id: true,
        neonAuthUserId: true,
        email: true,
        displayName: true,
        teamId: true,
        role: true,
        permissions: true,
        oauthProviders: true,
        telegramChatId: true,
        telegramUsername: true,
        telegramFirstName: true,
        telegramLastName: true,
        telegramLinkedAt: true,
        tier: true,
        trialStartedAt: true,
        trialExpiresAt: true,
        trialActive: true,
        quotaUsed: true,
        quotaLimit: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        customUserData: true,
        userMetadata: true,
        lastActivityAt: true,
        createdAt: true,
        updatedAt: true
      }
    });
  });

  return { user, profile };
}

export async function updateUserQuota(amount: number = 1) {
  const user = await neonAuth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  await prisma.profile.update({
    where: { neonAuthUserId: user.id },
    data: {
      quotaUsed: { increment: amount },
      lastActivityAt: new Date(),
    }
  });
  
  // Invalidate cache when user data changes
  invalidateUserCache(user.id);
}

export async function linkTelegramAccount(chatId: string, username?: string, firstName?: string, lastName?: string) {
  const user = await neonAuth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  await prisma.profile.update({
    where: { neonAuthUserId: user.id },
    data: {
      telegramChatId: chatId,
      telegramUsername: username,
      telegramFirstName: firstName,
      telegramLastName: lastName,
      telegramLinkedAt: new Date(),
      lastActivityAt: new Date(),
    }
  });
}

// Batch multiple usage logs for better performance
const usageBatch: any[] = [];
let batchTimeout: NodeJS.Timeout | null = null;

export async function logUsage(action: string, success: boolean = true, errorMessage?: string, processingTime?: number, telegramChatId?: string, telegramMessageId?: bigint) {
  const user = await neonAuth.getUser();
  
  if (!user) {
    return; // Skip logging for unauthenticated users
  }

  // Add to batch for performance optimization
  usageBatch.push({
    profileId: user.id,
    neonAuthUserId: user.id,
    action,
    success,
    errorMessage,
    processingTimeMs: processingTime,
    telegramChatId,
    telegramMessageId,
  });

  // Batch write every 100ms to reduce database calls
  if (batchTimeout) clearTimeout(batchTimeout);
  batchTimeout = setTimeout(async () => {
    if (usageBatch.length > 0) {
      const logs = [...usageBatch];
      usageBatch.length = 0; // Clear array
      
      try {
        await prisma.usageLog.createMany({
          data: logs,
          skipDuplicates: true
        });
      } catch (error) {
        console.error('Error batch logging usage:', error);
        // Re-add failed logs to batch for retry
        usageBatch.unshift(...logs);
      }
    }
  }, 100);
}

// ================================
// TEAM MANAGEMENT FUNCTIONS
// (Based on NeonAuth documentation features)
// ================================

export async function createTeam(name: string, slug: string): Promise<Team> {
  const user = await neonAuth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Check if slug is already taken
  const existingTeam = await prisma.team.findUnique({
    where: { slug }
  });

  if (existingTeam) {
    throw new Error('Team slug already exists');
  }

  // Create team with the current user as owner
  const team = await prisma.team.create({
    data: {
      name,
      slug,
      ownerId: user.id,
      teamTier: 'TEAM_FREE',
      teamQuotaLimit: 200,
      teamQuotaUsed: 0,
    }
  });

  // Update user profile to be team owner
  await prisma.profile.update({
    where: { neonAuthUserId: user.id },
    data: {
      teamId: team.id,
      role: 'OWNER',
    }
  });

  return team;
}

export async function joinTeam(teamId: string, role: TeamRole = 'MEMBER'): Promise<void> {
  const user = await neonAuth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Verify team exists
  const team = await prisma.team.findUnique({
    where: { id: teamId }
  });

  if (!team) {
    throw new Error('Team not found');
  }

  // Update user profile to join team
  await prisma.profile.update({
    where: { neonAuthUserId: user.id },
    data: {
      teamId: team.id,
      role: role,
    }
  });
}

export async function leaveTeam(): Promise<void> {
  const user = await neonAuth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Remove user from team
  await prisma.profile.update({
    where: { neonAuthUserId: user.id },
    data: {
      teamId: null,
      role: 'MEMBER',
    }
  });
}

export async function getTeamData(): Promise<{ 
  team: Team | null, 
  members: { id: string; email: string; displayName: string; role: TeamRole; lastActivityAt: Date; createdAt: Date; }[] 
}> {
  const user = await neonAuth.getUser();
  
  if (!user) {
    return { team: null, members: [] };
  }

  const profile = await prisma.profile.findUnique({
    where: { neonAuthUserId: user.id },
    include: {
      team: {
        include: {
          members: {
            select: {
              id: true,
              email: true,
              displayName: true,
              role: true,
              createdAt: true,
              lastActivityAt: true,
            }
          }
        }
      }
    }
  });

  if (!profile?.team) {
    return { team: null, members: [] };
  }

  return {
    team: profile.team,
    members: profile.team.members
  };
}

export async function updateTeamQuota(amount: number = 1): Promise<void> {
  const user = await neonAuth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const profile = await prisma.profile.findUnique({
    where: { neonAuthUserId: user.id },
    select: { teamId: true }
  });

  if (!profile?.teamId) {
    // Fall back to individual quota if not in a team
    return updateUserQuota(amount);
  }

  await prisma.team.update({
    where: { id: profile.teamId },
    data: {
      teamQuotaUsed: { increment: amount },
    }
  });
}

// ================================
// API KEY MANAGEMENT FUNCTIONS
// (Based on NeonAuth documentation for backend integration)
// ================================

export async function generateApiKey(name: string, scopes: string[] = [], expiresAt?: Date): Promise<{ key: string, keyData: ApiKey }> {
  const user = await neonAuth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Generate secure API key
  const apiKey = crypto.randomBytes(32).toString('hex');
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
  const keyPrefix = apiKey.substring(0, 8);

  const profile = await prisma.profile.findUnique({
    where: { neonAuthUserId: user.id },
    select: { id: true, teamId: true }
  });

  if (!profile) {
    throw new Error('User profile not found');
  }

  const keyData = await prisma.apiKey.create({
    data: {
      profileId: profile.id,
      teamId: profile.teamId,
      keyHash,
      keyPrefix,
      name,
      scopes,
      permissions: {},
      expiresAt,
    }
  });

  // Return the plaintext key (only time it's visible)
  return {
    key: `clx_${apiKey}`,
    keyData
  };
}

export async function listApiKeys(): Promise<{
  id: string;
  keyPrefix: string;
  name: string;
  scopes: string[];
  lastUsedAt: Date | null;
  usageCount: number;
  expiresAt: Date | null;
  createdAt: Date;
}[]> {
  const user = await neonAuth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const profile = await prisma.profile.findUnique({
    where: { neonAuthUserId: user.id },
    select: { id: true }
  });

  if (!profile) {
    throw new Error('User profile not found');
  }

  return prisma.apiKey.findMany({
    where: {
      profileId: profile.id,
      active: true
    },
    select: {
      id: true,
      keyPrefix: true,
      name: true,
      scopes: true,
      lastUsedAt: true,
      usageCount: true,
      expiresAt: true,
      createdAt: true,
      // Never select keyHash for security
    }
  });
}

export async function revokeApiKey(keyId: string): Promise<void> {
  const user = await neonAuth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const profile = await prisma.profile.findUnique({
    where: { neonAuthUserId: user.id },
    select: { id: true }
  });

  if (!profile) {
    throw new Error('User profile not found');
  }

  await prisma.apiKey.update({
    where: {
      id: keyId,
      profileId: profile.id, // Ensure user owns the key
    },
    data: {
      active: false,
    }
  });
}

// ================================
// ENHANCED USER DATA FUNCTIONS
// (Custom user data as mentioned in NeonAuth docs)
// ================================

export async function updateCustomUserData(customData: Record<string, any>): Promise<void> {
  const user = await neonAuth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  await prisma.profile.update({
    where: { neonAuthUserId: user.id },
    data: {
      customUserData: customData,
      lastActivityAt: new Date(),
    }
  });
}

export async function getCustomUserData(): Promise<Record<string, any>> {
  const user = await neonAuth.getUser();
  
  if (!user) {
    return {};
  }

  const profile = await prisma.profile.findUnique({
    where: { neonAuthUserId: user.id },
    select: { customUserData: true }
  });

  return (profile?.customUserData as Record<string, any>) || {};
}

// ================================
// OAUTH PROVIDER TRACKING
// (Track connected OAuth providers)
// ================================

export async function updateOAuthProviders(providers: Record<string, any>): Promise<void> {
  const user = await neonAuth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  await prisma.profile.update({
    where: { neonAuthUserId: user.id },
    data: {
      oauthProviders: providers,
      lastActivityAt: new Date(),
    }
  });
}