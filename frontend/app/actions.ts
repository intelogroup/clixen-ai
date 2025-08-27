"use server";

import { neonAuth } from "@/lib/neon-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { Profile } from "@prisma/client";

export async function createUserProfile() {
  const user = await neonAuth.getUser();
  
  if (!user) {
    redirect("/auth/signin");
  }

  // Use upsert for better performance - single database operation
  await prisma.profile.upsert({
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
      trialActive: true,
      quotaUsed: 0,
      quotaLimit: 50,
    }
  });

  return user;
}

export async function getUserData(): Promise<{user: any, profile: Profile | null}> {
  const user = await neonAuth.getUser();
  
  if (!user) {
    return { user: null, profile: null };
  }

  // Optimized query with specific field selection for better performance
  const profile = await prisma.profile.findUnique({
    where: { neonAuthUserId: user.id },
    select: {
      id: true,
      neonAuthUserId: true,
      email: true,
      displayName: true,
      telegramChatId: true,
      telegramUsername: true,
      tier: true,
      trialStartedAt: true,
      trialExpiresAt: true,
      trialActive: true,
      quotaUsed: true,
      quotaLimit: true,
      lastActivityAt: true,
      createdAt: true
    }
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