"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { getUnreadLoginAlerts, markNotificationRead, revokeSession } from '@/app/actions/security-actions';
import { useSocket } from '@/hooks/useSocket';

interface GlobalAuthListenerProps {
  userId: string;
}

export default function GlobalAuthListener({ userId }: GlobalAuthListenerProps) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const { on, throttleAction } = useSocket();

  useEffect(() => {
    const fetchAlerts = async () => {
      const res = await getUnreadLoginAlerts(userId);
      if (res.success && res.alerts && res.alerts.length > 0) {
        setAlerts(res.alerts);
      }
    };

    // Use shared throttle from context (30s)
    throttleAction('fetchAlerts', fetchAlerts);

    // Listen for real-time security alerts via SSE (always bypasses throttle)
    const unsubNotification = on('notification', () => {
      fetchAlerts();
    });

    return () => {
      unsubNotification();
    };
  }, [userId, on]);

  const handleRevoke = async (notificationId: string, relatedId: string | null) => {
    if (relatedId) {
      await revokeSession(relatedId);
    }
    await markNotificationRead(notificationId);
    setAlerts(prev => prev.filter(a => a.id !== notificationId));
    window.dispatchEvent(new Event('notifications-updated'));
  };

  const handleDismiss = async (notificationId: string) => {
    await markNotificationRead(notificationId);
    setAlerts(prev => prev.filter(a => a.id !== notificationId));
    window.dispatchEvent(new Event('notifications-updated'));
  };

  return (
    <AnimatePresence>
      {alerts.map((alert, index) => (
        <motion.div
          key={alert.id}
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          style={{ top: `${index * 130 + 20}px` }}
          className="fixed left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-md bg-zinc-950 border-2 border-red-500/50 rounded-3xl p-6 shadow-2xl shadow-red-500/20 backdrop-blur-xl"
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] uppercase font-black px-3 py-1 rounded-full tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            Security Alert
          </div>

          <button onClick={() => handleDismiss(alert.id)} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition">
            <X size={20} />
          </button>

          <div className="flex items-start gap-4 mt-2">
            <div className="bg-red-500/20 p-3 rounded-2xl flex-shrink-0">
              <AlertTriangle className="text-red-500" size={24} />
            </div>
            <div>
              <h3 className="text-white font-black uppercase tracking-tight text-sm">New Login Attempt</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                {alert.message.split('Device: ')[0]}<br/>
                <span className="text-white font-bold opacity-100">{alert.message.split('Device: ')[1]}</span>
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => handleDismiss(alert.id)}
              className="flex-1 py-3 bg-zinc-900 border border-border-theme hover:bg-zinc-800 text-white rounded-xl text-[10px] uppercase font-black transition-colors"
            >
              It Was Me
            </button>
            <button
              onClick={() => handleRevoke(alert.id, alert.relatedId)}
              className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] uppercase font-black transition-colors shadow-lg shadow-red-600/20"
            >
              Revoke Login
            </button>
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
