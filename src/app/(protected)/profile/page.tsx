"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Settings, MapPin, Link as LinkIcon, Heart, 
  MessageSquare, PlusCircle, Grid, Play, Upload, Loader2
} from 'lucide-react';
import CreatorOnboarding from "@/components/CreatorOnboarding";

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState<'posts' | 'reels'>('posts');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // MOCK DATA: In your actual app, fetch this user from Prisma via a Server Component
  const user = {
    username: "scarlett_rose",
    role: "USER", 
    creatorStatus: "PENDING", // Logic: NONE, PENDING, APPROVED, REJECTED
    bio: "Creating exclusive content for my top fans 💋",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
    posts: [], 
    reels: [],
    _count: { posts: 0, reels: 0 }
  };

  const isCreator = user.role === 'CREATOR';
  const isPending = user.creatorStatus === 'PENDING';

  return (
    <div className="w-full min-h-screen bg-black text-white px-4 md:px-10 lg:px-16 pt-10 pb-32">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-12 mb-12 border-b border-zinc-900 pb-12">
        <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-zinc-900 flex-shrink-0 border border-zinc-800 relative overflow-hidden">
           {user.image ? (
             <Image src={user.image} alt="Profile" fill className="object-cover" />
           ) : (
             <div className="w-full h-full flex items-center justify-center text-4xl font-black text-zinc-700">
               {user.username.substring(0, 2).toUpperCase()}
             </div>
           )}
        </div>
        
        <div className="flex-1 w-full space-y-6 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <h1 className="text-3xl font-bold tracking-tight">{user.username}</h1>
            <div className="flex gap-3">
              <button className="px-8 py-2 bg-zinc-900 text-white border border-zinc-800 rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors">
                Edit Profile
              </button>
              <Link href="/settings">
                <button className="p-2 bg-zinc-900 rounded-xl border border-zinc-800 hover:bg-zinc-800 transition-colors">
                  <Settings size={22} />
                </button>
              </Link>
            </div>
          </div>
          <div className="flex justify-center md:justify-start gap-12 text-lg">
            <span><strong className="text-white">{user._count.posts}</strong> <span className="text-zinc-500 text-sm ml-1">posts</span></span>
            <span><strong className="text-white">0</strong> <span className="text-zinc-500 text-sm ml-1">followers</span></span>
            <span><strong className="text-white">0</strong> <span className="text-zinc-500 text-sm ml-1">following</span></span>
          </div>
          <div className="max-w-lg">
            <p className="text-zinc-400 leading-relaxed">{user.bio || "No bio yet."}</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {!isCreator ? (
        <div className={`w-full py-20 flex flex-col items-center justify-center border-2 border-dashed rounded-[3rem] transition-all ${isPending ? 'border-purple-500/50 bg-purple-500/5' : 'border-zinc-900 bg-zinc-950/50'}`}>
          {isPending ? (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
              <div className="relative">
                <Loader2 size={48} className="text-purple-500 mb-4 animate-spin" />
                <div className="absolute inset-0 blur-xl bg-purple-500/20 rounded-full animate-pulse" />
              </div>
              <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-2 text-purple-500">Verification in Progress</h2>
              <p className="text-zinc-500 text-sm mb-8 text-center px-4 max-w-md italic">
                Our safety team is currently reviewing your ID and categories. This usually takes less than 24 hours.
              </p>
              <div className="px-10 py-4 bg-purple-500/20 text-purple-400 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-purple-500/30">
                Application Submitted & Locked
              </div>
            </div>
          ) : (
            <>
              <PlusCircle size={48} className="text-zinc-700 mb-4" />
              <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-2 text-white">Ready to earn?</h2>
              <p className="text-zinc-500 text-sm mb-8 text-center px-4 max-w-md">
                Start sharing exclusive content and monetizing your profile by becoming a verified creator.
              </p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-10 py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl font-black italic tracking-tighter uppercase hover:scale-105 transition-transform shadow-[0_0_30px_-5px_rgba(236,72,153,0.3)]"
              >
                Become a Creator
              </button>
            </>
          )}
        </div>
      ) : (
        /* CREATOR VIEW: Tabs */
        <div className="space-y-8">
          <div className="flex justify-center border-b border-zinc-900">
             <button onClick={() => setActiveTab('posts')} className={`flex items-center gap-2 px-12 py-4 font-bold uppercase tracking-widest text-xs transition-all border-b-2 ${activeTab === 'posts' ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-white'}`}>
              <Grid size={18} /> Posts
            </button>
            <button onClick={() => setActiveTab('reels')} className={`flex items-center gap-2 px-12 py-4 font-bold uppercase tracking-widest text-xs transition-all border-b-2 ${activeTab === 'reels' ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-white'}`}>
              <Play size={18} /> Reels
            </button>
          </div>
          {/* Posts/Reels Grid Rendering Logic... */}
        </div>
      )}

      <CreatorOnboarding isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default ProfilePage;