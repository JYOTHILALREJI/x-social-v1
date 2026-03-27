"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Grid, Play, Loader2, Lock, Users, Star, Crown, Heart, Sparkles, ChevronRight, Wallet, Plus } from 'lucide-react';
import { toggleFollow } from '@/app/actions/follow';
import { subscribeToCreator, purchaseContent } from '@/app/actions/user-actions';
import { motion, AnimatePresence } from 'framer-motion';
import PurchaseConfirmationModal from '@/components/PurchaseConfirmationModal';

interface PublicProfileClientProps {
  currentUserId: string;
  currentUserBalance: number;
  profile: any;
  isInitialFollowing: boolean;
  initialSubscriptionTier: number;
}

import { useRouter } from 'next/navigation';

export default function PublicProfileClient({ 
  currentUserId, 
  currentUserBalance,
  profile, 
  isInitialFollowing, 
  initialSubscriptionTier 
}: PublicProfileClientProps) {
  const router = useRouter(); 
  const [activeTab, setActiveTab] = useState<'posts' | 'reels'>('posts');
  const [isFollowing, setIsFollowing] = useState(isInitialFollowing);
  const [subscriptionTier, setSubscriptionTier] = useState(initialSubscriptionTier);
  const [showUnfollowModal, setShowUnfollowModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [purchasedItems, setPurchasedItems] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0); // For forcing media re-requests
  const [loadingMedia, setLoadingMedia] = useState<Record<string, boolean>>({});

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
    if (isFollowing) {
      setShowUnfollowModal(true);
    } else {
      setLoading(true);
      const res = await toggleFollow(currentUserId, profile.id, false);
      if (res.success) {
        setIsFollowing(true);
        setFollowersCount((prev: number) => prev + 1);
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
      setFollowersCount((prev: number) => Math.max(0, prev - 1));
    }
    setLoading(false);
  };

  return (
    <div className="w-full min-h-screen bg-black text-white px-6 md:px-12 pt-10 pb-32">
      
      {/* --- TOP PROFILE SECTION --- */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12 border-b border-zinc-900 pb-12">
        {/* Profile Image */}
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-zinc-900 border-2 border-zinc-800 relative overflow-hidden shrink-0 flex items-center justify-center font-black text-4xl text-zinc-600 uppercase">
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
              <h1 className="text-3xl font-black italic uppercase tracking-tighter">{profile.username}</h1>
              {isCreator && (
                <span className="px-3 py-1 bg-purple-500/10 text-purple-500 text-[10px] font-black uppercase rounded-full border border-purple-500/20">
                  Verified Creator
                </span>
              )}
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              {isCreator && (
                <button 
                  onClick={() => setShowSubModal(true)}
                  className={`flex-1 md:flex-none px-8 py-3 rounded-full font-black uppercase tracking-widest transition-all text-xs flex items-center justify-center gap-2 ${
                    isSubscribed 
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                    : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 shadow-xl shadow-purple-500/20"
                  }`}
                >
                  <Heart size={16} className={isSubscribed ? "fill-emerald-500" : ""} />
                  {isSubscribed ? `Tier ${subscriptionTier} Member` : "Join Family"}
                </button>
              )}
              <button 
                onClick={handleFollowAction}
                disabled={loading}
                className={`flex-1 md:flex-none px-8 py-3 rounded-full font-black uppercase tracking-widest transition-all text-xs ${
                  isFollowing 
                  ? "border border-zinc-800 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500 text-white" 
                  : "bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800"
                }`}
              >
                {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : isFollowing ? "Following" : "Follow"}
              </button>
            </div>
          </div>

          <div className="flex justify-center md:justify-start gap-10">
            <div className="flex flex-col"><span className="font-bold text-xl">{profile._count?.posts || 0}</span><span className="text-zinc-500 text-[10px] uppercase font-black">Posts</span></div>
            <div className="flex flex-col"><span className="font-bold text-xl">{followersCount}</span><span className="text-zinc-500 text-[10px] uppercase font-black">Followers</span></div>
            <div className="flex flex-col"><span className="font-bold text-xl">{subscribersCount}</span><span className="text-zinc-500 text-[10px] uppercase font-black">Subscribers</span></div>
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
          <div className="flex gap-8 border-b border-zinc-900">
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
            {activeTab === 'posts' ? (
              profile.posts && profile.posts.length > 0 ? (
                profile.posts.map((post: any) => {
                  const unlocked = hasAccess(post);
                  const isMediaLoading = loadingMedia[post.id];
                  return (
                    <div key={post.id} className="aspect-square bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 relative group cursor-pointer">
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
                          <span className="px-2 py-1 bg-black/80 backdrop-blur-md text-purple-400 text-[9px] font-black rounded-lg border border-zinc-800 shadow-xl">
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
                    <div key={reel.id} className="aspect-[9/16] bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 relative group cursor-pointer">
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
                          <span className="px-3 py-1 bg-black/80 backdrop-blur-md text-purple-400 text-[11px] font-black rounded-xl border border-zinc-800 shadow-xl">
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
        <div className="w-full py-32 flex flex-col items-center justify-center border border-zinc-900 rounded-[3rem] bg-zinc-950/30">
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-800">
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
          <div className="bg-zinc-900/90 border border-zinc-800 p-8 rounded-[2rem] max-w-sm w-full text-center shadow-2xl backdrop-blur-md">
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
                    className="bg-black border border-zinc-900 rounded-[3rem] p-10 w-full max-w-2xl shadow-2xl relative overflow-hidden"
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
                            title="Family Member" 
                            price={profile.creatorProfile?.tier1Price || 500}
                            icon={<Heart size={20} className="text-emerald-500" />}
                            features={["Access to all Premium Posts", "Direct Messaging", "Loyalty Badge"]}
                            onSelect={(tier: 1, price: number) => setPendingTransaction({ type: 'subscribe', tier, amount: price, name: 'Tier 1 Membership' })}
                            disabled={subscribing}
                            currentTier={subscriptionTier}
                        />
                        {/* TIER 2 */}
                        <SubTierCard 
                            tier={2} 
                            title="Premium Fan" 
                            price={profile.creatorProfile?.tier2Price || 1500}
                            icon={<Star size={20} className="text-purple-500" />}
                            features={["Tier 1 Access", "Priority Support", "HD Content Unlock"]}
                            onSelect={(tier: 2, price: number) => setPendingTransaction({ type: 'subscribe', tier, amount: price, name: 'Tier 2 Membership' })}
                            disabled={subscribing}
                            currentTier={subscriptionTier}
                            highlight
                        />
                        {/* TIER 3 */}
                        <SubTierCard 
                            tier={3} 
                            title="Elite VIP" 
                            price={profile.creatorProfile?.tier3Price || 3500}
                            icon={<Crown size={20} className="text-amber-500" />}
                            features={["All Previous Access", "Private Video Request", "Physical Gift Eligibility"]}
                            onSelect={(tier: 3, price: number) => setPendingTransaction({ type: 'subscribe', tier, amount: price, name: 'Tier 3 Membership' })}
                            disabled={subscribing}
                            currentTier={subscriptionTier}
                        />
                    </div>

                    <div className="mt-8 flex items-center justify-center gap-3 p-4 bg-zinc-950 rounded-2xl border border-zinc-900">
                        <Wallet size={16} className="text-emerald-500" />
                        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">
                            Your Wallet Balance: <span className="text-white">${(currentUserBalance / 100).toFixed(2)}</span>
                        </p>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <PurchaseConfirmationModal
        isOpen={!!pendingTransaction}
        onClose={() => setPendingTransaction(null)}
        onConfirm={executePendingTransaction}
        itemName={pendingTransaction?.name || ""}
        itemPrice={pendingTransaction?.amount || 0}
        currentBalance={currentUserBalance}
        loading={subscribing || loading}
      />
    </div>
  );
}

const SubTierCard = ({ tier, title, price, icon, features, onSelect, disabled, currentTier, highlight }: any) => {
    const isOwned = currentTier >= tier;

    return (
        <div className={`p-6 rounded-[2rem] border transition-all flex flex-col h-full ${highlight ? 'bg-purple-600/5 border-purple-500 shadow-xl shadow-purple-900/40' : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'}`}>
            <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-black rounded-2xl">{icon}</div>
                {highlight && <span className="text-[8px] font-black uppercase tracking-widest bg-purple-600 text-white px-2 py-1 rounded-full">Popular</span>}
            </div>
            
            <div className="flex-1">
                <h4 className="text-sm font-black uppercase tracking-tighter mb-1">{title}</h4>
                <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-2xl font-black italic tracking-tighter text-white">${(price / 100).toFixed(2)}</span>
                    <span className="text-[10px] font-black uppercase text-zinc-600">/mo</span>
                </div>

                <div className="space-y-3 mb-8">
                    {features.map((f: string, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                            <Sparkles size={10} className="text-zinc-500 mt-1 shrink-0" />
                            <p className="text-[10px] font-medium text-zinc-400 leading-tight">{f}</p>
                        </div>
                    ))}
                </div>
            </div>

            <button 
                onClick={() => onSelect(tier, price)}
                disabled={disabled || isOwned}
                className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isOwned ? 'bg-emerald-500/20 text-emerald-500 cursor-default' : highlight ? 'bg-white text-black hover:bg-purple-500 hover:text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-white hover:text-black'}`}
            >
                {isOwned ? "Already Owned" : "Select Plan"}
            </button>
        </div>
    );
};


const EmptyState = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
  <div className="col-span-full py-20 flex flex-col items-center justify-center bg-zinc-950/30 border border-zinc-900 border-dashed rounded-[2rem]">
    <div className="text-zinc-800 mb-4">{icon}</div>
    <p className="text-zinc-600 font-black uppercase tracking-widest text-[10px]">{label}</p>
  </div>
);
