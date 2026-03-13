"use client";
import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Music } from 'lucide-react';

const INITIAL_REELS = [
  { id: 1, url: 'https://v1.bg.ot7.me/api/v1/render/video/mixkit-girl-in-neon-light-1282-large.mp4', user: '@neon_vibes' },
  { id: 2, url: 'https://v1.bg.ot7.me/api/v1/render/video/mixkit-stars-in-the-sky-at-night-1120-large.mp4', user: '@galaxy_man' },
  { id: 3, url: 'https://v1.bg.ot7.me/api/v1/render/video/mixkit-tree-with-yellow-leaves-low-angle-shot-1579-large.mp4', user: '@nature_daily' }
];

const ReelsView = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [reels, setReels] = useState(INITIAL_REELS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const isThrottled = useRef(false);

  const scrollToReel = (index: number) => {
    if (index < 0 || index > reels.length) return; 

    setCurrentIndex(index);
    
    const targetElement = containerRef.current?.children[index];
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (currentIndex === reels.length && !loading) {
      loadMoreReels();
    }
  }, [currentIndex, reels.length, loading]);

  const loadMoreReels = () => {
    setLoading(true);
    setTimeout(() => {
      const nextBatch = INITIAL_REELS.map(r => ({ ...r, id: Math.random() }));
      setReels(prev => [...prev, ...nextBatch]);
      setLoading(false);
    }, 1500);
  };

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isThrottled.current) return;
      
      isThrottled.current = true;
      const direction = e.deltaY > 0 ? 1 : -1;
      scrollToReel(currentIndex + direction);
      setTimeout(() => { isThrottled.current = false; }, 800);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') scrollToReel(currentIndex + 1);
      if (e.key === 'ArrowUp') scrollToReel(currentIndex - 1);
    };

    const container = containerRef.current;
    container?.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      container?.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, reels.length]); 

  return (
    <div 
      ref={containerRef} 
      /* FIX: h-[calc(100vh-6rem)] subtracts the mobile navbar height (approx 96px/pb-24) 
         md:h-screen restores full height for desktop where navbar is on the side.
      */
      className="h-[calc(100vh-6rem)] md:h-screen w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-black"
    >
      {reels.map((reel, i) => (
        /* FIX: Ensure each snap item matches the container height exactly */
        <div key={reel.id} className="h-full w-full flex-shrink-0 flex items-center justify-center snap-start relative">
          <div className="h-full aspect-[9/16] bg-zinc-900 relative shadow-2xl">
            <video 
              src={reel.url} 
              className="h-full w-full object-cover"
              loop muted autoPlay={currentIndex === i} playsInline
            />
            <div className="absolute bottom-10 left-6 z-10 text-white">
              <h3 className="font-black text-xl">@{reel.user.split('@')[1]}</h3>
              <div className="flex items-center gap-2 mt-2 opacity-80">
                <Music size={14} className="animate-spin-slow" />
                <span className="text-xs">Original Audio</span>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {/* Loading sentinel also matches h-full */}
      <div className="h-full w-full flex items-center justify-center snap-start bg-black">
        <div className="h-full aspect-[9/16] bg-zinc-900/50 flex flex-col items-center justify-center gap-4 border border-zinc-800/30">
          <Loader2 size={40} className="text-white animate-spin opacity-40" />
          <p className="text-zinc-500 font-bold tracking-widest text-[10px] animate-pulse">
            LOADING
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReelsView;