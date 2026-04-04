"use server";

import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleFollow(followerId: string, followingId: string, isFollowing: boolean) {
  try {
    const user = await prisma.user.findUnique({ where: { id: followerId }, select: { isGhost: true } });
    if (user?.isGhost && !isFollowing) {
      return { success: false, error: "Ghost accounts cannot follow others." };
    }

    const targetUser = await prisma.user.findUnique({ 
      where: { id: followingId }, 
      select: { id: true, isPrivateAccount: true, username: true } 
    });
    
    if (!targetUser) return { success: false, error: "Target user not found" };

    if (isFollowing) {
      // UNFOLLOW LOGIC
      // Check if it was accepted or pending to decide if we decrement counts
      const existingFollow = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId, followingId } }
      });

      const wasAccepted = existingFollow?.status === "ACCEPTED";

      await prisma.$transaction(async (tx) => {
        await tx.follow.delete({
          where: { followerId_followingId: { followerId, followingId } }
        });

        if (wasAccepted) {
          await tx.user.update({
            where: { id: followingId },
            data: { followersCount: { decrement: 1 } }
          });
          await tx.user.update({
            where: { id: followerId },
            data: { followingCount: { decrement: 1 } }
          });
        }
        
        // Also remove any pending follow request notifications
        await tx.notification.deleteMany({
          where: {
            userId: followingId,
            type: "FOLLOW_REQUEST",
            relatedId: followerId
          }
        });
      });
    } else {
      // FOLLOW LOGIC
      if (targetUser.isPrivateAccount) {
        // Create PENDING follow
        await prisma.$transaction(async (tx) => {
          await tx.follow.create({
            data: { 
              followerId, 
              followingId,
              status: "PENDING"
            }
          });
          
          // Notify the target user
          const follower = await tx.user.findUnique({ where: { id: followerId }, select: { username: true } });
          await tx.notification.create({
            data: {
              userId: followingId,
              message: `${follower?.username} requested to follow you`,
              type: "FOLLOW_REQUEST",
              relatedId: followerId // Store followerId to approve/decline easily
            }
          });
        });
        return { success: true, status: "PENDING" };
      } else {
        // Create ACCEPTED follow
        await prisma.$transaction([
          prisma.follow.create({
            data: { followerId, followingId, status: "ACCEPTED" }
          }),
          prisma.user.update({
            where: { id: followingId },
            data: { followersCount: { increment: 1 } }
          }),
          prisma.user.update({
            where: { id: followerId },
            data: { followingCount: { increment: 1 } }
          })
        ]);
      }
    }
    revalidatePath("/");
    revalidatePath(`/profile/${followingId}`);
    return { success: true, status: "ACCEPTED" };
  } catch (error) {
    console.error("Toggle follow error:", error);
    return { success: false };
  }
}

export async function approveFollowRequest(notificationId: string, followerId: string, followingId: string) {
  try {
    await prisma.$transaction([
      prisma.follow.update({
        where: { followerId_followingId: { followerId, followingId } },
        data: { status: "ACCEPTED" }
      }),
      prisma.user.update({
        where: { id: followingId },
        data: { followersCount: { increment: 1 } }
      }),
      prisma.user.update({
        where: { id: followerId },
        data: { followingCount: { increment: 1 } }
      }),
      prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
      })
    ]);
    revalidatePath("/notifications");
    revalidatePath(`/profile/${followingId}`);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function declineFollowRequest(notificationId: string, followerId: string, followingId: string) {
  try {
    await prisma.$transaction([
      prisma.follow.delete({
        where: { followerId_followingId: { followerId, followingId } }
      }),
      prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
      })
    ]);
    revalidatePath("/notifications");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}