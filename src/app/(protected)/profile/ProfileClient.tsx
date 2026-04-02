"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Settings, PlusCircle, Grid, Play, Loader2, Plus, User as UserIcon, EyeOff 
} from 'lucide-react';
import CreatorOnboarding from "@/components/CreatorOnboarding";
import CreateContentModal from "@/components/CreateContentModal";
import UserSettings from "@/components/UserSettings";
import CreatorDashboard from "@/components/CreatorDashboard";
import { addWalletBalance } from "@/app/actions/user-actions";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, AlertCircle, ChevronRight, CheckCircle2 } from "lucide-react";
import EditProfileOverlay from "@/components/EditProfileOverlay";

interface ProfileClientProps {
  user: {
    id: string;
    username: string;
    name: string | null;
    role: string;
    isGhost: boolean;
    dob: string | Date;
    creatorStatus: string;
    bio: string | null;
    image: string | null;
    walletBalance: number;
    followersCount: number;
    subscribersCount: number;
    posts: any[]; 
    reels: any[]; 
    revenues: any[];
    creatorProfile: {
      tier1Price: number;
      tier2Price: number;
      tier3Price: number;
    } | null;
    _count: { posts: number; reels: number; followers: number; follows: number };
  };
  platformFee: number;
}

const ProfileClient = ({ user, platformFee }: ProfileClientProps) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'reels'>('posts');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditOverlayOpen, setIsEditOverlayOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createType, setCreateType] = useState<'posts' | 'reels'>('posts');
  
  // Wallet states
  const [topUpAmount, setTopUpAmount] = useState<string>("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userData, setUserData] = useState(user);

  const handleToggleVisibility = (id: string, type: 'post' | 'reel', isPrivate: boolean) => {
    setUserData(prev => ({
      ...prev,
      [type === 'post' ? 'posts' : 'reels']: prev[type === 'post' ? 'posts' : 'reels'].map((item: any) => 
        item.id === id ? { ...item, isPrivate } : item
      )
    }));
  };

  const isCreator = userData.role === 'CREATOR';
  const isVerifiedCreator = userData.creatorStatus === 'APPROVED';
  const isPending = userData.creatorStatus === 'PENDING';
  const DEFAULT_AVATAR = "/default_user_profile/default-avatar.png";

  const handleTopUpRequest = () => {
    const amt = parseFloat(topUpAmount);
    if (isNaN(amt) || amt <= 0) {
        alert("Please enter a valid amount.");
        return;
    }
    setShowConfirm(true);
  };

  const confirmTopUp = async () => {
    setIsProcessing(true);
    const amt = parseFloat(topUpAmount);
    const res = await addWalletBalance(userData.id, amt);
    
    if (res.success) {
        setUserData(res.user as any);
        setTopUpAmount("");
        setShowConfirm(false);
    } else {
        alert("Failed to update wallet balance.");
    }
    setIsProcessing(false);
  };


  return (
    <div className="w-full min-h-screen bg-black text-white px-6 md:px-12 pt-10 pb-32">
      
      {/* --- TOP PROFILE SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] items-center lg:items-start gap-8 lg:gap-12 mb-12 border-b border-border-theme pb-12">
        {/* Profile Image */}
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-zinc-900 border-2 border-border-theme relative overflow-hidden shrink-0 mx-auto lg:mx-0">
           <Image 
             src={userData.image || DEFAULT_AVATAR} 
             alt={userData.username} 
             fill 
             className="object-cover"
           />
        </div>
        
        {/* User Info */}
        <div className="flex-1 space-y-2 text-center lg:text-left w-full">
          <div className="flex items-center justify-between lg:justify-start gap-4">
            <div className="flex flex-col">
              <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none mb-1">
                {userData.name || userData.username}
              </h1>
              {userData.name && (
                <span className="text-xs font-black text-purple-500/80 uppercase tracking-widest pl-1 italic">
                  @{userData.username}
                </span>
              )}
            </div>
            {isVerifiedCreator && (
              <span className="px-3 py-1 bg-purple-500/10 text-purple-500 text-[10px] font-black uppercase rounded-full border border-purple-500/20 self-start">
                Verified Creator
              </span>
            )}
            
            {/* Settings Link for desktop */}
            {isCreator && (
              <Link href="/settings" className="p-2.5 bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-border-theme transition-all hidden lg:block self-start">
                <Settings size={18} className="text-zinc-400" />
              </Link>
            )}
          </div>

          <div className="flex justify-center lg:justify-start gap-10">
            {isCreator && (
              <>
                <div className="flex flex-col"><span className="font-bold text-2xl tracking-tighter">{userData._count.posts}</span><span className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Posts</span></div>
                <div className="flex flex-col"><span className="font-bold text-2xl tracking-tighter">{userData._count.reels}</span><span className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Reels</span></div>
                <div className="flex flex-col"><span className="font-bold text-2xl tracking-tighter">{userData.followersCount || 0}</span><span className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Followers</span></div>
              </>
            )}
            <div className="flex flex-col"><span className="font-bold text-2xl tracking-tighter">{userData._count.follows || 0}</span><span className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Following</span></div>
          </div>

          <p className="text-zinc-400 text-sm max-w-xl leading-relaxed italic">
            {user.bio || "No biography provided."}
          </p>
        </div>

        {/* --- COMPACT TOPUP BAR (SINGLE ROW) --- */}
        {!isVerifiedCreator && !isPending && (
          <div className="w-fit min-w-[340px] flex items-center gap-6 bg-zinc-950/80 border border-border-theme p-3 pl-8 rounded-full hover:border-purple-600/50 transition-all shadow-2xl shadow-black/40">
            <div className="flex items-center gap-4 shrink-0 pr-6 border-r border-border-theme">
              <div className="p-3 bg-purple-500/10 rounded-full border border-purple-500/20">
                <Wallet size={18} className="text-purple-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-1">Total Assets</span>
                <span className="text-2xl font-black italic tracking-tighter text-white" suppressHydrationWarning>
                  ${(userData.walletBalance / 100).toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative w-32">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 font-bold text-sm">$</span>
                 <input 
                    type="number" 
                    step="0.01"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    placeholder="Amount" 
                    className="w-full bg-black border border-border-theme rounded-2xl py-3 pl-8 pr-4 text-xs font-black focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 transition-all text-white placeholder:text-zinc-800 uppercase" 
                />
              </div>
              <button 
                onClick={handleTopUpRequest} 
                className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-purple-600/20 active:scale-95 whitespace-nowrap"
              >
                Top Up
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- BODY SECTION --- */}
      {!isVerifiedCreator ? (
        <div className="pt-8 w-full space-y-12">

          {isPending && (
            <div className="w-full py-12 flex flex-col items-center justify-center border border-dashed border-purple-500/50 bg-purple-500/5 rounded-[3rem]">
              <Loader2 size={40} className="text-purple-500 mb-4 animate-spin mx-auto" />
              <h2 className="text-xl font-black uppercase tracking-tighter text-purple-500">Reviewing ID Proof</h2>
              <p className="text-zinc-500 text-xs mt-2">Hang tight! Your creator dashboard is being prepared.</p>
            </div>
          )}

          <UserSettings 
            onBecomeCreatorClick={() => setIsModalOpen(true)} 
            showBecomeCreator={!isPending} 
            user={userData as any}
            onEditProfile={() => setIsEditOverlayOpen(true)}
          />
        </div>
      ) : (
        /* CREATOR VIEW: Full Dashboard */
        <div className="space-y-12">
           <CreatorDashboard 
             user={userData as any} 
             platformFee={platformFee} 
             onToggleVisibility={handleToggleVisibility}
           />

           
           {/* Tab Selection for Content (Optional, if we want to keep the grid below the dashboard) */}
           <div className="pt-12 border-t border-border-theme">
              <div className="flex justify-between items-center mb-10">
                <div className="flex gap-8">
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

                {user.creatorStatus === 'APPROVED' && (
                  <button 
                      onClick={() => {
                        setCreateType(activeTab);
                        setIsCreateModalOpen(true);
                      }}
                      className="flex items-center gap-2 px-6 py-2 bg-zinc-900 border border-border-theme rounded-xl text-[10px] font-black uppercase hover:bg-white hover:text-black transition-all"
                  >
                      <Plus size={14} /> New {activeTab === 'posts' ? 'Post' : 'Reel'}
                  </button>
                )}
              </div>

              {/* Grid View */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {activeTab === 'posts' ? (
                  userData.posts.length > 0 ? (
                    userData.posts.map((post: any) => (
                      <div key={post.id} className={`aspect-square bg-zinc-900 rounded-3xl overflow-hidden border relative group ${post.isPrivate ? 'border-purple-500/50' : 'border-border-theme'}`}>
                        <Image src={`/api/media/post/${post.id}`} alt="Post" fill className={`object-cover group-hover:scale-110 transition-transform duration-500 unoptimized ${post.isPrivate ? 'opacity-40 grayscale-[0.5]' : ''}`} unoptimized />
                        
                        <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1 pointer-events-none">
                          {post.isPrivate && (
                             <span className="px-2.5 py-1.5 bg-zinc-950/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest rounded-xl border border-purple-500/50 shadow-2xl flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                               <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                               Private
                             </span>
                          )}
                          {post.isPremium && (
                            <>
                              <span className="px-2.5 py-1 bg-purple-600/90 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-[0.1em] rounded-lg border border-purple-400/30 shadow-2xl">
                                Premium
                              </span>
                              <span className="px-2 py-1 bg-black/80 backdrop-blur-md text-purple-400 text-[9px] font-black rounded-lg border border-border-theme">
                                ${((post.price || 0) / 100).toFixed(2)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState icon={<Grid size={40}/>} label="No Posts Yet" />
                  )
                ) : (
                  userData.reels.length > 0 ? (
                    userData.reels.map((reel: any) => (
                      <div key={reel.id} className={`aspect-[9/16] bg-zinc-900 rounded-3xl overflow-hidden border relative group ${reel.isPrivate ? 'border-purple-500/50' : 'border-border-theme'}`}>
                        <video src={`/api/media/reel/${reel.id}`} className={`w-full h-full object-cover ${reel.isPrivate ? 'opacity-40 grayscale-[0.5]' : ''}`} />
                        
                        <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-1.5 pointer-events-none">
                           {reel.isPrivate && (
                             <span className="px-3 py-1.5 bg-zinc-950/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-2xl border border-purple-500/50 shadow-2xl flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                               <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                               Private
                             </span>
                           )}
                           {reel.isPremium && (
                            <>
                              <span className="px-3 py-1 bg-purple-600/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-[0.1em] rounded-xl border border-purple-400/30 shadow-2xl">
                                Premium Reel
                              </span>
                              <span className="px-3 py-1 bg-black/80 backdrop-blur-md text-purple-400 text-[11px] font-black rounded-xl border border-border-theme">
                                ${((reel.price || 0) / 100).toFixed(2)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState icon={<Play size={40}/>} label="No Reels Yet" />
                  )
                )}
              </div>
           </div>
        </div>
      )}

      <CreatorOnboarding isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <EditProfileOverlay 
        isOpen={isEditOverlayOpen} 
        onClose={() => setIsEditOverlayOpen(false)} 
        user={userData as any} 
        onUpdate={(updatedUser) => setUserData(prev => ({ ...prev, ...updatedUser }))}
      />
      <CreateContentModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        type={createType} 
        authorId={userData.id} 
      />

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-black/40">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-zinc-950 border border-border-theme rounded-[3rem] p-12 w-full max-w-md shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-12 opacity-5 text-emerald-500">
                        <Wallet size={120} />
                    </div>

                    <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-2">Wait a <span className="text-emerald-500">Minute</span></h3>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-10">Confirming your wallet top-up.</p>

                    <div className="space-y-6">
                        <div className="p-8 bg-zinc-900 rounded-[2rem] border border-border-theme text-center">
                            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-2">Recharge Amount</p>
                            <h4 className="text-5xl font-black text-white italic tracking-tighter">${parseFloat(topUpAmount).toFixed(2)}</h4>
                        </div>

                        <div className="flex gap-4">
                             <button 
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 py-5 bg-zinc-900 text-zinc-500 font-bold rounded-2xl hover:bg-zinc-800 hover:text-white transition-all shadow-lg active:scale-95 border border-border-theme"
                             >
                                Cancel
                             </button>
                             <button 
                                onClick={confirmTopUp}
                                disabled={isProcessing}
                                className="flex-1 py-5 bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                             >
                                {isProcessing ? "Processing..." : "Confirm & Add"}
                             </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Sub-component for Empty States inside Tabs
const EmptyState = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
  <div className="col-span-full py-20 flex flex-col items-center justify-center bg-zinc-950/30 border border-border-theme border-dashed rounded-[2rem]">
    <div className="text-zinc-800 mb-4">{icon}</div>
    <p className="text-zinc-600 font-black uppercase tracking-widest text-[10px]">{label}</p>
  </div>
);

export default ProfileClient;