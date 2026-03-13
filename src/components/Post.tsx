"use client";
import React, { useState } from 'react';
import { Heart, MessageCircle, DollarSign, Bookmark, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

interface PostProps {
  creatorName: string;
  avatar: string;
  contentUrl: string;
  isPremium: boolean;
  caption: string;
  likes: number;
}

const Post = ({ creatorName, avatar, contentUrl, isPremium, caption, likes }: PostProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false); // Simulated subscription check

  return (
    <div className="w-full bg-[var(--background)] border-b border-[var(--border)] mb-4">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <img src={avatar} className="w-9 h-9 rounded-full object-cover border border-[var(--border)]" />
          <span className="font-bold text-sm tracking-tight">{creatorName}</span>
        </div>
        <MoreHorizontal size={20} className="text-zinc-500" />
      </div>

      {/* Content Area */}
      <div className="relative aspect-square w-full bg-zinc-900 flex items-center justify-center overflow-hidden">
        <img 
          src={contentUrl} 
          className={`w-full h-full object-cover transition-all duration-700 ${isPremium && !hasAccess ? 'blur-[40px] brightness-50' : ''}`}
        />
        
        {/* Overlay for Premium Content */}
        {isPremium && !hasAccess && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
            <div className="bg-[var(--primary)] p-4 rounded-full mb-4 shadow-lg">
              <DollarSign size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">Exclusive Content</h3>
            <p className="text-sm text-zinc-300 mb-6">Subscribe to {creatorName} to unlock this post and more.</p>
            <button 
              onClick={() => setHasAccess(true)} // Simulated purchase
              className="bg-white text-black font-bold px-8 py-3 rounded-full hover:scale-105 transition"
            >
              Unlock Post
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3">
        <div className="flex justify-between mb-2">
          <div className="flex gap-4">
            <motion.button whileTap={{ scale: 1.2 }} onClick={() => setIsLiked(!isLiked)}>
              <Heart className={isLiked ? "fill-red-500 text-red-500" : ""} />
            </motion.button>
            <MessageCircle />
            <DollarSign className="text-[var(--primary)]" /> {/* Quick Tip Button */}
          </div>
          <Bookmark />
        </div>
        
        {/* Caption */}
        <div className="text-sm">
          <span className="font-bold mr-2">{creatorName}</span>
          <span className="text-zinc-400">{caption}</span>
        </div>
        <div className="text-xs text-zinc-500 mt-2 font-medium">
          {isLiked ? likes + 1 : likes} likes
        </div>
      </div>
    </div>
  );
};

export default Post;