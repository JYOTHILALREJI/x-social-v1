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

    const amountInCents = amount; // incoming in cents

    // Atomic Transaction to update both wallets and the follow record
    await prisma.$transaction([
      // 1. Deduct full amount from user (gross)
      prisma.user.update({
        where: { id: userId },
        data: { walletBalance: { decrement: amountInCents } }
      }),
      // 2. Add gross earnings to creator
      prisma.user.update({
        where: { id: creatorId },
        data: { 
            walletBalance: { increment: amountInCents },
            subscribersCount: { increment: 1 }
        }
      }),
      // 3. Upsert Follow record with subscription tier
      prisma.follow.upsert({
        where: { 
            followerId_followingId: { 
                followerId: userId, 
                followingId: creatorId 
            } 
        },
        update: { 
            subscriptionTier: tier,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        },
        create: {
            followerId: userId,
            followingId: creatorId,
            subscriptionTier: tier,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      }),
      // 4. Record Revenue log (GROSS)
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

