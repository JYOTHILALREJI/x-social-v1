"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Grid, Play, Loader2 } from 'lucide-react';
import { toggleFollow } from '@/app/actions/follow';

interface PublicProfileClientProps {
  currentUserId: string;
  profile: any;
  isInitialFollowing: boolean;
}

export default function PublicProfileClient({ currentUserId, profile, isInitialFollowing }: PublicProfileClientProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'reels'>('posts');
  const [isFollowing, setIsFollowing] = useState(isInitialFollowing);
  const [showUnfollowModal, setShowUnfollowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
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
                profile.posts.map((post: any) => (
                  <div key={post.id} className="aspect-square bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 relative group">
                    <img src={post.imageUrl} alt="Post" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                ))
              ) : (
                <EmptyState icon={<Grid size={40}/>} label="No Posts Yet" />
              )
            ) : (
              profile.reels && profile.reels.length > 0 ? (
                profile.reels.map((reel: any) => (
                  <div key={reel.id} className="aspect-[9/16] bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 relative group">
                    <video src={reel.videoUrl} className="w-full h-full object-cover" />
                  </div>
                ))
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
