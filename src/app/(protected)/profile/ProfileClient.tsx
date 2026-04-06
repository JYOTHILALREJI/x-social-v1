"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Settings, PlusCircle, Grid, Play, Loader2, Plus, User as UserIcon, Eye, EyeOff, MoreVertical, Edit2, Trash2, Crown, Clock, Wallet, Heart, Star 
} from 'lucide-react';
import CreatorOnboarding from "@/components/CreatorOnboarding";
import CreateContentModal from "@/components/CreateContentModal";
import EditContentModal from "@/components/EditContentModal";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import UserSettings from "@/components/UserSettings";
import CreatorDashboard from "@/components/CreatorDashboard";
import { addWalletBalance, toggleContentVisibility } from "@/app/actions/user-actions";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, ChevronRight, CheckCircle2 } from "lucide-react";
import EditProfileOverlay from "@/components/EditProfileOverlay";
import SecurityOverlay from "@/components/SecurityOverlay";
import PrivacyOverlay from "@/components/PrivacyOverlay";
import NotificationsOverlay from "@/components/NotificationsOverlay";
import AppearanceOverlay from "@/components/AppearanceOverlay";
import ContentPreferencesOverlay from "@/components/ContentPreferencesOverlay";

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
    autoplayVideos: boolean;
    mutedWords: string[];
    posts: any[]; 
    reels: any[]; 
    revenues: any[];
    creatorProfile: {
      tier1Price: number;
      tier1Duration: number;
      tier2Price: number;
      tier2Duration: number;
      tier3Price: number;
      tier3Duration: number;
    } | null;
    follows?: any[];
    _count: { posts: number; reels: number; followers: number; follows: number };
  };
  platformFee: number;
}

const ProfileClient = ({ user, platformFee }: ProfileClientProps) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'reels'>('posts');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditOverlayOpen, setIsEditOverlayOpen] = useState(false);
  const [isSecurityOverlayOpen, setIsSecurityOverlayOpen] = useState(false);
  const [isPrivacyOverlayOpen, setIsPrivacyOverlayOpen] = useState(false);
  const [isAppearanceOverlayOpen, setIsAppearanceOverlayOpen] = useState(false);
  const [isContentPreferencesOverlayOpen, setIsContentPreferencesOverlayOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createType, setCreateType] = useState<'posts' | 'reels'>('posts');
  
  // Wallet states
  const [topUpAmount, setTopUpAmount] = useState<string>("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userData, setUserData] = useState(user);

  // Edit/Delete state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<'post' | 'reel'>('post');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const handleToggleVisibility = (id: string, type: 'post' | 'reel', isPrivate: boolean) => {
    setUserData(prev => ({
      ...prev,
      [type === 'post' ? 'posts' : 'reels']: prev[type === 'post' ? 'posts' : 'reels'].map((item: any) => 
        item.id === id ? { ...item, isPrivate } : item
      )
    }));
  };

  const handleActionToggleVisibility = async (id: string, type: 'post' | 'reel', currentPrivateStatus: boolean) => {
    const newPrivateStatus = !currentPrivateStatus;
    const res = await toggleContentVisibility(userData.id, id, type, newPrivateStatus);
    if (res.success) {
      handleToggleVisibility(id, type, newPrivateStatus);
      setActiveMenuId(null);
    } else {
      alert(res.error || "Failed to update visibility");
    }
  };

  const handleContentUpdate = (id: string, caption: string) => {
    setUserData(prev => ({
      ...prev,
      [selectedType === 'post' ? 'posts' : 'reels']: prev[selectedType === 'post' ? 'posts' : 'reels'].map((item: any) => 
        item.id === id ? { ...item, caption } : item
      )
    }));
  };

  const handleContentDelete = (id: string, type: 'post' | 'reel') => {
    setUserData(prev => ({
      ...prev,
      [type === 'post' ? 'posts' : 'reels']: prev[type === 'post' ? 'posts' : 'reels'].filter((item: any) => item.id !== id),
      _count: {
        ...prev._count,
        [type === 'post' ? 'posts' : 'reels']: prev._count[type === 'post' ? 'posts' : 'reels'] - 1
      }
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
        setUserData(prev => ({ 
            ...prev, 
            walletBalance: (res.user as any).walletBalance 
        }));
        setTopUpAmount("");
        setShowConfirm(false);
    } else {
        alert("Failed to update wallet balance.");
    }
    setIsProcessing(false);
  };


  return (
    <div className="w-full min-h-screen bg-background text-foreground px-6 md:px-12 pt-10 pb-32 transition-colors duration-300 relative">
      
      {/* Mobile Settings Button - Top Right Corner of Screen */}
      <Link 
        href="/settings" 
        className="lg:hidden absolute top-6 right-6 p-3 bg-card-bg hover:bg-card-hover rounded-2xl border border-border-theme transition-all z-20 shadow-xl"
      >
        <Settings size={22} className="text-muted-foreground" />
      </Link>

      {/* --- TOP PROFILE SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] items-center lg:items-start gap-8 lg:gap-12 mb-12 border-b border-border-theme pb-12 relative">
        {/* Profile Image */}
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-card-bg border-2 border-border-theme relative overflow-hidden shrink-0 mx-auto lg:mx-0">
           <Image 
             src={userData.image || DEFAULT_AVATAR} 
             alt={userData.username} 
             fill 
             className="object-cover"
           />
        </div>
        
        {/* User Info */}
        <div className="flex-1 space-y-4 text-center lg:text-left w-full relative">
          <div className="flex flex-col lg:flex-row lg:items-center justify-center lg:justify-start gap-4">
            <div className="flex flex-col items-center lg:items-start">
              <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter leading-none mb-1 text-foreground">
                {userData.name || userData.username}
              </h1>
              {userData.name && (
                <span className="text-xs font-black text-purple-500/80 uppercase tracking-widest italic">
                  @{userData.username}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {isVerifiedCreator && (
                <span className="px-3 py-1 bg-purple-500/10 text-purple-500 text-[10px] font-black uppercase rounded-full border border-purple-500/20">
                  Verified Creator
                </span>
              )}
            </div>

            {/* Settings Link - Desktop Only in this position */}
            <Link 
              href="/settings" 
              className="hidden lg:flex relative p-2.5 bg-card-bg hover:bg-card-hover rounded-xl border border-border-theme transition-all"
            >
              <Settings size={18} className="text-muted-foreground" />
            </Link>
          </div>

          <div className="flex justify-center lg:justify-start gap-10">
            {isCreator && (
              <>
                <div className="flex flex-col"><span className="font-bold text-2xl tracking-tighter text-foreground">{userData._count?.posts || 0}</span><span className="text-muted-foreground text-[10px] uppercase font-black tracking-widest">Posts</span></div>
                <div className="flex flex-col"><span className="font-bold text-2xl tracking-tighter text-foreground">{userData._count?.reels || 0}</span><span className="text-muted-foreground text-[10px] uppercase font-black tracking-widest">Reels</span></div>
                <div className="flex flex-col"><span className="font-bold text-2xl tracking-tighter text-foreground">{userData.followersCount || 0}</span><span className="text-muted-foreground text-[10px] uppercase font-black tracking-widest">Followers</span></div>
              </>
            )}
            <div className="flex flex-col"><span className="font-bold text-2xl tracking-tighter text-foreground">{userData._count?.follows || 0}</span><span className="text-muted-foreground text-[10px] uppercase font-black tracking-widest">Following</span></div>
          </div>

          <p className="text-muted-foreground text-sm max-w-xl leading-relaxed italic">
            {user.bio || "No biography provided."}
          </p>
        </div>

        {/* --- RESPONSIVE TOPUP BAR --- */}
        {!isVerifiedCreator && !isPending && (
          <div className="w-full md:w-fit flex flex-col md:flex-row items-center gap-4 md:gap-6 bg-background/80 border border-border-theme p-4 md:p-3 md:pl-8 rounded-[2rem] md:rounded-full hover:border-purple-600/50 transition-all shadow-2xl shadow-black/10">
            <div className="flex items-center gap-4 shrink-0 w-full md:w-auto pb-4 md:pb-0 md:pr-6 border-b md:border-b-0 md:border-r border-border-theme">
              <div className="p-3 bg-purple-500/10 rounded-full border border-purple-500/20">
                <Wallet size={18} className="text-purple-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-1">Total Assets</span>
                <span className="text-2xl font-black italic tracking-tighter text-foreground" suppressHydrationWarning>
                  ${(userData.walletBalance / 100).toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-32">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">$</span>
                 <input 
                    type="number" 
                    step="0.01"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    placeholder="Amount" 
                    className="w-full bg-background border border-border-theme rounded-2xl py-3 pl-8 pr-4 text-xs font-black focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 transition-all text-foreground placeholder:text-muted-foreground uppercase" 
                />
              </div>
              <button 
                onClick={handleTopUpRequest} 
                className="flex-1 md:flex-none px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-purple-600/20 active:scale-95 whitespace-nowrap"
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
          
          {/* Active Subscriptions / Countdown Timers */}
          {(userData.follows && userData.follows.length > 0) && (
            <div className="bg-card-bg/50 border border-border-theme rounded-[2.5rem] p-8 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <Crown size={24} className="text-amber-500" />
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Active Subscriptions</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userData.follows.map((sub: any, idx: number) => (
                  <SubscriptionTimerCard key={idx} subscription={sub} />
                ))}
              </div>
            </div>
          )}


          {isPending && (
            <div className="w-full py-12 flex flex-col items-center justify-center border border-dashed border-purple-500/50 bg-purple-500/5 rounded-[3rem]">
              <Loader2 size={40} className="text-purple-500 mb-4 animate-spin mx-auto" />
              <h2 className="text-xl font-black uppercase tracking-tighter text-purple-500">Reviewing ID Proof</h2>
              <p className="text-muted-foreground text-xs mt-2">Hang tight! Your creator dashboard is being prepared.</p>
            </div>
          )}

          <UserSettings 
            onBecomeCreatorClick={() => setIsModalOpen(true)} 
            showBecomeCreator={!isPending} 
            user={userData as any}
            onEditProfile={() => setIsEditOverlayOpen(true)}
            onSecurityClick={() => setIsSecurityOverlayOpen(true)}
            onPrivacyClick={() => setIsPrivacyOverlayOpen(true)}
            onAppearanceClick={() => setIsAppearanceOverlayOpen(true)}
            onContentPreferencesClick={() => setIsContentPreferencesOverlayOpen(true)}
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
                    className={`pb-4 text-xs font-black uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all ${activeTab === 'posts' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground'}`}
                  >
                    <Grid size={16} /> Posts
                  </button>
                  <button 
                    onClick={() => setActiveTab('reels')}
                    className={`pb-4 text-xs font-black uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all ${activeTab === 'reels' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground'}`}
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
                      className="flex items-center gap-2 px-6 py-2 bg-card-bg border border-border-theme rounded-xl text-[10px] font-black uppercase hover:bg-foreground hover:text-background transition-all"
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
                      <div key={post.id} className={`aspect-square bg-card-bg rounded-3xl overflow-hidden border relative group ${post.isPrivate ? 'border-purple-500/50' : 'border-border-theme'}`}>
                        <Image src={`/api/media/post/${post.id}`} alt="Post" fill className={`object-cover group-hover:scale-110 transition-transform duration-500 unoptimized ${post.isPrivate ? 'opacity-40 grayscale-[0.5]' : ''}`} unoptimized />
                        
                        {/* 3-Dots Menu */}
                        <div className="absolute top-3 left-3 z-20 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === post.id ? null : post.id);
                            }}
                            className="p-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-white hover:bg-black/80 transition-all"
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          <AnimatePresence>
                            {activeMenuId === post.id && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.9, x: -10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9, x: -10 }}
                                className="absolute top-0 left-12 bg-zinc-900 border border-border-theme rounded-2xl p-2 w-32 shadow-2xl z-30 flex flex-col gap-1"
                              >
                                <button 
                                  onClick={() => {
                                    setSelectedItem(post);
                                    setSelectedType('post');
                                    setIsEditModalOpen(true);
                                    setActiveMenuId(null);
                                  }}
                                  className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-xl text-[10px] font-black uppercase text-foreground transition-all text-left"
                                >
                                  <Edit2 size={14} className="text-blue-400" /> Edit
                                </button>
                                <button 
                                  onClick={() => handleActionToggleVisibility(post.id, 'post', post.isPrivate)}
                                  className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-xl text-[10px] font-black uppercase text-foreground transition-all text-left"
                                >
                                  {post.isPrivate ? (
                                    <>
                                      <Eye size={14} className="text-emerald-400" /> Show
                                    </>
                                  ) : (
                                    <>
                                      <EyeOff size={14} className="text-amber-400" /> Hide
                                    </>
                                  )}
                                </button>
                                <button 
                                  onClick={() => {
                                    setSelectedItem(post);
                                    setSelectedType('post');
                                    setIsDeleteModalOpen(true);
                                    setActiveMenuId(null);
                                  }}
                                  className="flex items-center gap-2 px-3 py-2 hover:bg-red-500/10 rounded-xl text-[10px] font-black uppercase text-red-500 transition-all text-left"
                                >
                                  <Trash2 size={14} /> Delete
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

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
                              <span className="px-2 py-1 bg-background/80 backdrop-blur-md text-purple-600 text-[9px] font-black rounded-lg border border-border-theme">
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
                      <div key={reel.id} className={`aspect-[9/16] bg-card-bg rounded-3xl overflow-hidden border relative group ${reel.isPrivate ? 'border-purple-500/50' : 'border-border-theme'}`}>
                        <video src={`/api/media/reel/${reel.id}`} className={`w-full h-full object-cover ${reel.isPrivate ? 'opacity-40 grayscale-[0.5]' : ''}`} />
                        
                        {/* 3-Dots Menu */}
                        <div className="absolute top-4 left-4 z-20 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === reel.id ? null : reel.id);
                            }}
                            className="p-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-white hover:bg-black/80 transition-all"
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          <AnimatePresence>
                            {activeMenuId === reel.id && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.9, x: -10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9, x: -10 }}
                                className="absolute top-0 left-12 bg-zinc-900 border border-border-theme rounded-2xl p-2 w-32 shadow-2xl z-30 flex flex-col gap-1"
                              >
                                <button 
                                  onClick={() => {
                                    setSelectedItem(reel);
                                    setSelectedType('reel');
                                    setIsEditModalOpen(true);
                                    setActiveMenuId(null);
                                  }}
                                  className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-xl text-[10px] font-black uppercase text-foreground transition-all text-left"
                                >
                                  <Edit2 size={14} className="text-blue-400" /> Edit
                                </button>
                                <button 
                                  onClick={() => handleActionToggleVisibility(reel.id, 'reel', reel.isPrivate)}
                                  className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-xl text-[10px] font-black uppercase text-foreground transition-all text-left"
                                >
                                  {reel.isPrivate ? (
                                    <>
                                      <Eye size={14} className="text-emerald-400" /> Show
                                    </>
                                  ) : (
                                    <>
                                      <EyeOff size={14} className="text-amber-400" /> Hide
                                    </>
                                  )}
                                </button>
                                <button 
                                  onClick={() => {
                                    setSelectedItem(reel);
                                    setSelectedType('reel');
                                    setIsDeleteModalOpen(true);
                                    setActiveMenuId(null);
                                  }}
                                  className="flex items-center gap-2 px-3 py-2 hover:bg-red-500/10 rounded-xl text-[10px] font-black uppercase text-red-500 transition-all text-left"
                                >
                                  <Trash2 size={14} /> Delete
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

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
                              <span className="px-3 py-1 bg-background/80 backdrop-blur-md text-purple-600 text-[11px] font-black rounded-xl border border-border-theme">
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
        onUpdate={(updatedUser: any) => setUserData(prev => ({ ...prev, ...updatedUser }))}
      />
      <CreateContentModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        type={createType} 
        authorId={userData.id} 
      />
      <SecurityOverlay 
        userId={userData.id} 
        isTwoFactorEnabled={!!(userData as any).twoFactorQuestion}
        defaultLoginAlerts={(userData as any).loginAlerts ?? false}
        isOpen={isSecurityOverlayOpen} 
        onClose={() => setIsSecurityOverlayOpen(false)} 
      />
      <PrivacyOverlay 
        userId={userData.id} 
        defaultPrivateAccount={(userData as any).isPrivateAccount ?? false}
        defaultActivityStatus={(userData as any).isActivityStatusEnabled ?? true}
        isOpen={isPrivacyOverlayOpen} 
        onClose={() => setIsPrivacyOverlayOpen(false)} 
        onUpdate={(updates) => setUserData(prev => ({ ...prev, ...updates }))}
      />
      <AppearanceOverlay isOpen={isAppearanceOverlayOpen} onClose={() => setIsAppearanceOverlayOpen(false)} />
      <ContentPreferencesOverlay
        isOpen={isContentPreferencesOverlayOpen}
        onClose={() => setIsContentPreferencesOverlayOpen(false)}
        userId={userData.id}
        defaultAutoplay={userData.autoplayVideos ?? true}
        defaultMutedWords={userData.mutedWords ?? []}
      />

      <EditContentModal 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedItem(null);
        }} 
        item={selectedItem} 
        type={selectedType}
        onUpdate={handleContentUpdate}
      />

      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedItem(null);
        }} 
        itemId={selectedItem?.id} 
        type={selectedType}
        onDelete={handleContentDelete}
      />

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-black/40">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-background border border-border-theme rounded-[3rem] p-12 w-full max-w-md shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-12 opacity-5 text-emerald-500">
                        <Wallet size={120} />
                    </div>

                    <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-2">Wait a <span className="text-emerald-500">Minute</span></h3>
                    <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-10">Confirming your wallet top-up.</p>

                    <div className="space-y-6">
                        <div className="p-8 bg-card-bg rounded-[2rem] border border-border-theme text-center">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2">Recharge Amount</p>
                            <h4 className="text-5xl font-black text-foreground italic tracking-tighter">${parseFloat(topUpAmount).toFixed(2)}</h4>
                        </div>

                        <div className="flex gap-4">
                             <button 
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 py-5 bg-card-bg text-muted-foreground font-bold rounded-2xl hover:bg-card-hover hover:text-foreground transition-all shadow-lg active:scale-95 border border-border-theme"
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
  <div className="col-span-full py-20 flex flex-col items-center justify-center bg-card-bg/30 border border-border-theme border-dashed rounded-[2rem]">
    <div className="text-muted-foreground mb-4 opacity-50">{icon}</div>
    <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">{label}</p>
  </div>
);

