"use server";

import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

async function getSessionUserId() {
  const cookieStore = await cookies();
  const sessionToken = (await cookieStore).get('auth_session')?.value;
  if (!sessionToken) return null;
  const session = await prisma.session.findUnique({
    where: { sessionToken },
    select: { userId: true }
  });
  return session?.userId || null;
}

export async function blockUser(targetId: string) {
  try {
    const currentUserId = await getSessionUserId();
    if (!currentUserId) return { success: false, error: "Unauthorized" };
    if (currentUserId === targetId) return { success: false, error: "You cannot block yourself" };

    await prisma.$transaction(async (tx) => {
      // 1. Create the block
      await tx.block.upsert({
        where: { blockerId_blockedId: { blockerId: currentUserId, blockedId: targetId } },
        create: { blockerId: currentUserId, blockedId: targetId },
        update: {} // Already blocked
      });

      // 2. Remove any follows/subscriptions in BOTH directions
      await tx.follow.deleteMany({
        where: {
          OR: [
            { followerId: currentUserId, followingId: targetId },
            { followerId: targetId, followingId: currentUserId }
          ]
        }
      });
      
      // 3. Update follower/following counts for both users
      // This is a bit complex in a transaction, let's just decrement if they were following
      // But for simplicity, we count correctly:
      const followerCount1 = await tx.follow.count({ where: { followingId: targetId, status: "ACCEPTED" } });
      await tx.user.update({ where: { id: targetId }, data: { followersCount: followerCount1 } });

      const followingCount1 = await tx.follow.count({ where: { followerId: currentUserId } });
      await tx.user.update({ where: { id: currentUserId }, data: { followingCount: followingCount1 } });

      const followerCount2 = await tx.follow.count({ where: { followingId: currentUserId, status: "ACCEPTED" } });
      await tx.user.update({ where: { id: currentUserId }, data: { followersCount: followerCount2 } });

      const followingCount2 = await tx.follow.count({ where: { followerId: targetId } });
      await tx.user.update({ where: { id: targetId }, data: { followingCount: followingCount2 } });
    });

    revalidatePath(`/profile/${targetId}`);
    revalidatePath("/notifications");
    return { success: true };
  } catch (error) {
    console.error("Block User Error:", error);
    return { success: false, error: "Failed to block user" };
  }
}

export async function unblockUser(targetId: string) {
  try {
    const currentUserId = await getSessionUserId();
    if (!currentUserId) return { success: false, error: "Unauthorized" };

    await prisma.block.delete({
      where: { blockerId_blockedId: { blockerId: currentUserId, blockedId: targetId } }
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to unblock user" };
  }
}

export async function getBlockedUsers() {
  try {
    const currentUserId = await getSessionUserId();
    if (!currentUserId) return [];

    const blocks = await prisma.block.findMany({
      where: { blockerId: currentUserId },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true
          }
        }
      }
    });

    return blocks.map(b => b.blocked);
  } catch (error) {
    return [];
  }
}
