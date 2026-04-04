"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { X, Loader2, Users, Crown, MessageCircle, Check } from 'lucide-react';
import { getCreatorFollowers, getCreatorSubscribers, sendKiss } from '@/app/actions/user-actions';

interface PanelUser {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  role: string;
}

interface FollowersPanelProps {
  isOpen: boolean;
  defaultTab: 'followers' | 'subscribers';
  creatorId: string;
  onClose: () => void;
}

const KissIcon = ({ className, filled }: { className?: string; filled?: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 21.5c-3.5 0-6.5-2.5-8-6.502.5-1.5 2-2.5 4-2.5 1.5 0 3 1 4 2.5 1-1.5 2.5-2.5 4-2.5 2 0 3.5 1 4 2.5-1.5 4-4.5 6.502-8 6.502z" />
    <path d="M12 12.5c-2.5 0-4.5-1-6-2.502.5-1.5 2-2.5 4-2.5 1 0 2 .5 2 1.5 0-1 1-1.5 2-1.5 2 0 3.5 1 4 2.5-1.5 1.502-3.5 2.502-6 2.502z" />
  </svg>
);

const BATCH = 50;

export default function FollowersPanel({ isOpen, defaultTab, creatorId, onClose }: FollowersPanelProps) {
  const [activeTab, setActiveTab] = useState<'followers' | 'subscribers'>(defaultTab);
  const [users, setUsers] = useState<PanelUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [kissedIds, setKissedIds] = useState<Set<string>>(new Set());
  const [kissingId, setKissingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef(0);

  const fetchBatch = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);
    const skip = reset ? 0 : skipRef.current;

    const res = activeTab === 'followers'
      ? await getCreatorFollowers(creatorId, skip, BATCH)
      : await getCreatorSubscribers(creatorId, skip, BATCH);

    if (res.success) {
      const newUsers = res.users as PanelUser[];
      setUsers(prev => reset ? newUsers : [...prev, ...newUsers]);
      setTotal(res.total);
      skipRef.current = skip + newUsers.length;
      setHasMore(skipRef.current < res.total);
    }
    setLoading(false);
    setInitialLoading(false);
  }, [activeTab, creatorId, loading]);

  // Reset and fetch on tab change or open
  useEffect(() => {
    if (!isOpen) return;
    skipRef.current = 0;
    setUsers([]);
    setHasMore(true);
    setInitialLoading(true);
    fetchBatch(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isOpen]);

  // Sync default tab when panel opens
  useEffect(() => {
    if (isOpen) setActiveTab(defaultTab);
  }, [isOpen, defaultTab]);

  // Infinite scroll
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || loading || !hasMore) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
      fetchBatch();
    }
  };

  const handleKiss = async (userId: string) => {
    if (kissingId) return;
    setKissingId(userId);
    const res = await sendKiss(creatorId, userId);
    if (res.success) {
      setKissedIds(prev => new Set(prev).add(userId));
    }
    setKissingId(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md z-[90] bg-zinc-950 border-l border-border-theme flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border-theme bg-zinc-900/80 backdrop-blur-md flex-shrink-0">
              <div>
                <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">
                  {activeTab === 'followers' ? 'Followers' : 'Subscribers'}
                </h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-0.5">
                  {total.toLocaleString()} total
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl border border-border-theme transition-all"
              >
                <X size={18} className="text-zinc-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex px-6 pt-4 pb-0 gap-4 flex-shrink-0">
              <button
                onClick={() => setActiveTab('followers')}
                className={`flex items-center gap-2 pb-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'followers' ? 'border-purple-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
              >
                <Users size={14} /> Followers
              </button>
              <button
                onClick={() => setActiveTab('subscribers')}
                className={`flex items-center gap-2 pb-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'subscribers' ? 'border-amber-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
              >
                <Crown size={14} /> Subscribers
              </button>
            </div>

            <div className="h-px bg-border-theme mx-6 mb-2 flex-shrink-0" />

            {/* List */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto no-scrollbar"
            >
              {initialLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 size={32} className="text-purple-500 animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Loading…</p>
                </div>
              ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  {activeTab === 'followers'
                    ? <Users size={40} className="text-zinc-800" />
                    : <Crown size={40} className="text-zinc-800" />
                  }
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                    No {activeTab} yet
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border-theme/50">
                  {users.map((u) => (
                    <div key={u.id} className="flex items-center gap-3 px-6 py-4 hover:bg-zinc-900/50 transition-all group">
                      {/* Avatar + Name → Profile Link */}
                      <Link
                        href={`/profile/${u.id}`}
                        onClick={onClose}
                        className="flex items-center gap-3 flex-1 min-w-0 group/link"
                      >
                        <div className="w-11 h-11 rounded-full overflow-hidden relative border border-border-theme flex-shrink-0 group-hover/link:border-purple-500/50 transition-colors">
                          <Image
                            src={u.image || '/default_user_profile/default-avatar.png'}
                            alt={u.username}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-black italic uppercase tracking-tighter text-white group-hover/link:text-purple-400 transition-colors truncate leading-none mb-0.5">
                            {u.name || u.username}
                          </span>
                          <span className="text-[10px] font-bold text-zinc-500 lowercase truncate">
                            @{u.username}
                          </span>
                        </div>
                      </Link>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Kiss Button */}
                        <button
                          onClick={() => handleKiss(u.id)}
                          disabled={!!kissingId || kissedIds.has(u.id)}
                          title={kissedIds.has(u.id) ? 'Kiss sent!' : 'Send a kiss'}
                          className={`p-2 rounded-xl border transition-all ${
                            kissedIds.has(u.id)
                              ? 'bg-red-500/20 border-red-500/30 text-red-400 cursor-default'
                              : 'bg-zinc-800 border-border-theme text-zinc-400 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400'
                          } disabled:opacity-60`}
                        >
                          {kissingId === u.id ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : kissedIds.has(u.id) ? (
                            <Check size={15} />
                          ) : (
                            <KissIcon className="w-[15px] h-[15px]" />
                          )}
                        </button>

                        {/* Message Button */}
                        <Link
                          href={`/messages`}
                          onClick={onClose}
                          title="Send message"
                          className="p-2 bg-zinc-800 border border-border-theme text-zinc-400 rounded-xl hover:bg-purple-500/10 hover:border-purple-500/30 hover:text-purple-400 transition-all"
                        >
                          <MessageCircle size={15} />
                        </Link>
                      </div>
                    </div>
                  ))}

                  {/* Load more indicator */}
                  {loading && !initialLoading && (
                    <div className="flex justify-center py-6">
                      <Loader2 size={20} className="text-purple-500 animate-spin" />
                    </div>
                  )}
                  {!hasMore && users.length > 0 && (
                    <div className="flex justify-center py-6">
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-700">
                        All {activeTab} loaded
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
