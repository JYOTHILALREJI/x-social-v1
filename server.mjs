import 'dotenv/config';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { socketManager } from './src/lib/socket-manager.ts';
import { prisma } from './src/app/lib/prisma.ts';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);

      // IPC Bridge for Server Actions (which run in isolated workers)
      if (parsedUrl.pathname === '/api/internal/socket-emit' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
          try {
            const { userId, event, data } = JSON.parse(body);
            if (userId && event) {
              // We have access to 'io' here because this is the master process
              io.to(`user:${userId}`).emit(event, data);
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        });
        return; // Stop execution here so Next.js doesn't try to handle it
      }

      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  // Initialize Socket.io
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Auth Middleware
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      if (!cookieHeader) return next(new Error('Authentication error: No cookies'));

      // Simple cookie parser
      const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
      const sessionToken = cookies['auth_session'];

      if (!sessionToken) return next(new Error('Authentication error: No session'));

      const session = await prisma.session.findUnique({
        where: { sessionToken },
        select: { userId: true }
      });

      if (!session) return next(new Error('Authentication error: Invalid session'));

      // Attach user ID to socket
      socket.data.userId = session.userId;
      next();
    } catch (err) {
      console.error('[Socket] Auth error:', err);
      next(new Error('Internal server error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    console.log(`[Socket] User connected: ${userId}`);

    // Join personal room for targeted events
    socket.join(`user:${userId}`);

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${userId}`);
    });

    // Handle Typing Indicator (Zero POST)
    socket.on('typing', (data) => {
      const { conversationId, recipientId, isTyping } = data;
      if (!recipientId) return;
      io.to(`user:${recipientId}`).emit('typing', {
        conversationId,
        userId,
        isTyping
      });
    });

    // Handle Mark Read (Zero POST)
    socket.on('mark_read', async (data) => {
      const { conversationId } = data;
      if (!conversationId) return;
      
      try {
        const result = await prisma.message.updateMany({
          where: { conversationId, senderId: { not: userId }, isRead: false },
          data: { isRead: true }
        });

        if (result.count > 0) {
          const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            select: { user1Id: true, user2Id: true }
          });

          if (conversation) {
            const otherId = conversation.user1Id === userId ? conversation.user2Id : conversation.user1Id;
            io.to(`user:${otherId}`).emit('message_read', { conversationId, readBy: userId });
          }
        }
      } catch (err) {
        console.error('[Socket] Mark read failed:', err);
      }
    });

    // Handle Send Message (Zero POST)
    socket.on('send_message', async (data, callback) => {
      const { 
        conversationId, text, type, mediaUrl, expiresAt, 
        viewLimit, duration, encrypted, iv, repliedToId, 
        ratchet, encryptionSalt 
      } = data;
      try {
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          select: { user1Id: true, user2Id: true }
        });
        if (!conversation) return callback?.({ success: false, error: "Conversation not found" });

        const recipientId = conversation.user1Id === userId ? conversation.user2Id : conversation.user1Id;
        const sender = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
        const recipient = await prisma.user.findUnique({ where: { id: recipientId }, select: { role: true } });

        if (sender?.role !== "CREATOR" && recipient?.role === "CREATOR") {
          const follow = await prisma.follow.findUnique({
            where: { followerId_followingId: { followerId: userId, followingId: recipientId } }
          });
          const tier = follow?.subscriptionTier || 0;
          if (tier === 0) {
            const sentCount = await prisma.message.count({ where: { conversationId, senderId: userId } });
            if (sentCount >= 6) return callback?.({ success: false, error: "Free limit reached. Subscribe to continue." });
          }
          if (type === "VOICE" && tier < 2) return callback?.({ success: false, error: "Upgrade to Tier 2 for voice messages." });
          if (type === "MEDIA" && tier < 3) return callback?.({ success: false, error: "Upgrade to Tier 3 for photos/videos." });
        }

        const message = await prisma.message.create({
          data: {
            conversationId, senderId: userId, text, type: type || "TEXT",
            mediaUrl, expiresAt, viewLimit, viewCount: 0, duration, 
            encrypted, iv, encryptionSalt,
            repliedToId
          },
          include: { 
            sender: { select: { id: true, username: true, image: true } },
            repliedTo: {
              select: {
                id: true,
                text: true,
                encrypted: true,
                iv: true,
                encryptionSalt: true,
                type: true,
                sender: { select: { id: true, username: true, name: true } }
              }
            }
          }
        });

        await prisma.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } });
        
        // Auto-heal DB staleness if client passed its live key
        if (data.senderLivePublicKey) {
          await prisma.user.update({
            where: { id: userId },
            data: { publicKey: data.senderLivePublicKey }
          }).catch(console.error); // fail silently so we don't break message delivery
        }

        const senderData = await prisma.user.findUnique({ where: { id: userId }, select: { publicKey: true } });

        io.to(`user:${recipientId}`).emit('new_message', { 
          conversationId, 
          message, 
          senderPublicKey: data.senderLivePublicKey || senderData?.publicKey, 
          ratchet 
        });
        io.to(`user:${recipientId}`).emit('conversation_updated', { conversationId, lastMessageAt: new Date().toISOString() });
        
        callback?.({ success: true, message });
      } catch (err) {
        console.error('[Socket] send_message error:', err);
        callback?.({ success: false, error: "Failed to send message" });
      }
    });

    // Handle History Fetch (Zero POST)
    socket.on('get_history', async (data, callback) => {
      const { conversationId, skip = 0, take = 50 } = data;
      try {
        // Fetch conversation with FRESH public keys for E2EE
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          select: {
            user1Id: true, user2Id: true,
            user1: { select: { id: true, publicKey: true } },
            user2: { select: { id: true, publicKey: true } }
          }
        });

        const rawMessages = await prisma.message.findMany({
          where: { conversationId },
          orderBy: { createdAt: 'desc' },
          skip, take,
          include: { 
            sender: { select: { id: true, username: true, image: true } },
            repliedTo: {
              select: {
                id: true,
                text: true,
                encrypted: true,
                iv: true,
                encryptionSalt: true,
                type: true,
                sender: { select: { id: true, username: true, name: true } }
              }
            }
          }
        });
        const messages = rawMessages.map(msg => {
          const isExpired = msg.expiresAt && new Date() > msg.expiresAt;
          const isLimitReached = msg.viewLimit && msg.viewCount >= msg.viewLimit;
          if (isExpired || isLimitReached) return { ...msg, mediaUrl: null, text: "Media Expired" };
          return msg;
        });
        callback?.({ success: true, messages: messages.reverse(), conversation });
      } catch (err) {
        callback?.({ success: false, messages: [] });
      }
    });

    // Handle Public Key Fetch (Zero POST)
    socket.on('get_public_key', async (data, callback) => {
      const { targetUserId } = data;
      try {
        const user = await prisma.user.findUnique({ where: { id: targetUserId }, select: { publicKey: true } });
        callback?.({ success: true, publicKey: user?.publicKey || null });
      } catch (err) {
        callback?.({ success: false, publicKey: null });
      }
    });

    // Handle Access Check (Zero POST)
    socket.on('get_access', async (data, callback) => {
      const { conversationId } = data;
      try {
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { messages: { where: { senderId: userId }, select: { id: true } } }
        });
        if (!conversation) return callback?.({ tier: 0, recipientRole: "USER", messagesSent: 0 });

        const recipientId = conversation.user1Id === userId ? conversation.user2Id : conversation.user1Id;
        const recipient = await prisma.user.findUnique({ 
          where: { id: recipientId }, 
          select: { 
            role: true, 
            creatorProfile: { select: { tier1Price: true, tier1Duration: true, tier2Price: true, tier2Duration: true, tier3Price: true, tier3Duration: true } } 
          } 
        });

        const messagesSent = conversation.messages.length;
        if (recipient?.role === "CREATOR") {
          const follow = await prisma.follow.findUnique({ where: { followerId_followingId: { followerId: userId, followingId: recipientId } } });
          return callback?.({ tier: follow?.subscriptionTier || 0, recipientRole: "CREATOR", messagesSent, creatorProfile: recipient.creatorProfile });
        }
        callback?.({ tier: 3, recipientRole: "USER", messagesSent });
      } catch (err) {
        callback?.({ tier: 0, recipientRole: "USER", messagesSent: 0 });
      }
    });

    // Handle Set Public Key (Zero POST)
    socket.on('set_public_key', async (data, callback) => {
      const { publicKeyJwk } = data;
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { publicKey: publicKeyJwk }
        });
        callback?.({ success: true });
      } catch (err) {
        callback?.({ success: false });
      }
    });

    // Handle Save Key Backup (Zero POST)
    socket.on('save_key_backup', async (data, callback) => {
      const { encryptedPrivateKey } = data;
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { encryptedPrivateKey }
        });
        callback?.({ success: true });
      } catch (err) {
        callback?.({ success: false });
      }
    });

    // --- SIGNAL PROTOCOL HANDLERS ---

    // Upload PreKey Bundle
    socket.on('upload_prekeys', async (data, callback) => {
      const { signedPreKey, signedPreKeySignature, oneTimePreKeys } = data;
      try {
        await prisma.$transaction([
          // Update Identity/Signed PreKey
          prisma.user.update({
            where: { id: userId },
            data: { signedPreKey, signedPreKeySignature }
          }),
          // Add One-Time PreKeys
          prisma.preKey.createMany({
            data: oneTimePreKeys.map((pk) => ({ userId, publicKey: pk }))
          })
        ]);
        callback?.({ success: true });
      } catch (err) {
        console.error('[Signal] Upload failed:', err);
        callback?.({ success: false });
      }
    });

    // Get PreKey Bundle for Peer
    socket.on('get_prekey_bundle', async (data, callback) => {
      const { targetUserId } = data;
      try {
        const user = await prisma.user.findUnique({
          where: { id: targetUserId },
          select: { id: true, publicKey: true, signedPreKey: true, signedPreKeySignature: true }
        });
        if (!user) return callback?.({ success: false });

        // Get one random unused pre-key
        const otpk = await prisma.preKey.findFirst({
          where: { userId: targetUserId, isUsed: false },
          orderBy: { createdAt: 'asc' } // Oldest first
        });

        // Mark as used immediately to prevent reuse (X3DH property)
        if (otpk) {
          await prisma.preKey.update({ where: { id: otpk.id }, data: { isUsed: true } });
        }

        callback?.({
          success: true,
          bundle: {
            identityKey: user.publicKey,
            signedPreKey: user.signedPreKey,
            signedPreKeySignature: user.signedPreKeySignature,
            oneTimePreKey: otpk?.publicKey || null
          }
        });
      } catch (err) {
        callback?.({ success: false });
      }
    });

    // Handle Get Conversations (Zero POST)
    socket.on('get_conversations', async (data, callback) => {
      try {
        const rawConversations = await prisma.conversation.findMany({
          where: {
            OR: [{ user1Id: userId }, { user2Id: userId }],
            status: { in: ["ACCEPTED", "PENDING"] }
          },
          include: {
            user1: { select: { id: true, username: true, name: true, image: true, lastSeen: true, isActivityStatusEnabled: true, publicKey: true } },
            user2: { select: { id: true, username: true, name: true, image: true, lastSeen: true, isActivityStatusEnabled: true, publicKey: true } },
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              select: { 
                id: true, text: true, createdAt: true, type: true, 
                senderId: true, isRead: true, encrypted: true, iv: true, 
                encryptionSalt: true, mediaUrl: true, repliedToId: true 
              }
            },
            _count: { select: { messages: true } }
          },
          orderBy: { lastMessageAt: 'desc' }
        });

        const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
        const conversations = rawConversations.filter(c => {
           if (c.status === "ACCEPTED") return true;
           if (me?.role !== "CREATOR") return true;
           if (c.messages.length > 0 && c.messages[0].senderId === userId) return true;
           return false;
        });

        callback?.({ success: true, conversations });
      } catch (error) {
        console.error("[Socket] get_conversations error:", error);
        callback?.({ success: false, error: "Failed to fetch conversations" });
      }
    });

    // Handle Get Requests (Zero POST)
    socket.on('get_requests', async (data, callback) => {
      try {
        const requests = await prisma.conversation.findMany({
          where: {
            OR: [{ user1Id: userId }, { user2Id: userId }],
            status: "PENDING"
          },
          include: {
            user1: { select: { id: true, username: true, name: true, image: true, publicKey: true } },
            user2: { select: { id: true, username: true, name: true, image: true, publicKey: true } },
            messages: { take: 1, orderBy: { createdAt: 'asc' } }
          },
          orderBy: { lastMessageAt: 'desc' }
        });

        // For creators, only show requests they did NOT initiate
        const receivedRequests = requests.filter(req => {
          if (req.messages.length > 0) return req.messages[0].senderId !== userId;
          return true;
        });

        callback?.({ success: true, requests: receivedRequests });
      } catch (error) {
        callback?.({ success: false, error: "Failed to fetch requests" });
      }
    });

    socket.on('get_unread_notifications', async (data, callback) => {
      try {
        const count = await prisma.notification.count({
          where: { userId: userId, isRead: false }
        });
        callback?.({ success: true, count });
      } catch (error) {
        callback?.({ success: false, count: 0 });
      }
    });

    // Handle Get Unread Messages Count (Zero POST)
    socket.on('get_unread_messages_count', async (data, callback) => {
      try {
        const count = await prisma.message.count({
          where: {
            isRead: false,
            senderId: { not: userId },
            conversation: {
              OR: [
                { user1Id: userId },
                { user2Id: userId }
              ]
            }
          }
        });
        callback?.({ success: true, count });
      } catch (error) {
        console.error('[Socket] get_unread_messages_count error:', error);
        callback?.({ success: false, count: 0 });
      }
    });

    // Handle Activity Ping (Zero POST)
    socket.on('ping', async (data, callback) => {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { lastSeen: new Date() }
        });
        callback?.({ success: true });
      } catch (error) {
        callback?.({ success: false });
      }
    });

    // Handle Infinite Scroll Feed (Zero POST)
    socket.on('get_feed', async (data, callback) => {
      const { cursor, limit = 10 } = data;
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            mutedWords: true,
            follows: { 
              where: { following: { isGhost: false } },
              select: { followingId: true }
            }
          }
        });

        const followingIds = user?.follows.map(f => f.followingId) || [];
        const mutedWords = user?.mutedWords || [];

        let posts = [];
        const commonSelect = {
          id: true, 
          caption: true, 
          createdAt: true, 
          isPremium: true, 
          price: true, 
          authorId: true,
          author: { select: { username: true, name: true, image: true, lastSeen: true, isActivityStatusEnabled: true } },
          purchases: { where: { userId } },
          likes: { where: { userId } },
          _count: { select: { likes: true } },
          comments: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: { user: { select: { username: true, name: true, image: true } } }
          }
        };

        const whereBase = {
          author: { isGhost: false },
          isPrivate: false,
          ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {})
        };

        if (followingIds.length > 0) {
          posts = await prisma.post.findMany({
            where: { ...whereBase, authorId: { in: followingIds } },
            select: commonSelect,
            orderBy: { createdAt: 'desc' },
            take: limit
          });
        } else {
          // Mix logic for users not following anyone
          const [freePosts, premiumPosts] = await Promise.all([
            prisma.post.findMany({
              where: { ...whereBase, isPremium: false },
              take: Math.ceil(limit / 2),
              select: commonSelect,
              orderBy: { createdAt: 'desc' }
            }),
            prisma.post.findMany({
              where: { ...whereBase, isPremium: true },
              take: Math.floor(limit / 2),
              select: commonSelect,
              orderBy: { createdAt: 'desc' }
            })
          ]);
          posts = [...freePosts, ...premiumPosts].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }

        // Apply Muted Words Filtering
        if (mutedWords.length > 0) {
          posts = posts.filter(post => {
            const caption = (post.caption || '').toLowerCase();
            return !mutedWords.some(word => caption.includes(word.toLowerCase()));
          });
        }

        const nextCursor = posts.length > 0 ? posts[posts.length - 1].createdAt : null;
        callback?.({ success: true, posts, nextCursor });
      } catch (err) {
        console.error('[Socket] get_feed error:', err);
        callback?.({ success: false, error: "Failed to fetch feed" });
      }
    });

    // Handle Reels Fetching (Zero POST + Virality Algorithm)
    socket.on('get_reels', async (data, callback) => {
      const { page = 0, limit = 20 } = data;
      try {
        // Fetch a large pool for scoring
        const dbReels = await prisma.reel.findMany({
          take: 100,
          include: {
            author: {
              select: { 
                  id: true, username: true, name: true, image: true,
                  followers: { where: { followerId: userId } }
               }
            },
            purchases: { where: { userId } },
            likes: { where: { userId } },
            upvotes: { where: { userId } },
            _count: { select: { likes: true, upvotes: true, comments: true } }
          },
          orderBy: { createdAt: 'desc' }
        });

        // Virality Algorithm
        const scoredReels = dbReels.map(r => {
          const ageInHours = (Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60);
          const engagement = (r._count.likes * 1) + (r._count.upvotes * 10) + (r._count.comments * 5);
          const viralityScore = engagement / Math.pow(ageInHours + 2, 1.8);
          
          // Format for frontend
          const isOwner = userId === r.authorId;
          const follow = r.author.followers[0];
          const isSubscribed = !!follow && (
            (follow.expiresAt && new Date(follow.expiresAt).getTime() > Date.now()) ||
            (!follow.expiresAt && (follow.subscriptionTier || 0) > 0)
          );
          const isPurchased = r.purchases.length > 0;
          const isUnlocked = !r.isPremium || isOwner || isSubscribed || isPurchased;

          return {
            id: r.id,
            url: r.videoUrl,
            authorId: r.author.id,
            authorName: r.author.name,
            authorUsername: r.author.username,
            authorImage: r.author.image,
            isUnlocked,
            isPremium: r.isPremium,
            price: r.price,
            likesCount: r._count.likes,
            upvotesCount: r._count.upvotes,
            commentsCount: r._count.comments,
            isLiked: r.likes.length > 0,
            isUpvoted: r.upvotes.length > 0,
            viralityScore
          };
        }).sort((a, b) => b.viralityScore - a.viralityScore);

        const startIndex = page * limit;
        const reelsBatch = scoredReels.slice(startIndex, startIndex + limit);

        callback?.({ success: true, reels: reelsBatch, hasMore: scoredReels.length > startIndex + limit });
      } catch (err) {
        console.error('[Socket] get_reels error:', err);
        callback?.({ success: false, error: "Failed to fetch reels" });
      }
    });

    // Handle Reel Actions (Zero POST)
    socket.on('reel_like', async (data, callback) => {
      const { reelId } = data;
      try {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { isGhost: true } });
        if (user?.isGhost) return callback?.({ success: false, error: "Ghost accounts cannot like." });

        const reel = await prisma.reel.findUnique({ where: { id: reelId }, select: { authorId: true } });
        if (!reel) return callback?.({ success: false, error: "Reel not found." });

        const existingLike = await prisma.reelLike.findUnique({
          where: { userId_reelId: { userId, reelId } }
        });

        let isLiked = false;
        if (existingLike) {
          await prisma.reelLike.delete({ where: { id: existingLike.id } });
          isLiked = false;
        } else {
          await prisma.reelLike.create({ data: { userId, reelId } });
          isLiked = true;
        }

        const stats = await prisma.reelLike.count({ where: { reelId } });
        callback?.({ success: true, isLiked, likesCount: stats });
      } catch (err) {
        console.error('[Socket] reel_like error:', err);
        callback?.({ success: false, error: "Server error" });
      }
    });

    socket.on('reel_upvote', async (data, callback) => {
      const { reelId } = data;
      try {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { isGhost: true } });
        if (user?.isGhost) return callback?.({ success: false, error: "Ghost accounts cannot upvote." });

        const reel = await prisma.reel.findUnique({ where: { id: reelId }, select: { authorId: true } });
        if (!reel) return callback?.({ success: false, error: "Reel not found." });

        const existingUpvote = await prisma.reelUpvote.findUnique({
          where: { userId_reelId: { userId, reelId } }
        });

        let isUpvoted = false;
        if (existingUpvote) {
          await prisma.reelUpvote.delete({ where: { id: existingUpvote.id } });
          isUpvoted = false;
        } else {
          await prisma.reelUpvote.create({ data: { userId, reelId } });
          isUpvoted = true;
        }

        const stats = await prisma.reelUpvote.count({ where: { reelId } });
        callback?.({ success: true, isUpvoted, upvotesCount: stats });
      } catch (err) {
        console.error('[Socket] reel_upvote error:', err);
        callback?.({ success: false, error: "Server error" });
      }
    });

    socket.on('reel_comment', async (data, callback) => {
      const { reelId, text } = data;
      try {
        if (!text?.trim()) return callback?.({ success: false, error: "Comment text required." });
        
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { isGhost: true } });
        if (user?.isGhost) return callback?.({ success: false, error: "Ghost accounts cannot comment." });

        const comment = await prisma.reelComment.create({
          data: { userId, reelId, text: text.trim() },
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

        callback?.({ success: true, comment });
      } catch (err) {
        console.error('[Socket] reel_comment error:', err);
        callback?.({ success: false, error: "Server error" });
      }
    });

    socket.on('get_reel_comments', async (data, callback) => {
      const { reelId, skip = 0, take = 10 } = data;
      try {
        const [comments, totalCount] = await Promise.all([
          prisma.reelComment.findMany({
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
          }),
          prisma.reelComment.count({ where: { reelId } })
        ]);

        callback?.({ 
          success: true, 
          comments, 
          hasMore: skip + take < totalCount 
        });
      } catch (err) {
        console.error('[Socket] get_reel_comments error:', err);
        callback?.({ success: false, comments: [] });
      }
    });

    // Handle Reel Stats (Zero POST)


  });

  // Initialize the singleton manager
  socketManager.init(io);

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Real-time messaging active via Socket.io`);
  });
});
