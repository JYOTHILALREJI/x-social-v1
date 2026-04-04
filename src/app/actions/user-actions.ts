"use server";

import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addWalletBalance(userId: string, amount: number) {
  try {
    // In a real app, this is where you'd call a payment gateway (Stripe/PayPal)
    // For now, we'll directly update the DB as requested.
    
    // amount is in dollars from UI, convert to cents for DB
    const amountInCents = Math.round(amount * 100);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        walletBalance: {
           increment: amountInCents
        }
      }
    });

    // Record a "TOP_UP" revenue/transaction log for audit
    await prisma.revenue.create({
      data: {
        creatorId: userId, // Self-topup or generic system?
        senderId: userId,
        amount: amountInCents,
        type: "WALLET_TOPUP"
      }
    });

    revalidatePath("/profile");
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Wallet update error:", error);
    return { success: false, error: "Failed to update wallet balance" };
  }
}

export async function subscribeToCreator(userId: string, creatorId: string, tier: 1 | 2 | 3, amount: number) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.walletBalance < amount) {
      return { success: false, error: "Insufficient wallet balance." };
    }

    const creator = await prisma.user.findUnique({ 
      where: { id: creatorId },
      include: { creatorProfile: true }
    });
    if (!creator) {
      return { success: false, error: "Creator not found." };
    }

    const settings = await prisma.systemSettings.findUnique({ where: { id: "default" } });
    const fee = settings?.platformFee ?? 20;

    const amountInCents = amount; // incoming in cents
    const creatorNetInCents = Math.floor(amountInCents * (1 - fee / 100));

    let durationInDays = 30;
    if (tier === 1) durationInDays = creator.creatorProfile?.tier1Duration || 30;
    else if (tier === 2) durationInDays = creator.creatorProfile?.tier2Duration || 30;
    else if (tier === 3) durationInDays = creator.creatorProfile?.tier3Duration || 30;

    const expiresAt = new Date(Date.now() + durationInDays * 24 * 60 * 60 * 1000);

    // Atomic Transaction to update both wallets and the follow record
    await prisma.$transaction([
      // 1. Deduct full amount from user
      prisma.user.update({
        where: { id: userId },
        data: { walletBalance: { decrement: amountInCents } }
      }),
      // 2. Add net earnings to creator (after platform fee)
      prisma.user.update({
        where: { id: creatorId },
        data: { 
            walletBalance: { increment: creatorNetInCents },
            subscribersCount: { increment: 1 }
        }
      }),
      // 3. Upsert Follow record with subscription tier and dynamic duration
      prisma.follow.upsert({
        where: { 
            followerId_followingId: { 
                followerId: userId, 
                followingId: creatorId 
            } 
        },
        update: { 
            subscriptionTier: tier,
            expiresAt: expiresAt
        },
        create: {
            followerId: userId,
            followingId: creatorId,
            subscriptionTier: tier,
            status: "ACCEPTED",
            expiresAt: expiresAt
        }
      }),
      // 4. Record Revenue log (Recording Gross amount so analytics still match total sales volume)
      prisma.revenue.create({
        data: {
          creatorId,
          senderId: userId,
          amount: amountInCents,
          type: "SUBSCRIPTION"
        }
      })
    ]);

    revalidatePath(`/profile/${creatorId}`);
    revalidatePath("/feed");
    return { success: true };
  } catch (error) {
    console.error("Subscription error:", error);
    return { success: false, error: "Failed to process subscription." };
  }
}

export async function purchaseContent(userId: string, contentId: string, type: 'post' | 'reel', amount: number) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.walletBalance < amount) {
      return { success: false, error: "Insufficient wallet balance." };
    }

    const amountInCents = amount; // incoming in cents

    // Fetch actual creator ID and settings
    let contentAuthorId = "";
    if (type === 'post') {
      const p = await prisma.post.findUnique({ where: { id: contentId } });
      contentAuthorId = p?.authorId || "";
    } else {
      const r = await prisma.reel.findUnique({ where: { id: contentId } });
      contentAuthorId = r?.authorId || "";
    }

    if (!contentAuthorId) return { success: false, error: "Content creator not found." };

    // Atomic Transaction to update both wallets and the follow record
    await prisma.$transaction([
      // 1. Deduct full amount from user (gross)
      prisma.user.update({
        where: { id: userId },
        data: { walletBalance: { decrement: amountInCents } }
      }),
      // 2. Add full earnings to creator (gross)
      prisma.user.update({
        where: { id: contentAuthorId },
        data: { 
            walletBalance: { increment: amountInCents }
        }
      }),
      // 3. Create the Purchase record
      prisma.purchase.create({
        data: {
            userId,
            postId: type === 'post' ? contentId : null,
            reelId: type === 'reel' ? contentId : null,
        }
      }),
      // 4. Record Revenue log (GROSS)
      prisma.revenue.create({
        data: {
          creatorId: contentAuthorId,
          senderId: userId,
          amount: amountInCents,
          type: type === 'post' ? "POST_PURCHASE" : "REEL_PURCHASE",
          postId: type === 'post' ? contentId : null,
          reelId: type === 'reel' ? contentId : null,
        }
      })
    ]);

    revalidatePath(`/profile/${contentAuthorId}`);
    revalidatePath("/feed");
    return { success: true };
  } catch (error) {
    console.error("Content purchase error:", error);
    return { success: false, error: "Failed to process content purchase." };
  }
}

