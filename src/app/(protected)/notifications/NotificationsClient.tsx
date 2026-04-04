"use client";

import React, { useEffect, useState } from 'react';
import { prisma } from '@/app/lib/prisma';
import { useSession } from 'next-auth/react';
import { Bell, Check, X, ShieldAlert, UserPlus, LogIn, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { approveFollowRequest, declineFollowRequest } from '@/app/actions/follow';
import { markNotificationRead } from '@/app/actions/security-actions';
import Image from 'next/image';

// We'll fetch notifications via a server component and pass to this client or just use a client fetch
// For speed, let's define the client component here and we'll create the page.tsx to fetch

export default function NotificationsClient({ userId, initialNotifications }: { userId: string, initialNotifications: any[] }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleApprove = async (notificationId: string, followerId: string) => {
    setLoading(prev => ({ ...prev, [notificationId]: true }));
    const res = await approveFollowRequest(notificationId, followerId, userId);
    if (res.success) {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      window.dispatchEvent(new Event('notifications-updated'));
    }
    setLoading(prev => ({ ...prev, [notificationId]: false }));
  };

  const handleDecline = async (notificationId: string, followerId: string) => {
    setLoading(prev => ({ ...prev, [notificationId]: true }));
    const res = await declineFollowRequest(notificationId, followerId, userId);
    if (res.success) {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      window.dispatchEvent(new Event('notifications-updated'));
    }
    setLoading(prev => ({ ...prev, [notificationId]: false }));
  };

  const handleDismiss = async (notificationId: string) => {
    const res = await markNotificationRead(notificationId);
    if (res.success) {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      window.dispatchEvent(new Event('notifications-updated'));
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
            Notifications <span className="text-yellow-400">Hub</span>
          </h1>
          <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mt-2">Manage your alerts and requests</p>
        </div>
        <div className="bg-zinc-900/50 border border-border-theme px-4 py-2 rounded-2xl flex items-center gap-2">
          <Bell size={16} className="text-yellow-400" />
          <span className="text-xs font-black text-white">{notifications.length} Active</span>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <motion.div
                key={notif.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-900/30 border border-border-theme rounded-[2rem] p-6 hover:bg-zinc-900/50 transition-all group"
              >
                <div className="flex items-start gap-5">
                  <div className={`p-4 rounded-2xl flex-shrink-0 ${
                    notif.type === 'NEW_LOGIN' ? 'bg-red-500/10 text-red-500' :
                    notif.type === 'FOLLOW_REQUEST' ? 'bg-purple-500/10 text-purple-500' :
                    'bg-zinc-800 text-zinc-400'
                  }`}>
                    {notif.type === 'NEW_LOGIN' ? <ShieldAlert size={24} /> :
                     notif.type === 'FOLLOW_REQUEST' ? <UserPlus size={24} /> :
                     <Bell size={24} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-bold text-zinc-400 uppercase tracking-tight">
                        {notif.type === 'NEW_LOGIN' ? 'Security Alert' :
                         notif.type === 'FOLLOW_REQUEST' ? 'Follow Request' :
                         'Update'}
                      </p>
                      <span className="text-[10px] text-zinc-600 font-black uppercase">
                        {mounted ? new Date(notif.createdAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <p className="text-white text-base font-black mt-1 leading-tight">{notif.message}</p>

                    {notif.type === 'FOLLOW_REQUEST' && (
                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={() => handleApprove(notif.id, notif.relatedId!)}
                          disabled={loading[notif.id]}
                          className="flex-1 md:flex-none px-8 py-3 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-purple-500 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                          {loading[notif.id] ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14} /> Approve</>}
                        </button>
                        <button
                          onClick={() => handleDecline(notif.id, notif.relatedId!)}
                          disabled={loading[notif.id]}
                          className="flex-1 md:flex-none px-8 py-3 bg-zinc-800 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-red-500 transition-all flex items-center justify-center gap-2"
                        >
                          <X size={14} /> Decline
                        </button>
                      </div>
                    )}

                    {notif.type !== 'FOLLOW_REQUEST' && (
                      <button
                        onClick={() => handleDismiss(notif.id)}
                        className="mt-6 px-6 py-2 bg-zinc-800/50 text-white font-black uppercase tracking-widest text-[8px] rounded-lg hover:bg-zinc-800 transition-all opacity-0 group-hover:opacity-100"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-24 flex flex-col items-center justify-center border-2 border-dashed border-zinc-900 rounded-[3rem]">
              <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6">
                <Bell size={24} className="text-zinc-700" />
              </div>
              <h3 className="text-xl font-black uppercase italic tracking-tighter text-zinc-500">No New Notifications</h3>
              <p className="text-[10px] font-black uppercase text-zinc-700 tracking-[0.2em] mt-2">Check back later for updates</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
