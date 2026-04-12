import { Server as SocketServer } from 'socket.io';

/**
 * Socket.io Manager (Server-Side Singleton)
 * 
 * Manages active Socket connections for real-time messaging.
 * Replaces the old SSEManager.
 */
class SocketManager {
  private io: SocketServer | null = null;
  private typingThrottles: Map<string, number> = new Map();

  /**
   * Initialize the Socket server instance.
   * Called once by the custom server on startup.
   */
  init(io: SocketServer) {
    this.io = io;
    console.log('[Socket] Manager initialized');
  }

  /**
   * Send an event to a specific user's room.
   */
  sendToUser(userId: string, event: string, data: any) {
    if (!this.io) {
      // In a Next.js Server Action worker, this.io is null. We route via IPC.
      fetch(`http://127.0.0.1:${process.env.PORT || 3000}/api/internal/socket-emit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, event, data })
      }).catch(err => console.error('[Socket] IPC emit failed:', err));
      return;
    }
    this.io.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Send to multiple users.
   */
  sendToUsers(userIds: string[], event: string, data: any) {
    userIds.forEach(id => this.sendToUser(id, event, data));
  }

  /**
   * Broadcast a typing indicator with rate limiting.
   */
  async sendTypingIndicator(conversationId: string, senderId: string, recipientId: string) {
    const key = `${senderId}:${conversationId}`;
    const now = Date.now();
    const lastSent = this.typingThrottles.get(key) || 0;

    // 2-second throttle for typing indicators
    if (now - lastSent < 2000) return;

    this.typingThrottles.set(key, now);
    this.sendToUser(recipientId, 'typing', { conversationId, userId: senderId });
  }

  /**
   * Check if the manager is ready.
   */
  isReady(): boolean {
    return this.io !== null;
  }
}

// Global singleton — survives hot reloads in dev
const globalForSocket = globalThis as unknown as { socketManager: SocketManager };
export const socketManager = globalForSocket.socketManager ?? new SocketManager();

if (process.env.NODE_ENV !== 'production') {
  globalForSocket.socketManager = socketManager;
}