export async function togglePostLike(userId: string, postId: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { isGhost: true } });
    if (user?.isGhost) {
      return { success: false, error: "Ghost accounts cannot like posts." };
    }

    const post = await prisma.post.findUnique({ where: { id: postId }, select: { isPrivate: true, authorId: true } });
    if (!post) return { success: false, error: "Post not found" };
    if (post.isPrivate && post.authorId !== userId) return { success: false, error: "Content is private" };

    // Block logic: Cannot interact if blocked or blocker
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: post.authorId },
          { blockerId: post.authorId, blockedId: userId }
        ]
      }
    });
    if (block) return { success: false, error: "Access denied" };

    const existingLike = await prisma.postLike.findUnique({
      where: { userId_postId: { userId, postId } }
    });

    if (existingLike) {
      await prisma.postLike.delete({
        where: { id: existingLike.id }
      });
      return { success: true, isLiked: false };
    } else {
      await prisma.postLike.create({
        data: { userId, postId }
      });
      return { success: true, isLiked: true };
    }
  } catch (error) {
    console.error("Toggle like error:", error);
    return { success: false, error: "Failed to toggle like." };
  }
}

export async function addPostComment(userId: string, postId: string, text: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { isGhost: true } });
    if (user?.isGhost) {
      return { success: false, error: "Ghost accounts cannot comment on posts." };
    }

    const post = await prisma.post.findUnique({ where: { id: postId }, select: { isPrivate: true, authorId: true } });
    if (!post) return { success: false, error: "Post not found" };
    if (post.isPrivate && post.authorId !== userId) return { success: false, error: "Content is private" };

    // Block logic: Cannot interact if blocked or blocker
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: post.authorId },
          { blockerId: post.authorId, blockedId: userId }
        ]
      }
    });
    if (block) return { success: false, error: "Access denied" };

    const comment = await prisma.postComment.create({
      data: { userId, postId, text },
      include: { user: { select: { username: true, image: true } } }
    });
    return { success: true, comment };
  } catch (error) {
    console.error("Add comment error:", error);
    return { success: false, error: "Failed to add comment." };
  }
}

export async function checkUsernameAvailability(username: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    });
    return { available: !user };
  } catch (error) {
    return { available: false };
  }
}

export async function updateUserProfile(userId: string, data: {
  name?: string;
  username?: string;
  bio?: string;
  dob?: Date;
  image?: string;
  isGhost?: boolean;
}) {
  try {
    const updateData: any = { ...data };
    if (updateData.username) {
        updateData.username = updateData.username.toLowerCase();
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    revalidatePath("/profile");
    revalidatePath("/feed");
    return { success: true, user };
  } catch (error: any) {
    console.error("Update profile error:", error);
    if (error.code === 'P2002') {
       return { success: false, error: "Username is already taken." };
    }
    return { success: false, error: "Failed to update profile." };
  }
}

export async function toggleContentVisibility(userId: string, contentId: string, contentType: 'post' | 'reel', isPrivate: boolean) {
  try {
    console.log("Toggling visibility:", { userId, contentId, contentType, isPrivate });
    if (contentType === 'post') {
      const post = await prisma.post.findFirst({ where: { id: contentId } });
      if (!post || post.authorId !== userId) return { success: false, error: "Unauthorized" };
      await prisma.post.update({
        where: { id: contentId },
        data: { isPrivate }
      });
    } else {
      const reel = await prisma.reel.findFirst({ where: { id: contentId } });
      if (!reel || reel.authorId !== userId) return { success: false, error: "Unauthorized" };
      await prisma.reel.update({
        where: { id: contentId },
        data: { isPrivate }
      });
    }

    revalidatePath("/profile");
    revalidatePath("/feed");
    return { success: true };
  } catch (error) {
    console.error("Toggle visibility error:", error);
    return { success: false, error: "Failed to update visibility" };
  }
}
