import React from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Send } from 'lucide-react';

interface PostCardProps {
  post: {
    id: string;
    caption: string | null;
    imageUrl?: string | null;
    author: {
      username: string;
      image: string | null;
    };
  };
}

const PostCard = ({ post }: PostCardProps) => {
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

        {post.imageUrl && (
          <div className="relative aspect-square w-full rounded-3xl overflow-hidden mb-8 border border-zinc-800">
            <Image src={post.imageUrl} alt="Post content" fill className="object-cover" />
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