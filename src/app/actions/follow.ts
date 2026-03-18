"use server";

import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleFollow(followerId: string, followingId: string, isFollowing: boolean) {
  try {
    if (isFollowing) {
      // UNFOLLOW LOGIC
      await prisma.$transaction([
        prisma.follow.delete({
          where: {
            followerId_followingId: { followerId, followingId }
          }
        }),
        prisma.user.update({
          where: { id: followingId },
          data: { followersCount: { decrement: 1 } }
        }),
        prisma.user.update({
          where: { id: followerId },
          data: { followingCount: { decrement: 1 } }
        })
      ]);
    } else {
      // FOLLOW LOGIC
      await prisma.$transaction([
        prisma.follow.create({
          data: { followerId, followingId }
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
    revalidatePath("/");
    revalidatePath(`/profile/${followingId}`);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}