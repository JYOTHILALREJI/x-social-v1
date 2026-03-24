"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Grid, Play, Loader2, Lock } from 'lucide-react';
import { toggleFollow } from '@/app/actions/follow';

interface PublicProfileClientProps {
  currentUserId: string;
  profile: any;
  isInitialFollowing: boolean;
  isSubscribed: boolean;
}

export default function PublicProfileClient({ 
  currentUserId, 
  profile, 
  isInitialFollowing, 
  isSubscribed: initialSubscribed 
}: PublicProfileClientProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'reels'>('posts');
  const [isFollowing, setIsFollowing] = useState(isInitialFollowing);
  const [isSubscribed, setIsSubscribed] = useState(initialSubscribed);
  const [showUnfollowModal, setShowUnfollowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Helper to check if current user has access to a specific item
  const hasAccess = (item: any) => {
    if (!item.isPremium) return true;
    if (isSubscribed) return true;
    if (item.purchases && item.purchases.length > 0) return true;
    return false;
  };
  
  // Optimistic count
  const [followersCount, setFollowersCount] = useState(profile.followersCount || 0);

  const isCreator = profile.role === 'CREATOR';
  const DEFAULT_AVATAR = "/default_user_profile/default-avatar.png";

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
            
            <button 
              onClick={handleFollowAction}
              disabled={loading}
              className={`px-8 py-3 rounded-full font-black uppercase tracking-widest transition-all text-xs w-full md:w-auto ${
                isFollowing 
                ? "border border-zinc-800 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500 text-white" 
                : "bg-purple-600 text-white hover:bg-purple-500"
              }`}
            >
              {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : isFollowing ? "Following" : "Follow"}
            </button>
          </div>

          <div className="flex justify-center md:justify-start gap-10">
            <div className="flex flex-col"><span className="font-bold text-xl">{profile._count?.posts || 0}</span><span className="text-zinc-500 text-[10px] uppercase font-black">Posts</span></div>
            <div className="flex flex-col"><span className="font-bold text-xl">{profile._count?.reels || 0}</span><span className="text-zinc-500 text-[10px] uppercase font-black">Reels</span></div>
            <div className="flex flex-col"><span className="font-bold text-xl">{followersCount}</span><span className="text-zinc-500 text-[10px] uppercase font-black">Followers</span></div>
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
                  return (
                    <div key={post.id} className="aspect-square bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 relative group cursor-pointer">
                      <img 
                        src={`/api/media/post/${post.id}`} 
                        alt="Post" 
                        className={`w-full h-full object-cover transition-all duration-500 ${unlocked ? 'group-hover:scale-110' : 'blur-md opacity-50'}`} 
                      />
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
                            className="px-4 py-1.5 text-[8px] font-black uppercase tracking-widest text-white rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
                            style={{
                              background: 'linear-gradient(135deg, #7c3aed, #a855f7, #ec4899)',
                              boxShadow: '0 0 16px rgba(168,85,247,0.55)'
                            }}
                          >
                            🔓 Unlock
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
                  return (
                    <div key={reel.id} className="aspect-[9/16] bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 relative group cursor-pointer">
                      <video 
                        src={`/api/media/reel/${reel.id}`} 
                        className={`w-full h-full object-cover transition-all duration-500 ${unlocked ? '' : 'blur-lg opacity-30'}`} 
                      />
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
                            className="px-4 py-1.5 text-[8px] font-black uppercase tracking-widest text-white rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
                            style={{
                              background: 'linear-gradient(135deg, #7c3aed, #a855f7, #ec4899)',
                              boxShadow: '0 0 16px rgba(168,85,247,0.55)'
                            }}
                          >
                            🔓 Unlock
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
    </div>
  );
}

const EmptyState = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
  <div className="col-span-full py-20 flex flex-col items-center justify-center bg-zinc-950/30 border border-zinc-900 border-dashed rounded-[2rem]">
    <div className="text-zinc-800 mb-4">{icon}</div>
    <p className="text-zinc-600 font-black uppercase tracking-widest text-[10px]">{label}</p>
  </div>
);
