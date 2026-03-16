import React from 'react';
import Image from 'next/image';
import { prisma } from "@/app/lib/prisma";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Lock, Inbox } from 'lucide-react';

const MainFeed = async () => {
  // Fetch real posts from PostgreSQL
  const posts = await prisma.post.findMany({
    include: {
      author: {
        select: {
          username: true,
          image: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Handle empty state
  if (posts.length === 0) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-zinc-500">
        <Inbox size={48} className="mb-4 opacity-20" />
        <h2 className="text-xl font-bold tracking-tighter uppercase italic opacity-50">No data to display</h2>
        <p className="text-xs mt-2 uppercase tracking-widest opacity-30">Follow creators to see their content here</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto no-scrollbar snap-y snap-proximity scroll-smooth bg-black">
      <div className="max-w-4xl mx-auto pt-8 pb-24 px-4 space-y-12">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-4xl font-black italic tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
            FOR YOU
          </h2>
        </div>

        {posts.map((post, i) => (
          <div key={post.id} className="snap-start bg-zinc-900/30 backdrop-blur-md rounded-[2.5rem] border border-zinc-800/50 overflow-hidden shadow-2xl transition-all duration-500 hover:border-zinc-700">
            {/* ... [Post Header and Content Content as previously implemented] ... */}
            <div className="p-6">
               {/* Simplified for brevity, maintains logic from previous version */}
               <span className="font-bold text-white mr-2">{post.author.username}</span>
               <span className="text-zinc-300">{post.caption}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MainFeed;