import React from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Send, Lock } from 'lucide-react';

interface PostCardProps {
  post: {
    id: string;
    caption: string | null;
    imageUrl?: string | null;
    authorId: string;
    isPremium: boolean;
    price: number | null;
    author: {
      username: string;
      image: string | null;
    };
    purchases?: any[];
  };
  isSubscribed?: boolean;
}

const PostCard = ({ post, isSubscribed = false }: PostCardProps) => {
  const isUnlocked = !post.isPremium || isSubscribed || (post.purchases && post.purchases.length > 0);

  return (
    <article className="snap-start w-full bg-zinc-900/20 backdrop-blur-md rounded-[2.5rem] border border-zinc-900/50 overflow-hidden transition-all duration-500 hover:border-zinc-800">
      <div className="p-8 md:p-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-zinc-800 overflow-hidden relative border border-zinc-800">
            <Image 
              src={post.author.image || "/default_user_profile/default-avatar.png"} 
              alt={post.author.username} 
              fill 
              className="object-cover" 
            />
          </div>
          <span className="font-black italic uppercase tracking-tighter text-white text-lg">
            {post.author.username}
          </span>
        </div>

        {post.id && (
          <div className="relative aspect-square w-full rounded-3xl overflow-hidden mb-8 border border-zinc-800 group/media">
            <Image 
              src={`/api/media/post/${post.id}`} 
              alt="Post content" 
              fill 
              className={`object-cover transition-all duration-700 ${!isUnlocked ? 'blur-2xl scale-110 opacity-40' : 'group-hover/media:scale-105'}`} 
              unoptimized 
            />
            {!isUnlocked && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-black/40 via-black/10 to-black/60 backdrop-blur-[3px]">
                {/* Lock Icon */}
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-2xl"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 0 32px rgba(168,85,247,0.5)' }}>
                  <Lock size={26} className="text-white" />
                </div>

                {/* Label */}
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-purple-300 mb-3">Premium Content</p>

                {/* Price Badge */}
                <div className="flex items-center gap-1 px-4 py-1.5 rounded-full mb-6 border border-purple-500/40"
                  style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.35), rgba(168,85,247,0.2))' }}>
                  <span className="text-[11px] font-black text-purple-300">$</span>
                  <span className="text-lg font-black text-white" style={{ textShadow: '0 0 12px rgba(168,85,247,0.8)' }}>
                    {((post.price || 0) / 100).toFixed(2)}
                  </span>
                </div>

                {/* Unlock Button */}
                <button
                  className="relative px-8 py-3 text-[10px] font-black uppercase tracking-widest text-white rounded-full overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)',
                    boxShadow: '0 0 24px rgba(168,85,247,0.6), 0 4px 20px rgba(0,0,0,0.4)'
                  }}
                >
                  <span className="relative z-10">🔓 Unlock Now</span>
                </button>
              </div>
            )}
          </div>
        )}

        <p className="text-zinc-300 text-base leading-relaxed mb-8 font-medium">
          {post.caption}
        </p>
        
        <div className="flex items-center gap-8 text-zinc-500 border-t border-zinc-900/50 pt-8">
          <button className="flex items-center gap-2 hover:text-red-500 transition-colors group">
            <Heart size={22} className="group-active:scale-125 transition-transform" />
            <span className="text-[10px] font-black uppercase">Like</span>
          </button>
          <button className="flex items-center gap-2 hover:text-blue-500 transition-colors">
            <MessageCircle size={22} />
            <span className="text-[10px] font-black uppercase">Comment</span>
          </button>
          <button className="flex items-center gap-2 hover:text-green-500 transition-colors ml-auto">
            <Send size={22} />
          </button>
        </div>
      </div>
    </article>
  );
};

export default PostCard;