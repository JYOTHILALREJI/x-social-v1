"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Settings, PlusCircle, Grid, Play, Loader2, Plus, User as UserIcon 
} from 'lucide-react';
import CreatorOnboarding from "@/components/CreatorOnboarding";
import CreateContentModal from "@/components/CreateContentModal";
import UserSettings from "@/components/UserSettings";

interface ProfileClientProps {
  user: {
    id: string;
    username: string;
    role: string;
    creatorStatus: string;
    bio: string | null;
    image: string | null;
    posts: any[]; // These should be fetched/passed from page.tsx
    reels: any[]; // These should be fetched/passed from page.tsx
    _count: { posts: number; reels: number };
  };
}

const ProfileClient = ({ user }: ProfileClientProps) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'reels'>('posts');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createType, setCreateType] = useState<'posts' | 'reels'>('posts');
  
  const isCreator = user.role === 'CREATOR';
  const isVerifiedCreator = user.creatorStatus === 'APPROVED';
  const isPending = user.creatorStatus === 'PENDING';
  const DEFAULT_AVATAR = "/default_user_profile/default-avatar.png";

  return (
    <div className="w-full min-h-screen bg-black text-white px-6 md:px-12 pt-10 pb-32">
      
      {/* --- TOP PROFILE SECTION --- */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12 border-b border-zinc-900 pb-12">
        {/* Profile Image */}
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-zinc-900 border-2 border-zinc-800 relative overflow-hidden shrink-0">
           <Image 
             src={user.image || DEFAULT_AVATAR} 
             alt={user.username} 
             fill 
             className="object-cover"
           />
        </div>
        
        {/* User Info */}
        <div className="flex-1 space-y-4 text-center md:text-left w-full">
          <div className="flex items-center justify-between">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <h1 className="text-3xl font-black italic uppercase tracking-tighter">{user.username}</h1>
              {isVerifiedCreator && (
                <span className="px-3 py-1 bg-purple-500/10 text-purple-500 text-[10px] font-black uppercase rounded-full border border-purple-500/20">
                  Verified Creator
                </span>
              )}
            </div>
            
            {/* Settings Link */}
            {isVerifiedCreator && (
              <Link href="/settings" className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-2xl border border-zinc-800 transition-all">
                <Settings size={20} className="text-zinc-400" />
              </Link>
            )}
          </div>

          <div className="flex justify-center md:justify-start gap-10">
            <div className="flex flex-col"><span className="font-bold text-xl">{user._count.posts}</span><span className="text-zinc-500 text-[10px] uppercase font-black">Posts</span></div>
            <div className="flex flex-col"><span className="font-bold text-xl">{user._count.reels}</span><span className="text-zinc-500 text-[10px] uppercase font-black">Reels</span></div>
          </div>

          <p className="text-zinc-400 text-sm max-w-xl leading-relaxed">
            {user.bio || ""}
          </p>
        </div>
      </div>

      {/* --- BODY SECTION --- */}
      {!isVerifiedCreator ? (
        <div className="pt-8 flex flex-col items-center">
          {isPending && (
            <div className="w-full lg:w-[90%] py-12 flex flex-col items-center justify-center border border-dashed border-purple-500/50 bg-purple-500/5 rounded-[3rem] mb-12">
              <Loader2 size={40} className="text-purple-500 mb-4 animate-spin mx-auto" />
              <h2 className="text-xl font-black uppercase tracking-tighter text-purple-500">Reviewing ID Proof</h2>
              <p className="text-zinc-500 text-xs mt-2">Hang tight! Your creator dashboard is being prepared.</p>
            </div>
          )}

          <UserSettings 
            onBecomeCreatorClick={() => setIsModalOpen(true)} 
            showBecomeCreator={!isPending} 
          />
        </div>
      ) : (
        /* CREATOR VIEW: Dashboard with Tabs */
        <div className="space-y-6">
          {/* Tab Selection */}
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

          {/* Action Button at top of tab */}
          <div className="flex justify-end">
             {user.creatorStatus === 'APPROVED' && (
               <button 
                  onClick={() => {
                    setCreateType(activeTab);
                    setIsCreateModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-6 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-black uppercase hover:bg-white hover:text-black transition-all"
               >
                  <Plus size={14} /> New {activeTab === 'posts' ? 'Post' : 'Reel'}
               </button>
             )}
          </div>

          {/* Grid View */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {activeTab === 'posts' ? (
              user.posts.length > 0 ? (
                user.posts.map((post: any) => (
                  <div key={post.id} className="aspect-square bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 relative group">
                    <Image src={post.imageUrl} alt="Post" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                ))
              ) : (
                <EmptyState icon={<Grid size={40}/>} label="No Posts Yet" />
              )
            ) : (
              user.reels.length > 0 ? (
                user.reels.map((reel: any) => (
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
      )}

      <CreatorOnboarding isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <CreateContentModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        type={createType} 
        authorId={user.id} 
      />
    </div>
  );
};

// Sub-component for Empty States inside Tabs
const EmptyState = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
  <div className="col-span-full py-20 flex flex-col items-center justify-center bg-zinc-950/30 border border-zinc-900 border-dashed rounded-[2rem]">
    <div className="text-zinc-800 mb-4">{icon}</div>
    <p className="text-zinc-600 font-black uppercase tracking-widest text-[10px]">{label}</p>
  </div>
);

export default ProfileClient;