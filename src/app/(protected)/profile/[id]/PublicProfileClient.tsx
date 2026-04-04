"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Grid, Play, Loader2, Lock, Users, Star, Crown, Heart, Sparkles, ChevronRight, Wallet, Plus } from 'lucide-react';
import { toggleFollow } from '@/app/actions/follow';
import { subscribeToCreator, purchaseContent } from '@/app/actions/user-actions';
import { motion, AnimatePresence } from 'framer-motion';
import PurchaseConfirmationModal from '@/components/PurchaseConfirmationModal';
import BlockConfirmationModal from '@/components/BlockConfirmationModal';
import UserStatusDot from '@/components/UserStatusDot';
import { blockUser } from '@/app/actions/block';
import { MoreHorizontal, UserX, Flag, Share2, UserMinus, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { requestConversation } from '@/app/actions/message-actions';

interface PublicProfileClientProps {
  currentUserId: string;
  currentUserBalance: number;
  currentIsGhost: boolean;
  currentUserRole?: string;
  profile: any;
  isInitialFollowing: boolean;
  initialSubscriptionTier: number;
  followStatus: string | null;
  isRestricted: boolean;
}

export default function PublicProfileClient({ 
  currentUserId, 
  currentUserBalance,
  currentIsGhost,
  currentUserRole,
  profile, 
  isInitialFollowing, 
  initialSubscriptionTier,
  followStatus: initialFollowStatus,
  isRestricted
}: PublicProfileClientProps) {
  const router = useRouter(); 
  const [activeTab, setActiveTab] = useState<'posts' | 'reels'>('posts');
  const [isFollowing, setIsFollowing] = useState(isInitialFollowing);
  const [followStatus, setFollowStatus] = useState<string | null>(initialFollowStatus);
  const [subscriptionTier, setSubscriptionTier] = useState(initialSubscriptionTier);
  const [showUnfollowModal, setShowUnfollowModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [purchasedItems, setPurchasedItems] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0); 
  const [loadingMedia, setLoadingMedia] = useState<Record<string, boolean>>({});
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(false);

  type PendingTransaction = {
    type: 'subscribe' | 'post' | 'reel';
    id?: string;
    tier?: 1 | 2 | 3;
    amount: number;
    name: string;
  } | null;
  const [pendingTransaction, setPendingTransaction] = useState<PendingTransaction>(null);

  const isSubscribed = subscriptionTier > 0;

  // Helper to check if current user has access to a specific item
  const hasAccess = (item: any) => {
    if (!item.isPremium) return true;
    if (isSubscribed) return true;
    if (purchasedItems.includes(item.id)) return true;
    if (item.purchases && item.purchases.length > 0) return true;
    return false;
  };
  
  // Optimistic count
  const [followersCount, setFollowersCount] = useState(profile.followersCount || 0);
  const [subscribersCount, setSubscribersCount] = useState(profile.subscribersCount || 0);

  const isCreator = profile.role === 'CREATOR';
  const DEFAULT_AVATAR = "/default_user_profile/default-avatar.png";

  const performSubscribe = async (tier: 1 | 2 | 3, amount: number) => {
    if (currentIsGhost) return;
    if (currentUserBalance < amount) {
        alert("Insufficient wallet balance. Please top up your wallet.");
        return;
    }

    setSubscribing(true);
    const res = await subscribeToCreator(currentUserId, profile.id, tier, amount);
    if (res.success) {
        // Find all currently locked items and mark them as loading BEFORE we unlock them
        const newlyUnlocked: Record<string, boolean> = {};
        profile.posts?.forEach((p: any) => { if (!hasAccess(p)) newlyUnlocked[p.id] = true; });
        profile.reels?.forEach((r: any) => { if (!hasAccess(r)) newlyUnlocked[r.id] = true; });
        setLoadingMedia(prev => ({ ...prev, ...newlyUnlocked }));

        setSubscriptionTier(tier);
        setSubscribersCount((prev: number) => prev + 1);
        setShowSubModal(false);
        setRefreshKey(prev => prev + 1);
        router.refresh(); // Sync server state
        // Also follow if not following
        if (!isFollowing) {
            setIsFollowing(true);
            setFollowersCount((prev: number) => prev + 1);
        }
    } else {
        alert(res.error || "Failed to subscribe.");
    }
    setSubscribing(false);
    setPendingTransaction(null);
  };

  const performUnlockContent = async (contentId: string, type: 'post' | 'reel', amount: number) => {
    if (currentUserBalance < amount) {
        alert("Insufficient wallet balance. Please top up your wallet.");
        return;
    }

    setLoading(true);
    const res = await purchaseContent(currentUserId, contentId, type, amount);
    if (res.success) {
        setLoadingMedia(prev => ({ ...prev, [contentId]: true }));
        setPurchasedItems(prev => [...prev, contentId]);
        setRefreshKey(prev => prev + 1);
        router.refresh(); // Sync server state
    } else {
        alert(res.error || "Failed to unlock content.");
    }
    setLoading(false);
    setPendingTransaction(null);
  };

  const executePendingTransaction = async () => {
    if (!pendingTransaction) return;
    const { type, id, tier, amount } = pendingTransaction;
    if (type === 'subscribe') {
      await performSubscribe(tier!, amount);
    } else {
      await performUnlockContent(id!, type, amount);
    }
  };

  const handleFollowAction = async () => {
    if (currentIsGhost && !isFollowing) return;
    
    if (isFollowing) {
      setShowUnfollowModal(true);
    } else {
      setLoading(true);
      const res = await toggleFollow(currentUserId, profile.id, false);
      if (res.success) {
        if (res.status === "PENDING") {
          setFollowStatus("PENDING");
          setIsFollowing(true); // Treat pending as "following" for the button state, but status dictates text
        } else {
          setFollowStatus("ACCEPTED");
          setIsFollowing(true);
          setFollowersCount((prev: number) => prev + 1);
        }
      }
      setLoading(false);
    }
  };

  const confirmUnfollow = async () => {
    setShowUnfollowModal(false);
    setLoading(true);
    const res = await toggleFollow(currentUserId, profile.id, true);
    if (res.success) {
      setIsFollowing(false);
      setFollowStatus(null);
      if (followStatus === "ACCEPTED") {
        setFollowersCount((prev: number) => Math.max(0, prev - 1));
      }
    }
    setLoading(false);
  };

  const handleBlockAction = async () => {
    setBlocking(true);
    const res = await blockUser(profile.id);
    if (res.success) {
      router.push('/feed');
      router.refresh();
    } else {
      alert(res.error || "Failed to block user");
      setBlocking(false);
    }
  };

  const handleMessageClick = async () => {
    setLoadingMessage(true);
    const res = await requestConversation(currentUserId, profile.id);
    if (res.success) {
      router.push('/messages');
    } else {
      alert("Failed to initialize conversation.");
      setLoadingMessage(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-black text-white px-6 md:px-12 pt-10 pb-32 relative">
      
      {/* More Options Menu (Floating Top Right) */}
      <div className="absolute top-8 right-6 md:top-10 md:right-10 z-50">
        <button 
          onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
          className="p-3 bg-zinc-900 border border-border-theme hover:bg-zinc-800 backdrop-blur-md rounded-2xl transition-all shadow-xl shadow-black/40"
        >
          <MoreHorizontal size={20} className="text-zinc-400 hover:text-white transition-colors" />
        </button>

        <AnimatePresence>
          {isMoreMenuOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMoreMenuOpen(false)}
                className="fixed inset-0 z-[-1]"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute right-0 mt-3 w-48 bg-zinc-900 border border-border-theme rounded-2xl shadow-2xl overflow-hidden p-2"
              >
                <div className="space-y-1">
                  <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 rounded-xl transition-all text-left group">
                    <Share2 size={16} className="text-zinc-500 group-hover:text-white" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white">Share Profile</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 rounded-xl transition-all text-left group">
                    <Flag size={16} className="text-zinc-500 group-hover:text-white" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white">Report User</span>
                  </button>
                  {currentUserId !== profile.id && (
                    <>
                      <div className="h-px bg-border-theme !my-2 mx-2" />
                      <button 
                        onClick={() => { setIsMoreMenuOpen(false); setShowBlockConfirm(true); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 rounded-xl transition-all text-left group"
                      >
                        <UserX size={16} className="text-red-500/60 group-hover:text-red-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-500/60 group-hover:text-red-500">Block Account</span>
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* --- TOP PROFILE SECTION --- */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12 border-b border-border-theme pb-12">
        {/* Profile Image */}
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-zinc-900 border-2 border-border-theme relative overflow-hidden shrink-0 flex items-center justify-center font-black text-4xl text-zinc-600 uppercase">
           {profile.image ? (
             <Image 
               src={profile.image} 
               alt={profile.username} 
               fill 
               className="object-cover"
             />
           ) : (
              <Image 
               src={DEFAULT_AVATAR} 
               alt={profile.username} 
               fill 
               className="object-cover"
             />
           )}
        </div>
        
        {/* User Info */}
        <div className="flex-1 space-y-6 text-center md:text-left w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none mb-1">
                    {profile.name || profile.username}
                  </h1>
                  <UserStatusDot 
                    lastSeen={profile.lastSeen} 
                    isActivityStatusEnabled={profile.isActivityStatusEnabled} 
                  />
                </div>
                {profile.name && (
                  <span className="text-xs font-black text-purple-500/80 uppercase tracking-widest pl-1 italic">
                    @{profile.username}
                  </span>
                )}
              </div>
              {isCreator && (
                <span className="px-3 py-1 bg-purple-500/10 text-purple-500 text-[10px] font-black uppercase rounded-full border border-purple-500/20 self-start mt-1">
                  Verified Creator
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap gap-3 w-full md:w-auto md:pr-16">
              {isCreator && (
                <button 
                  disabled={currentIsGhost}
                  onClick={() => setShowSubModal(true)}
                  className={`flex-1 md:flex-none px-8 py-3 rounded-full font-black uppercase tracking-widest transition-all text-[10px] flex items-center justify-center gap-2 ${
                    isSubscribed 
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                    : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 shadow-xl shadow-purple-500/20"
                  } ${currentIsGhost ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <Heart size={14} className={isSubscribed ? "fill-emerald-500" : ""} />
                  {isSubscribed ? `Tier ${subscriptionTier}` : "Subscribe"}
                </button>
              )}
              <button 
                onClick={handleFollowAction}
                disabled={loading || (currentIsGhost && !isFollowing)}
                className={`flex-1 md:flex-none px-8 py-3 rounded-full font-black uppercase tracking-widest transition-all text-[10px] ${
                  isFollowing 
                  ? "border border-border-theme hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500 text-white" 
                  : "bg-zinc-900 border border-border-theme text-white hover:bg-zinc-800"
                } ${(currentIsGhost && !isFollowing) ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin mx-auto" />
                ) : followStatus === "PENDING" ? (
                  "Requested"
                ) : isFollowing ? (
                  "Following"
                ) : (
                  "Follow"
                )}
              </button>
              {/* Message button for Fans visiting Creators, or Creators visiting users */}
              {currentUserId !== profile.id && (isCreator || currentUserRole === 'CREATOR') && (
                <button
                  onClick={handleMessageClick}
                  disabled={loadingMessage}
                  className="flex-1 md:flex-none px-8 py-3 rounded-full font-black uppercase tracking-widest transition-all text-[10px] flex items-center justify-center gap-2 bg-zinc-900 border border-border-theme text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {loadingMessage ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} />}
                  Message
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-center md:justify-start gap-10">
            {isCreator && (
              <>
                <div className="flex flex-col"><span className="font-bold text-xl">{profile._count?.posts || 0}</span><span className="text-zinc-500 text-[10px] uppercase font-black">Posts</span></div>
                <div className="flex flex-col"><span className="font-bold text-xl">{followersCount}</span><span className="text-zinc-500 text-[10px] uppercase font-black">Followers</span></div>
                <div className="flex flex-col"><span className="font-bold text-xl">{subscribersCount}</span><span className="text-zinc-500 text-[10px] uppercase font-black">Subscribers</span></div>
              </>
            )}
            <div className="flex flex-col"><span className="font-bold text-xl">{profile.followingCount || 0}</span><span className="text-zinc-500 text-[10px] uppercase font-black">Following</span></div>
          </div>

          {profile.bio && (
            <p className="text-zinc-400 text-sm max-w-xl leading-relaxed mx-auto md:mx-0">
              {profile.bio}
            </p>
          )}
        </div>
      </div>

      {/* --- BODY SECTION --- */}
      {isCreator ? (
        <div className="space-y-6">
          <div className="flex gap-8 border-b border-border-theme">
            <button 
              onClick={() => setActiveTab('posts')}
              className={`pb-4 text-xs font-black uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all ${activeTab === 'posts' ? 'border-white text-white' : 'border-transparent text-zinc-600'}`}
            >
              <Grid size={16} /> Posts
            </button>
            <button 
              onClick={() => setActiveTab('reels')}
              className={`pb-4 text-xs font-black uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all ${activeTab === 'reels' ? 'border-white text-white' : 'border-transparent text-zinc-600'}`}
            >
              <Play size={16} /> Reels
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4">
            {isRestricted ? (
              <div className="col-span-full py-32 flex flex-col items-center justify-center bg-zinc-950/30 border border-border-theme rounded-[3rem]">
                <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-border-theme">
                  <Lock size={24} className="text-zinc-700" />
                </div>
                <h2 className="text-xl font-black uppercase italic tracking-tighter text-zinc-400 text-center px-6">
                  This account is set as private, you can see their posts only if they follows you back
                </h2>
                <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.2em] mt-3">
                  Restricted Content
                </p>
              </div>
            ) : activeTab === 'posts' ? (
              profile.posts && profile.posts.length > 0 ? (
                profile.posts.map((post: any) => {
                  const unlocked = hasAccess(post);
                  const isMediaLoading = loadingMedia[post.id];
                  return (
                    <div key={post.id} className="aspect-square bg-zinc-900 rounded-2xl overflow-hidden border border-border-theme relative group cursor-pointer">
                      <img 
                        src={unlocked ? `/api/media/post/${post.id}?t=${refreshKey}` : "/locked-content.png"} 
                        alt="Post" 
                        onLoad={() => setLoadingMedia(prev => ({ ...prev, [post.id]: false }))}
                        onContextMenu={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                        className={`w-full h-full object-cover transition-all duration-500 select-none pointer-events-none ${(!unlocked || isMediaLoading) ? 'blur-sm scale-105 opacity-80' : 'group-hover:scale-110'}`} 
                      />

                      {/* Loading Spinner for newly unlocked content */}
                      {unlocked && isMediaLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20">
                          <Loader2 size={32} className="animate-spin text-purple-400 drop-shadow-lg" />
                        </div>
                      )}

                      {post.isPremium && (
                        <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5 pointer-events-none">
                          <span className="px-2.5 py-1 bg-purple-600/90 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-wider rounded-lg border border-purple-400/30 shadow-lg shadow-purple-900/40">
                            Premium
                          </span>
                          <span className="px-2 py-1 bg-black/80 backdrop-blur-md text-purple-400 text-[9px] font-black rounded-lg border border-border-theme shadow-xl">
                            ${((post.price || 0) / 100).toFixed(2)}
                          </span>
                        </div>
                      )}

                      {!unlocked && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-black/50 via-black/10 to-black/70 backdrop-blur-[2px] p-3 text-center">
                          {/* Lock Icon */}
                          <div className="w-9 h-9 rounded-full flex items-center justify-center mb-2"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 0 20px rgba(168,85,247,0.55)' }}>
                            <Lock size={15} className="text-white" />
                          </div>

                          {/* Label */}
                          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-purple-300 mb-1">Premium</p>

                          {/* Price Badge */}
                          <div className="flex items-center gap-0.5 px-3 py-1 rounded-full mb-3 border border-purple-500/40"
                            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(168,85,247,0.2))' }}>
                            <span className="text-[10px] font-black text-purple-300">$</span>
                            <span className="text-base font-black text-white" style={{ textShadow: '0 0 10px rgba(168,85,247,0.9)' }}>
                              {((post.price || 0) / 100).toFixed(2)}
                            </span>
                          </div>

                          {/* Unlock Button */}
                          <button
                            onClick={() => setPendingTransaction({ type: 'post', id: post.id, amount: post.price || 0, name: `Premium Post` })}
                            disabled={loading}
                            className="px-4 py-1.5 text-[8px] font-black uppercase tracking-widest text-white rounded-full transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50"
                            style={{
                              background: 'linear-gradient(135deg, #7c3aed, #a855f7, #ec4899)',
                              boxShadow: '0 0 16px rgba(168,85,247,0.55)'
                            }}
                          >
                            {loading ? <Loader2 size={10} className="animate-spin" /> : "🔓 Unlock"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <EmptyState icon={<Grid size={40}/>} label="No Posts Yet" />
              )
            ) : (
              profile.reels && profile.reels.length > 0 ? (
                profile.reels.map((reel: any) => {
                  const unlocked = hasAccess(reel);
                  const isMediaLoading = loadingMedia[reel.id];
                  return (
                    <div key={reel.id} className="aspect-[9/16] bg-zinc-900 rounded-2xl overflow-hidden border border-border-theme relative group cursor-pointer">
                    {unlocked ? (
                      <video 
                        src={`/api/media/reel/${reel.id}?t=${refreshKey}`} 
                        onLoadedData={() => setLoadingMedia(prev => ({ ...prev, [reel.id]: false }))}
                        onContextMenu={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                        controlsList="nodownload noplaybackrate"
                        disablePictureInPicture
                        className={`w-full h-full object-cover transition-all duration-500 select-none pointer-events-none ${isMediaLoading ? 'blur-sm scale-105 opacity-80' : ''}`} 
                      />
                    ) : (
                      <img 
                        src="/locked-content.png" 
                        alt="Locked Reel"
                        className="w-full h-full object-cover blur-sm opacity-60"
                        onContextMenu={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                      />
                    )}

                    {/* Loading Spinner for newly unlocked content */}
                    {unlocked && isMediaLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20">
                        <Loader2 size={32} className="animate-spin text-purple-400 drop-shadow-lg" />
                      </div>
                    )}

                      {reel.isPremium && (
                        <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2 pointer-events-none">
                          <span className="px-3 py-1 bg-purple-600/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest rounded-xl border border-purple-400/30 shadow-lg shadow-purple-900/40">
                            Premium Reel
                          </span>
                          <span className="px-3 py-1 bg-black/80 backdrop-blur-md text-purple-400 text-[11px] font-black rounded-xl border border-border-theme shadow-xl">
                            ${((reel.price || 0) / 100).toFixed(2)}
                          </span>
                        </div>
                      )}

                      {!unlocked && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-black/50 via-black/10 to-black/70 backdrop-blur-[2px] p-3 text-center">
                          {/* Lock Icon */}
                          <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 0 24px rgba(168,85,247,0.55)' }}>
                            <Lock size={18} className="text-white" />
                          </div>

                          {/* Label */}
                          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-purple-300 mb-1">Premium Reel</p>

                          {/* Price Badge */}
                          <div className="flex items-center gap-0.5 px-3 py-1 rounded-full mb-3 border border-purple-500/40"
                            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(168,85,247,0.2))' }}>
                            <span className="text-[10px] font-black text-purple-300">$</span>
                            <span className="text-base font-black text-white" style={{ textShadow: '0 0 10px rgba(168,85,247,0.9)' }}>
                              {((reel.price || 0) / 100).toFixed(2)}
                            </span>
                          </div>

                          {/* Unlock Button */}
                          <button
                            onClick={() => setPendingTransaction({ type: 'reel', id: reel.id, amount: reel.price || 0, name: `Premium Reel` })}
                            disabled={loading}
                            className="px-4 py-1.5 text-[8px] font-black uppercase tracking-widest text-white rounded-full transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50"
                            style={{
                              background: 'linear-gradient(135deg, #7c3aed, #a855f7, #ec4899)',
                              boxShadow: '0 0 16px rgba(168,85,247,0.55)'
                            }}
                          >
                            {loading ? <Loader2 size={10} className="animate-spin" /> : "🔓 Unlock"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <EmptyState icon={<Play size={40}/>} label="No Reels Yet" />
              )
            )}
          </div>
        </div>
      ) : (
        <div className="w-full py-32 flex flex-col items-center justify-center border border-border-theme rounded-[3rem] bg-zinc-950/30">
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-border-theme">
             <Grid size={24} className="text-zinc-700" />
          </div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-zinc-500">
            Private Profile
          </h2>
          <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest mt-2 max-w-sm text-center">
             This user has not set up a public creator profile yet.
          </p>
        </div>
      )}

      {/* Unfollow Confirmation Modal */}
      {showUnfollowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900/90 border border-border-theme p-8 rounded-[2rem] max-w-sm w-full text-center shadow-2xl backdrop-blur-md">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2 text-white">Unfollow?</h3>
            <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-8">
              Stop seeing posts from @{profile.username}?
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmUnfollow}
                className="w-full py-4 bg-red-500 hover:bg-red-600 hover:scale-[1.02] transition-all text-white rounded-2xl font-black uppercase tracking-widest text-[10px]"
              >
                Unfollow
              </button>
              <button 
                onClick={() => setShowUnfollowModal(false)}
                className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 hover:scale-[1.02] transition-all text-white rounded-2xl font-black uppercase tracking-widest text-[10px]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Tier Modal */}
      <AnimatePresence>
        {showSubModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 30 }}
                    className="bg-black border border-border-theme rounded-[3rem] p-10 w-full max-w-2xl shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-12 opacity-5 text-purple-600 pointer-events-none">
                        <Star size={300} />
                    </div>

                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <div>
                            <h2 className="text-4xl font-black italic uppercase tracking-tighter">Choose Your <span className="text-purple-500">Tier</span></h2>
                            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">Unlock @{profile.username}&apos;s exclusive family content.</p>
                        </div>
                        <button onClick={() => setShowSubModal(false)} className="p-3 bg-zinc-900 rounded-2xl hover:bg-zinc-800 transition-all">
                            <Plus className="rotate-45 text-zinc-500" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                        {/* TIER 1 */}
                        <SubTierCard 
                            tier={1} 
                            title="Bronze Membership" 
                            price={profile.creatorProfile?.tier1Price || 500}
                            duration={profile.creatorProfile?.tier1Duration || 30}
                            icon={<Heart size={20} className="text-white" />}
                            themeColor="#CD7F32"
                            features={["Access to all Premium Posts", "Text Messaging Access", "Loyalty Badge"]}
                            onSelect={(tier: 1, price: number) => setPendingTransaction({ type: 'subscribe', tier, amount: price, name: 'Bronze Membership' })}
                            disabled={subscribing}
                            currentTier={subscriptionTier}
                        />
                        {/* TIER 2 */}
                        <SubTierCard 
                            tier={2} 
                            title="Silver Membership" 
                            price={profile.creatorProfile?.tier2Price || 1500}
                            duration={profile.creatorProfile?.tier2Duration || 30}
                            icon={<Star size={20} className="text-white" />}
                            themeColor="#C0C0C0"
                            features={["Bronze Access", "Voice Messaging Access", "HD Content Unlock"]}
                            onSelect={(tier: 2, price: number) => setPendingTransaction({ type: 'subscribe', tier, amount: price, name: 'Silver Membership' })}
                            disabled={subscribing}
                            currentTier={subscriptionTier}
                            highlight
                        />
                        {/* TIER 3 */}
                        <SubTierCard 
                            tier={3} 
                            title="Gold VIP" 
                            price={profile.creatorProfile?.tier3Price || 3500}
                            duration={profile.creatorProfile?.tier3Duration || 30}
                            icon={<Crown size={20} className="text-white" />}
                            themeColor="#FFD700"
                            features={["Silver Access", "Camera & Media Messaging", "Private Video Request"]}
                            onSelect={(tier: 3, price: number) => setPendingTransaction({ type: 'subscribe', tier, amount: price, name: 'Gold VIP Membership' })}
                            disabled={subscribing}
                            currentTier={subscriptionTier}
                        />
                    </div>

                    <div className="mt-8 flex items-center justify-center gap-3 p-4 bg-zinc-950 rounded-2xl border border-border-theme">
                        <Wallet size={16} className="text-emerald-500" />
                        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">
                            Your Wallet Balance: <span className="text-white">${(currentUserBalance / 100).toFixed(2)}</span>
                        </p>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      <PurchaseConfirmationModal
        isOpen={!!pendingTransaction}
        onClose={() => setPendingTransaction(null)}
        onConfirm={executePendingTransaction}
        itemName={pendingTransaction?.name || ""}
        itemPrice={pendingTransaction?.amount || 0}
        currentBalance={currentUserBalance}
        loading={subscribing || loading}
      />

      <BlockConfirmationModal 
        isOpen={showBlockConfirm}
        onClose={() => setShowBlockConfirm(false)}
        onConfirm={handleBlockAction}
        username={profile.username}
        loading={blocking}
      />

      {/* Unfollow Confirmation Modal */}
      <AnimatePresence>
        {showUnfollowModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-zinc-950 border border-border-theme rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden p-10 text-center"
            >
               <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                  <UserMinus size={32} className="text-red-500" />
               </div>
               <h3 className="text-xl font-black italic uppercase tracking-tighter text-white mb-2">Unfollow @{profile.username}?</h3>
               <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-[0.1em] mb-8 leading-relaxed">Their posts will no longer appear in your feed. If they are private, you'll need to request to follow again.</p>
               <div className="flex gap-4">
                  <button onClick={() => setShowUnfollowModal(false)} className="flex-1 py-4 bg-zinc-900 border border-border-theme rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all">Cancel</button>
                  <button onClick={confirmUnfollow} className="flex-1 py-4 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-all shadow-lg shadow-red-500/20">Unfollow</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const SubTierCard = ({ tier, title, price, duration, icon, themeColor, features, onSelect, disabled, currentTier, highlight }: any) => {
    const isOwned = currentTier === tier;
    const isUpgrade = tier > currentTier;
    const isDowngrade = tier < currentTier && currentTier > 0;

    const durationLabel = duration > 0 && duration % 30 === 0 
        ? `${duration / 30} ${duration / 30 === 1 ? 'month' : 'months'}`
        : `${duration} days`;

    return (
        <div 
          className={`p-6 rounded-[2rem] border transition-all flex flex-col h-full bg-zinc-900/50 ${highlight ? 'shadow-xl' : ''}`}
          style={{ borderColor: highlight ? themeColor : `${themeColor}40`, boxShadow: highlight ? `0 0 20px ${themeColor}20` : 'none' }}
        >
            <div className="flex justify-between items-start mb-6">
                <div className="p-3 rounded-2xl" style={{ backgroundColor: themeColor }}>{icon}</div>
                {highlight && <span className="text-[8px] font-black uppercase tracking-widest text-white px-2 py-1 rounded-full" style={{ backgroundColor: themeColor }}>Popular</span>}
            </div>
            
            <div className="flex-1">
                <h4 className="text-sm font-black uppercase tracking-tighter mb-1" style={{ color: themeColor }}>{title}</h4>
                <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-2xl font-black italic tracking-tighter text-white">${(price / 100).toFixed(2)}</span>
                    <span className="text-[10px] font-black uppercase text-zinc-600">/ {durationLabel}</span>
                </div>

                <div className="space-y-3 mb-8">
                    {features.map((f: string, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                            <Sparkles size={10} className="mt-1 shrink-0" style={{ color: themeColor }} />
                            <p className="text-[10px] font-medium text-zinc-400 leading-tight">{f}</p>
                        </div>
                    ))}
                </div>
            </div>

            <button 
                onClick={() => onSelect(tier, price)}
                disabled={disabled}
                className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isOwned ? 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30' : 'text-zinc-900 hover:scale-[1.02]'}`}
                style={{ backgroundColor: !isOwned ? themeColor : undefined }}
            >
                {isOwned ? "Extend Subscription" : isUpgrade ? (currentTier > 0 ? "Upgrade Plan" : "Select Plan") : isDowngrade ? "Downgrade & Extend" : "Select Plan"}
            </button>
        </div>
    );
};


const EmptyState = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
  <div className="col-span-full py-20 flex flex-col items-center justify-center bg-zinc-950/30 border border-border-theme border-dashed rounded-[2rem]">
    <div className="text-zinc-800 mb-4">{icon}</div>
    <p className="text-zinc-600 font-black uppercase tracking-widest text-[10px]">{label}</p>
  </div>
);
