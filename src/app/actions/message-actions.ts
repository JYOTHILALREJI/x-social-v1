"use server";

import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getConversations(userId: string) {
  try {
    const rawConversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ],
        status: { in: ["ACCEPTED", "PENDING"] }
      },
      include: {
        user1: { select: { id: true, username: true, name: true, image: true, lastSeen: true, isActivityStatusEnabled: true } },
        user2: { select: { id: true, username: true, name: true, image: true, lastSeen: true, isActivityStatusEnabled: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { text: true, createdAt: true, type: true, senderId: true, isRead: true }
        }
      },
      orderBy: { lastMessageAt: 'desc' }
    });

    const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });

    const conversations = rawConversations.filter(c => {
       if (c.status === "ACCEPTED") return true;
       // If it's PENDING and I am a regular user, these are my requests! Show them
       if (me?.role !== "CREATOR") return true;
       // Creators only see PENDING chats in the main list if THEY initiated it
       if (c.messages.length > 0 && c.messages[0].senderId === userId) return true;
       return false;
    });

    return { success: true, conversations };
  } catch (error) {
    console.error("getConversations error:", error);
    return { success: false, error: "Failed to fetch conversations" };
  }
}

export async function getMessageRequests(userId: string) {
  try {
    // For creators, a message request is a PENDING conversation where they are NOT the initiator
    const requests = await prisma.conversation.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ],
        status: "PENDING"
      },
      include: {
        user1: { select: { id: true, username: true, name: true, image: true } },
        user2: { select: { id: true, username: true, name: true, image: true } },
        messages: { take: 1, orderBy: { createdAt: 'asc' } }
      },
      orderBy: { lastMessageAt: 'desc' }
    });

    // Filter out requests initiated by the creator themselves if any
    const receivedRequests = requests.filter(req => {
      if (req.messages.length > 0) return req.messages[0].senderId !== userId;
      // If no messages, guess based on whether it exists. For now, return all.
      return true;
    });

    return { success: true, requests: receivedRequests };
  } catch (error) {
    console.error("getMessageRequests error:", error);
    return { success: false, error: "Failed to fetch requests" };
  }
}

export async function requestConversation(senderId: string, receiverId: string, initialText?: string) {
  try {
    // IDs should be sorted to maintain uniqueness: user1Id < user2Id
    const [u1, u2] = [senderId, receiverId].sort();

    const existing = await prisma.conversation.findUnique({
      where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } }
    });

    if (existing) {
      if (existing.status === "REJECTED") {
        return { success: false, error: "This user is currently not accepting messages." };
      }
      return { success: true, conversationId: existing.id, status: existing.status };
    }

    // Check if sender is subscribed to receiver
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: senderId, followingId: receiverId } }
    });
    
    // Reverse check for creators messaging fans
    const followReverse = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: receiverId, followingId: senderId } }
    });

    const isSubscribed = (follow?.subscriptionTier && follow.subscriptionTier > 0) || (followReverse?.subscriptionTier && followReverse.subscriptionTier > 0);
    const initialStatus = isSubscribed ? "ACCEPTED" : "PENDING";

    const conversation = await prisma.conversation.create({
      data: {
        user1Id: u1,
        user2Id: u2,
        status: initialStatus,
        ...(initialText ? {
          messages: {
            create: {
              senderId,
              text: initialText,
              type: "TEXT"
            }
          }
        } : {})
      }
    });

    if (initialStatus === "PENDING") {
      // Notify the receiver only if it needs approval
      const sender = await prisma.user.findUnique({ where: { id: senderId }, select: { username: true } });
      await prisma.notification.create({
        data: {
          userId: receiverId,
          message: `${sender?.username} requested to message you.`,
          type: "MESSAGE_REQUEST",
          relatedId: conversation.id
        }
      });
    }

    return { success: true, conversationId: conversation.id, status: initialStatus };
  } catch (error) {
    console.error("requestConversation error:", error);
    return { success: false, error: "Failed to request conversation" };
  }
}

