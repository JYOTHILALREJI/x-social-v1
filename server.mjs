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
      const { conversationId, text, type, mediaUrl, expiresAt, viewLimit, duration, encrypted, iv } = data;
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
            mediaUrl, expiresAt, viewLimit, viewCount: 0, duration, encrypted, iv
          },
          include: { sender: { select: { id: true, username: true, image: true } } }
        });

        await prisma.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } });
        const senderData = await prisma.user.findUnique({ where: { id: userId }, select: { publicKey: true } });

        io.to(`user:${recipientId}`).emit('new_message', { conversationId, message, senderPublicKey: senderData?.publicKey });
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
        const rawMessages = await prisma.message.findMany({
          where: { conversationId },
          orderBy: { createdAt: 'desc' },
          skip, take,
          include: { sender: { select: { id: true, username: true, image: true } } }
        });
        const messages = rawMessages.map(msg => {
          const isExpired = msg.expiresAt && new Date() > msg.expiresAt;
          const isLimitReached = msg.viewLimit && msg.viewCount >= msg.viewLimit;
          if (isExpired || isLimitReached) return { ...msg, mediaUrl: null, text: "Media Expired" };
          return msg;
        });
        callback?.({ success: true, messages: messages.reverse() });
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
              select: { text: true, createdAt: true, type: true, senderId: true, isRead: true, encrypted: true, iv: true, mediaUrl: true }
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

    // Handle Get Unread Notifications (Zero POST)
    socket.on('get_unread_notifications', async (data, callback) => {
      try {
        const count = await prisma.notification.count({
          where: { recipientId: userId, isRead: false }
        });
        callback?.({ success: true, count });
      } catch (error) {
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
  });

  // Initialize the singleton manager
  socketManager.init(io);

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Real-time messaging active via Socket.io`);
  });
});
