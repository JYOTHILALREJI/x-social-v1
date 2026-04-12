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
          where: {
            conversationId,
            senderId: { not: userId },
            isRead: false
          },
          data: { isRead: true }
        });

        if (result.count > 0) {
          const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            select: { user1Id: true, user2Id: true }
          });

          if (conversation) {
            const otherId = conversation.user1Id === userId ? conversation.user2Id : conversation.user1Id;
            io.to(`user:${otherId}`).emit('message_read', {
              conversationId,
              readBy: userId
            });
          }
        }
      } catch (err) {
        console.error('[Socket] Mark read failed:', err);
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
