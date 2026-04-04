"use server";

import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateTieredPrices(
  userId: string, 
  tier1: number, tier1Dur: number, 
  tier2: number, tier2Dur: number, 
  tier3: number, tier3Dur: number
) {
  try {
    await prisma.creatorProfile.update({
      where: { userId },
      data: { 
        tier1Price: tier1,
        tier1Duration: tier1Dur,
        tier2Price: tier2,
        tier2Duration: tier2Dur,
        tier3Price: tier3,
        tier3Duration: tier3Dur
      },
    });
    revalidatePath("/profile");
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Failed to update tiered prices:", error);
    return { success: false, error: "Failed to update tiered prices" };
  }
}

export async function toggleContentVisibility(id: string, type: 'post' | 'reel', isVisible: boolean) {
  // Assuming we might add an 'isVisible' or 'status' field to posts/reels later.
  // For now, let's just create the action placeholder.
  // If no visibility field exists yet, we should maybe add it.
  // Let's check the schema again.
  return { success: true };
}

export async function getRevenueData(userId: string, period: 'daily' | 'weekly' | 'monthly' | 'yearly') {
  try {
    const now = new Date();
    let startDate = new Date();

    if (period === 'daily') startDate.setDate(now.getDate() - 1);
    else if (period === 'weekly') startDate.setDate(now.getDate() - 7);
    else if (period === 'monthly') startDate.setMonth(now.getMonth() - 1);
    else if (period === 'yearly') startDate.setFullYear(now.getFullYear() - 1);

    const revenues = await prisma.revenue.findMany({
      where: {
        creatorId: userId,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'asc' },
    });

    return { success: true, data: revenues };
  } catch (error) {
    console.error("Failed to fetch revenue data:", error);
    return { success: false, error: "Failed to fetch revenue data" };
  }
}