const SubscriptionTimerCard = ({ subscription }: { subscription: any }) => {
  const [timeLeft, setTimeLeft] = useState("");

  React.useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(subscription.expiresAt) - +new Date();
      if (difference > 0) {
        const d = Math.floor(difference / (1000 * 60 * 60 * 24));
        const h = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const m = Math.floor((difference / 1000 / 60) % 60);
        setTimeLeft(`${d}d ${h}h ${m}m`);
      } else {
        setTimeLeft("Expired");
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // update every minute
    return () => clearInterval(timer);
  }, [subscription.expiresAt]);

  const tierColors: Record<number, { color: string, name: string, icon: React.ReactNode }> = {
    1: { color: '#CD7F32', name: 'Bronze', icon: <Heart size={14} className="text-white" /> },
    2: { color: '#C0C0C0', name: 'Silver', icon: <Star size={14} className="text-white" /> },
    3: { color: '#FFD700', name: 'Gold', icon: <Crown size={14} className="text-white" /> }
  };

  const tierConfig = tierColors[subscription.subscriptionTier] || tierColors[1];

  return (
    <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-border-theme hover:border-border-theme/80 transition-all group">
      <div>
        <p className="text-sm font-black italic uppercase tracking-tighter text-white mb-1">@{subscription.following?.username || "Creator"}</p>
        <div className="flex items-center gap-1.5 opacity-90">
            <span className="p-1 rounded-full" style={{ backgroundColor: tierConfig.color }}>
               {tierConfig.icon}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: tierConfig.color }}>
               {tierConfig.name} Member
            </span>
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-center gap-1.5 justify-end text-zinc-400 mb-1">
          <Clock size={12} />
          <span className="text-[9px] font-bold uppercase tracking-widest">Time Remaining</span>
        </div>
        <p className={`font-black tracking-tight ${timeLeft === 'Expired' ? 'text-red-500' : 'text-foreground'}`}>{timeLeft}</p>
      </div>
    </div>
  );
};

export default ProfileClient;