export async function respondToRequest(conversationId: string, status: "ACCEPTED" | "REJECTED") {
  try {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { status }
    });
    revalidatePath("/messages");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function sendMessage(
  conversationId: string, 
  senderId: string, 
  data: { 
    text?: string, 
    type?: "TEXT" | "VOICE" | "MEDIA", 
    mediaUrl?: string,
    expiresAt?: Date,
    viewLimit?: number,
    duration?: number
  }
) {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { user1Id: true, user2Id: true }
    });

    if (!conversation) return { success: false, error: "Conversation not found" };

    const recipientId = conversation.user1Id === senderId ? conversation.user2Id : conversation.user1Id;

    // --- TIER VALIDATION ---
    const sender = await prisma.user.findUnique({ where: { id: senderId }, select: { role: true } });
    const recipient = await prisma.user.findUnique({ where: { id: recipientId }, select: { role: true } });

    // If sender is NOT a creator and recipient IS a creator, check subscription tier
    if (sender?.role !== "CREATOR" && recipient?.role === "CREATOR") {
      const follow = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: senderId, followingId: recipientId } }
      });

      const tier = follow?.subscriptionTier || 0;
      
      // Enforce 6 free message limit
      if (tier === 0) {
          const sentCount = await prisma.message.count({
              where: { conversationId, senderId }
          });
          if (sentCount >= 6) {
              return { success: false, error: "You've reached your 6 free message limit. Please subscribe to continue." };
          }
      }

      const msgType = data.type || "TEXT";

      if (msgType === "VOICE" && tier < 2) {
        return { success: false, error: "Upgrade to Tier 2 (Silver) to send voice messages." };
      }
      if (msgType === "MEDIA" && tier < 3) {
        return { success: false, error: "Upgrade to Tier 3 (Gold) to send photos/videos." };
      }
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        text: data.text,
        type: data.type || "TEXT",
        mediaUrl: data.mediaUrl,
        expiresAt: data.expiresAt,
        viewLimit: data.viewLimit,
        viewCount: 0,
        duration: data.duration
      },
      include: {
        sender: { select: { id: true, username: true, image: true } }
      }
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() }
    });

    return { success: true, message };
  } catch (error) {
    console.error("sendMessage error:", error);
    return { success: false, error: "Failed to send message" };
  }
}

export async function getMessages(conversationId: string, skip: number = 0, take: number = 50) {
  try {
    const rawMessages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        sender: { select: { id: true, username: true, image: true } }
      }
    });

    // Handle ephemeral logic: mask media if expired or limit reached
    const messages = rawMessages.map(msg => {
      const isExpired = msg.expiresAt && new Date() > msg.expiresAt;
      const isLimitReached = msg.viewLimit && msg.viewCount >= msg.viewLimit;
      
      if (isExpired || isLimitReached) {
        return { 
          ...msg, 
          mediaUrl: null, // Clear URL so client cannot access
          text: (isExpired || isLimitReached) ? "Media Expired" : msg.text 
        };
      }
      return msg;
    });

    return { success: true, messages: messages.reverse() };
  } catch (error) {
    return { success: false, messages: [] };
  }
}

export async function markMessageSeen(messageId: string) {
  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { viewLimit: true, viewCount: true }
    });

    if (message && message.viewLimit) {
      await prisma.message.update({
        where: { id: messageId },
        data: { viewCount: { increment: 1 } }
      });
    }

    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function getConversationAccess(conversationId: string, userId: string) {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: { where: { senderId: userId }, select: { id: true } }
      }
    });

    if (!conversation) return { tier: 0, recipientRole: "USER", messagesSent: 0 };

    const recipientId = conversation.user1Id === userId ? conversation.user2Id : conversation.user1Id;
    const recipient = await prisma.user.findUnique({ 
        where: { id: recipientId }, 
        select: { 
            role: true, 
            creatorProfile: {
                select: {
                    tier1Price: true,
                    tier1Duration: true,
                    tier2Price: true,
                    tier2Duration: true,
                    tier3Price: true,
                    tier3Duration: true,
                }
            } 
        } 
    });

    const messagesSent = conversation.messages.length;

    if (recipient?.role === "CREATOR") {
      const follow = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: userId, followingId: recipientId } }
      });
      return { 
          tier: follow?.subscriptionTier || 0, 
          recipientRole: "CREATOR",
          messagesSent,
          creatorProfile: recipient.creatorProfile
      };
    }

    return { tier: 3, recipientRole: "USER", messagesSent }; 
  } catch (error) {
    return { tier: 0, recipientRole: "USER", messagesSent: 0 };
  }
}

export async function markChatAsRead(conversationId: string, userId: string) {
  try {
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false
      },
      data: { isRead: true }
    });
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}
