"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

type SocketStatus = 'connecting' | 'connected' | 'disconnected';
type SocketListener = (data: any) => void;

interface SocketActionsContextValue {
  on: (event: string, listener: SocketListener) => () => void;
  off: (event: string) => void;
  throttleAction: (actionName: string, action: () => Promise<void>, delay?: number) => Promise<void>;
  emit: (event: string, data: any, callback?: (response: any) => void) => void;
}

interface SocketStatusContextValue {
  status: SocketStatus;
}

const SocketActionsContext = createContext<SocketActionsContextValue | null>(null);
const SocketStatusContext = createContext<SocketStatusContextValue | null>(null);

/**
 * Socket Provider — maintains ONE Socket.io connection for the entire app.
 */
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SocketStatus>('disconnected');
  const socketRef = useRef<any>(null);
  const listenersRef = useRef<Map<string, Set<SocketListener>>>(new Map());
  const throttleRef = useRef<Map<string, number>>(new Map());
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (socketRef.current || !mountedRef.current) return;

    setStatus('connecting');
    const socket = io({
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (!mountedRef.current) return;
      console.log('[Socket] Connected');
      setStatus('connected');
    });

    socket.on('disconnect', () => {
      if (!mountedRef.current) return;
      console.log('[Socket] Disconnected');
      setStatus('disconnected');
    });

    socket.on('connect_error', (error) => {
      if (!mountedRef.current) return;
      console.warn('[Socket] Connection Error:', error);
      setStatus('disconnected');
    });

    // Listen for generic events and route to registered listeners
    const handleEvent = (event: string, data: any) => {
      if (!mountedRef.current) return;
      const eventListeners = listenersRef.current.get(event);
      if (eventListeners) {
        eventListeners.forEach(listener => listener(data));
      }
    };

    // We can use a catch-all listener in Socket.io v4
    socket.onAny((event, data) => handleEvent(event, data));

  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [connect]);

  // STABLE ACTIONS
  const on = useCallback((event: string, listener: SocketListener) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(listener);
    return () => {
      listenersRef.current.get(event)?.delete(listener);
    };
  }, []);

  const off = useCallback((event: string) => {
    listenersRef.current.delete(event);
  }, []);

  const throttleAction = useCallback(async (actionName: string, action: () => Promise<void>, delay = 30000) => {
    const now = Date.now();
    const lastFired = throttleRef.current.get(actionName) || 0;
    
    if (now - lastFired < delay) return;
    
    throttleRef.current.set(actionName, now);
    await action();
  }, []);

  const emit = useCallback((event: string, data: any, callback?: (response: any) => void) => {
    if (socketRef.current && socketRef.current.connected) {
      if (callback) {
        socketRef.current.emit(event, data, callback);
      } else {
        socketRef.current.emit(event, data);
      }
    }
  }, []);

  const actionsValue = React.useMemo(() => ({
    on,
    off,
    throttleAction,
    emit
  }), [on, off, throttleAction, emit]);

  const statusValue = React.useMemo(() => ({
    status
  }), [status]);

  return (
    <SocketActionsContext.Provider value={actionsValue}>
      <SocketStatusContext.Provider value={statusValue}>
        {children}
      </SocketStatusContext.Provider>
    </SocketActionsContext.Provider>
  );
}

/**
 * Hook to use Socket.io connection.
 */
export function useSocket() {
  const actions = useContext(SocketActionsContext);
  const statusContext = useContext(SocketStatusContext);
  
  if (!actions || !statusContext) {
    throw new Error('useSocket must be used within a SocketProvider');
  }

  return {
    on: actions.on,
    off: actions.off,
    throttleAction: actions.throttleAction,
    emit: actions.emit,
    status: statusContext.status
  };
}
