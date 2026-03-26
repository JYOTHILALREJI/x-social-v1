"use server";

import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. STATS ACTION
export async function getAdminStats() {
  try {
    const [totalUsers, totalCreators, totalPosts, totalReels, recentUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "CREATOR" } }),
      prisma.post.count(),
      prisma.reel.count(),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, username: true, email: true, createdAt: true, role: true }
      })
    ]);

    // Calculate total revenue
    const revenueSum = await prisma.revenue.aggregate({
      _sum: { amount: true }
    });

    return {
      success: true,
      stats: {
        totalUsers,
        totalCreators,
        totalContent: totalPosts + totalReels,
        totalRevenue: (revenueSum._sum.amount || 0) / 100, // Assuming amount is in cents
        recentUsers
      }
    };
  } catch (error) {
    console.error("Admin stats error:", error);
    return { success: false, error: "Failed to fetch stats" };
  }
}

// 2. USER MANAGEMENT ACTIONS
export async function getAllUsers(page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit;
    const users = await prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        creatorStatus: true,
        walletBalance: true
      }
    });

    const total = await prisma.user.count();

    return { success: true, users, total, pages: Math.ceil(total / limit) };
  } catch (error) {
    return { success: false, error: "Failed to fetch users" };
  }
}

export async function updateUserRole(userId: string, role: any) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role }
    });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update role" };
  }
}

export async function deleteUser(userId: string) {
  try {
    await prisma.user.delete({ where: { id: userId } });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete user" };
  }
}

// 3. CREATOR MANAGEMENT ACTIONS
export async function getPendingCreators() {
  try {
    const creators = await prisma.creatorProfile.findMany({
      where: { status: "PENDING" },
      include: { user: true }
    });
    return { success: true, creators };
  } catch (error) {
    return { success: false, error: "Failed to fetch pending creators" };
  }
}

export async function approveCreator(profileId: string) {
  try {
    const profile = await prisma.creatorProfile.update({
      where: { id: profileId },
      data: { status: "APPROVED" },
      include: { user: true }
    });

    await prisma.user.update({
      where: { id: profile.userId },
      data: { 
        role: "CREATOR",
        creatorStatus: "APPROVED"
      }
    });

    revalidatePath("/admin/creators");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to approve creator" };
  }
}

export async function rejectCreator(profileId: string) {
  try {
    const profile = await prisma.creatorProfile.update({
      where: { id: profileId },
      data: { status: "REJECTED" }
    });

    await prisma.user.update({
      where: { id: profile.userId },
      data: { creatorStatus: "REJECTED" }
    });

    revalidatePath("/admin/creators");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to reject creator" };
  }
}

// 4. CONTENT MANAGEMENT ACTIONS
export async function getAllContent(page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit;
    const posts = await prisma.post.findMany({
      skip,
      take: limit,
      include: { author: true }
    });
    const reels = await prisma.reel.findMany({
      skip,
      take: limit,
      include: { author: true }
    });

    return { success: true, posts, reels };
  } catch (error) {
    return { success: false, error: "Failed to fetch content" };
  }
}

export async function deletePost(postId: string) {
  try {
    await prisma.post.delete({ where: { id: postId } });
    revalidatePath("/admin/content");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete post" };
  }
}

export async function deleteReel(reelId: string) {
  try {
    await prisma.reel.delete({ where: { id: reelId } });
    revalidatePath("/admin/content");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete reel" };
  }
}

// 5. DETAILED USER PROFILE ACTIONS
export async function getUserDetail(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: { posts: true, reels: true, followers: true, follows: true }
        },
        posts: { take: 10, orderBy: { createdAt: 'desc' } },
        reels: { take: 10, orderBy: { createdAt: 'desc' } },
        purchases: { take: 20, orderBy: { createdAt: 'desc' }, include: { post: true, reel: true } },
        revenues: { take: 20, orderBy: { createdAt: 'desc' }, include: { sender: true } }, // Money earned
        spendings: { take: 20, orderBy: { createdAt: 'desc' }, include: { creator: true } } // Money spent
      }
    });

    return { success: true, user };
  } catch (error) {
    return { success: false, error: "Failed to fetch user detail" };
  }
}

export async function updateUserWallet(userId: string, amount: number) {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { walletBalance: { increment: Math.round(amount) } }
    });
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/users");
    return { success: true, user: updatedUser };
  } catch (error) {
    return { success: false, error: "Failed to update wallet balance" };
  }
}

export async function updateUserInfo(userId: string, data: any) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data
    });
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update user info" };
  }
}

// 6. SYSTEM SETTINGS ACTIONS
export async function getSystemSettings() {
  try {
    let settings = await prisma.systemSettings.findUnique({
      where: { id: "default" }
    });
    
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: { id: "default", platformFee: 20 }
      });
    }
    
    return { success: true, settings };
  } catch (error) {
    return { success: false, error: "Failed to fetch system settings" };
  }
}

export async function updateSystemSettings(fee: number) {
  try {
    await prisma.systemSettings.upsert({
      where: { id: "default" },
      update: { platformFee: fee },
      create: { id: "default", platformFee: fee }
    });
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update system settings" };
  }
}

// 7. TRANSACTION LOG ACTIONS
export async function getTransactionLogs(page = 1, limit = 20) {
  try {
    const skip = (page - 1) * limit;
    const logs = await prisma.revenue.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { id: true, username: true } },
        sender: { select: { id: true, username: true } }
      }
    });
    
    const total = await prisma.revenue.count();
    
    return { success: true, logs, total, pages: Math.ceil(total / limit) };
  } catch (error) {
    return { success: false, error: "Failed to fetch transaction logs" };
  }
}



