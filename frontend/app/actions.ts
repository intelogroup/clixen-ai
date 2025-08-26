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

  // Check if profile already exists
  const existingProfile = await prisma.profile.findUnique({
    where: { neonAuthUserId: user.id }
  });

  if (!existingProfile) {
    // Create new profile using Prisma
    await prisma.profile.create({
      data: {
        neonAuthUserId: user.id,
        email: user.primaryEmail!,
        displayName: user.displayName || user.primaryEmail!,
        tier: "FREE",
        trialActive: true,
        quotaUsed: 0,
        quotaLimit: 50,
      }
    });
  }

  return user;
}

export async function getUserData(): Promise<{user: any, profile: Profile | null}> {
  const user = await neonAuth.getUser();
  
  if (!user) {
    return { user: null, profile: null };
  }

  const profile = await prisma.profile.findUnique({
    where: { neonAuthUserId: user.id }
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

export async function logUsage(action: string, success: boolean = true, errorMessage?: string, processingTime?: number, telegramChatId?: string, telegramMessageId?: bigint) {
  const user = await neonAuth.getUser();
  
  if (!user) {
    return; // Skip logging for unauthenticated users
  }

  await prisma.usageLog.create({
    data: {
      profileId: user.id,
      neonAuthUserId: user.id,
      action,
      success,
      errorMessage,
      processingTimeMs: processingTime,
      telegramChatId,
      telegramMessageId,
    }
  });
}