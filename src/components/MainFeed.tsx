"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';

const MainFeed = () => {
  const [posts, setPosts] = useState([1, 2, 3]); 
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
    setTimeout(() => {
      setPosts((prev) => [...prev, prev.length + 1, prev.length + 2]);
      setLoading(false);
    }, 800);
  };

  return (
    /* h-full and no-scrollbar ensures the container handles its own scrolling without body bars */
    <div className="h-full w-full overflow-y-auto no-scrollbar snap-y snap-proximity scroll-smooth bg-black">
      {/* Increased max-width for bigger screens */}
      <div className="max-w-4xl mx-auto pt-8 pb-24 px-4 space-y-12">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-4xl font-black italic tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
            FOR YOU
          </h2>
        </div>

        {posts.map((i) => (
          <div key={i} className="snap-start bg-zinc-900/30 backdrop-blur-md rounded-[2.5rem] border border-zinc-800/50 overflow-hidden shadow-2xl transition-all duration-500 hover:border-zinc-700">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-tr from-zinc-700 to-zinc-900 rounded-full border border-zinc-700" />
                <div>
                  <div className="h-4 w-28 bg-zinc-800 rounded-full mb-1" />
                  <div className="h-3 w-20 bg-zinc-900 rounded-full" />
                </div>
              </div>
              <MoreHorizontal className="text-zinc-500 cursor-pointer" />
            </div>
            
            {/* Post Content Area */}
            <div className="aspect-square md:aspect-video bg-zinc-800/50 flex items-center justify-center border-y border-zinc-800/50">
               <span className="text-zinc-600 font-mono text-sm uppercase tracking-[0.2em] opacity-50">Content_Media_{i}</span>
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
              <div className="space-y-3">
                <div className="h-4 w-3/4 bg-zinc-800/50 rounded-full" />
                <div className="h-4 w-1/2 bg-zinc-900/50 rounded-full" />
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