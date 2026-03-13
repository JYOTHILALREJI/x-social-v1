"use client";
import React from 'react';
// 1. Import Link from next/link
import Link from 'next/link';
import { Settings, MapPin, Link as LinkIcon, Heart, MessageSquare } from 'lucide-react';

const ProfilePage = () => {
  return (
    <div className="w-full min-h-screen bg-black text-white px-4 md:px-10 lg:px-16 pt-10">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-12 mb-12 border-b border-zinc-900 pb-12">
        <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-950 flex-shrink-0 border border-zinc-800 flex items-center justify-center">
           <span className="text-4xl font-black text-zinc-700">JD</span>
        </div>
        
        <div className="flex-1 w-full space-y-6 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <h1 className="text-3xl font-bold tracking-tight">johndoe_official</h1>
            <div className="flex gap-3">
              <button className="px-8 py-2 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors">
                Edit Profile
              </button>
              
              {/* 2. Wrap the Settings button in a Link to /settings */}
              <Link href="/settings">
                <button className="p-2 bg-zinc-900 rounded-xl border border-zinc-800 hover:bg-zinc-800 transition-colors">
                  <Settings size={22} />
                </button>
              </Link>
            </div>
          </div>
          
          <div className="flex justify-center md:justify-start gap-12 text-lg">
            <span><strong className="text-white">42</strong> <span className="text-zinc-500 text-sm ml-1">posts</span></span>
            <span><strong className="text-white">12.8K</strong> <span className="text-zinc-500 text-sm ml-1">followers</span></span>
            <span><strong className="text-white">450</strong> <span className="text-zinc-500 text-sm ml-1">following</span></span>
          </div>

          <div className="max-w-lg">
            <p className="font-bold text-xl text-zinc-100">John Doe</p>
            <p className="text-zinc-400 mt-2 leading-relaxed">Digital Creator | Exploring the intersection of AI and Art 🚀</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 mt-4 text-zinc-500 text-xs">
              <span className="flex items-center gap-2"><MapPin size={16} /> Dubai, UAE</span>
              <a href="#" className="flex items-center gap-2 text-blue-400 hover:underline"><LinkIcon size={16} /> x-social.ai</a>
            </div>
          </div>
        </div>
      </div>

      {/* Grid with larger gaps for desktop */}
      <div className="grid grid-cols-3 gap-1 md:gap-6 lg:gap-8 pb-32">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="group relative aspect-square bg-zinc-900/50 rounded-2xl overflow-hidden cursor-pointer border border-zinc-800/50 transition-all hover:scale-[1.02]">
            <div className="w-full h-full flex items-center justify-center">
               <span className="text-zinc-800 font-mono text-[10px] uppercase tracking-widest opacity-30">Sample_Post_{i + 1}</span>
            </div>
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-8">
              <span className="flex items-center gap-2 font-bold text-lg"><Heart fill="white" size={24} /> 1.2k</span>
              <span className="flex items-center gap-2 font-bold text-lg"><MessageSquare fill="white" size={24} /> 84</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfilePage;