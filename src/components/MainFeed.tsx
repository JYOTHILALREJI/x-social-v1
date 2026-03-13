"use client";
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image'; // Import for maximum data caching
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';

const MainFeed = () => {
  // Enhanced mock data to simulate database structure
  const [posts, setPosts] = useState([
    { id: 1, user: 'user_alpha', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop' },
    { id: 2, user: 'beta_creative', image: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1000&auto=format&fit=crop' },
    { id: 3, user: 'gamma_flux', image: 'https://images.unsplash.com/photo-1633167606207-d840b5070fc2?q=80&w=1000&auto=format&fit=crop' }
  ]); 
  const [loading, setLoading] = useState(false);
  const observerTarget = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          loadMorePosts();
        }
      },
      { threshold: 0.5 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [loading]);

  const loadMorePosts = () => {
    setLoading(true);
    // Simulation of database fetch
    setTimeout(() => {
      const newPosts = [
        { id: Date.now(), user: 'new_creator', image: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1000&auto=format&fit=crop' },
        { id: Date.now() + 1, user: 'discovery_daily', image: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?q=80&w=1000&auto=format&fit=crop' }
      ];
      setPosts((prev) => [...prev, ...newPosts]);
      setLoading(false);
    }, 1200);
  };

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
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-800 rounded-full border border-zinc-700 relative overflow-hidden">
                   {/* Optimized Avatar Caching */}
                   <Image src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user}`} alt="avatar" fill />
                </div>
                <div>
                  <div className="text-sm font-bold text-zinc-100 italic">@{post.user}</div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Sponsored Content</div>
                </div>
              </div>
              <MoreHorizontal className="text-zinc-500 cursor-pointer" />
            </div>
            
            {/* Optimized Post Content Area */}
            <div className="relative aspect-square md:aspect-video bg-zinc-900 border-y border-zinc-800/50">
               <Image 
                src={post.image} 
                alt="Post Content"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                className="object-cover"
                priority={i < 2} // Caches and prioritizes the first two posts
               />
            </div>

            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex gap-6">
                  <Heart size={28} className="hover:text-red-500 hover:scale-110 transition-all cursor-pointer" />
                  <MessageCircle size={28} className="hover:text-blue-400 hover:scale-110 transition-all cursor-pointer" />
                  <Send size={28} className="hover:text-green-400 hover:scale-110 transition-all cursor-pointer" />
                </div>
                <Bookmark size={28} className="hover:text-yellow-500 hover:scale-110 transition-all cursor-pointer" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-zinc-300 leading-relaxed">
                  <span className="font-bold text-white mr-2">{post.user}</span>
                  Exploring the digital void. This content is optimized and cached for maximum speed.
                </p>
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest pt-2">2 hours ago</p>
              </div>
            </div>
          </div>
        ))}

        <div ref={observerTarget} className="py-20 flex flex-col items-center gap-4">
          {loading && (
            <>
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Discovering More</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainFeed;