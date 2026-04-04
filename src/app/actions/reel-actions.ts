"use server";

import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleReelLike(userId: string, reelId: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { isGhost: true } });
    if (user?.isGhost) return { success: false, error: "Ghost accounts cannot like reels." };

    const reel = await prisma.reel.findUnique({ where: { id: reelId }, select: { isPrivate: true, authorId: true } });
    if (!reel) return { success: false, error: "Reel not found" };
    
    // Check blocks
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: reel.authorId },
          { blockerId: reel.authorId, blockedId: userId }
        ]
      }
    });
    if (block) return { success: false, error: "Access denied" };

    const existingLike = await prisma.reelLike.findUnique({
      where: { userId_reelId: { userId, reelId } }
    });

    if (existingLike) {
      await prisma.reelLike.delete({ where: { id: existingLike.id } });
      return { success: true, isLiked: false };
    } else {
      await prisma.reelLike.create({ data: { userId, reelId } });
      return { success: true, isLiked: true };
    }
  } catch (error) {
    console.error("Toggle reel like error:", error);
    return { success: false, error: "Failed to toggle like." };
  }
}

export async function toggleReelUpvote(userId: string, reelId: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { isGhost: true } });
    if (user?.isGhost) return { success: false, error: "Ghost accounts cannot upvote." };

    const reel = await prisma.reel.findUnique({ where: { id: reelId }, select: { authorId: true } });
    if (!reel) return { success: false, error: "Reel not found" };

    const existingUpvote = await prisma.reelUpvote.findUnique({
      where: { userId_reelId: { userId, reelId } }
    });

    if (existingUpvote) {
      await prisma.reelUpvote.delete({ where: { id: existingUpvote.id } });
      return { success: true, isUpvoted: false };
    } else {
      await prisma.reelUpvote.create({ data: { userId, reelId } });
      return { success: true, isUpvoted: true };
    }
  } catch (error) {
    console.error("Toggle upvote error:", error);
    return { success: false, error: "Failed to toggle upvote." };
  }
}

export async function addReelComment(userId: string, reelId: string, text: string) {
  try {
    if (!text.trim()) return { success: false, error: "Comment text is required" };
    
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { isGhost: true } });
    if (user?.isGhost) return { success: false, error: "Ghost accounts cannot comment." };

    const comment = await prisma.reelComment.create({
      data: { userId, reelId, text },
      include: { 
        user: { 
          select: { 
            username: true, 
            name: true,
            image: true 
          } 
        } 
      }
    });

    return { success: true, comment };
  } catch (error) {
    console.error("Add reel comment error:", error);
    return { success: false, error: "Failed to add comment." };
  }
}

export async function getReelComments(reelId: string, skip: number = 0, take: number = 10) {
  try {
    const comments = await prisma.reelComment.findMany({
      where: { reelId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { 
        user: { 
          select: { 
            username: true, 
            name: true,
            image: true 
          } 
        } 
      }
    });

    const totalCount = await prisma.reelComment.count({ where: { reelId } });

    return { 
      success: true, 
      comments, 
      hasMore: skip + take < totalCount 
    };
  } catch (error) {
    console.error("Get reel comments error:", error);
    return { success: false, error: "Failed to fetch comments." };
  }
}

export async function getReelStats(reelId: string, userId?: string) {
  try {
    const [likesCount, upvotesCount, commentsCount] = await Promise.all([
      prisma.reelLike.count({ where: { reelId } }),
      prisma.reelUpvote.count({ where: { reelId } }),
      prisma.reelComment.count({ where: { reelId } })
    ]);

    let isLiked = false;
    let isUpvoted = false;

    if (userId) {
      const [like, upvote] = await Promise.all([
        prisma.reelLike.findUnique({ where: { userId_reelId: { userId, reelId } } }),
        prisma.reelUpvote.findUnique({ where: { userId_reelId: { userId, reelId } } })
      ]);
      isLiked = !!like;
      isUpvoted = !!upvote;
    }

    return {
      success: true,
      stats: {
        likesCount,
        upvotesCount,
        commentsCount,
        isLiked,
        isUpvoted
      }
    };
  } catch (error) {
    console.error("Get reel stats error:", error);
    return { success: false, error: "Failed to fetch stats." };
  }
}
