"use client";
import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Music, Heart, MessageCircle, Send, MoreVertical } from 'lucide-react';

// Define the shape of our data
interface ReelData {
  id: string;
  url: string;
  user: string;
}

interface ReelsViewProps {
  initialData: ReelData[];
}

const ReelsView = ({ initialData }: ReelsViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [reels, setReels] = useState<ReelData[]>(initialData);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // Scroll logic to track which video is active
  const handleScroll = () => {
    if (!containerRef.current) return;
    const index = Math.round(containerRef.current.scrollTop / containerRef.current.clientHeight);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="h-screen w-full overflow-y-scroll snap-y snap-mandatory bg-black no-scrollbar"
    >
      {reels.map((reel, i) => (
        <div key={reel.id} className="h-screen w-full flex-shrink-0 snap-start relative">
          <div className="h-full w-full max-w-[500px] mx-auto bg-zinc-900 relative">
            <video 
              src={reel.url} 
              className="h-full w-full object-cover"
              loop 
              muted 
              autoPlay={currentIndex === i} 
              playsInline
            />
            
            {/* Overlay UI - Premium Aesthetic */}
            <div className="absolute bottom-20 left-6 z-10 text-white drop-shadow-lg">
              <h3 className="font-black text-xl italic tracking-tighter uppercase">
                {reel.user}
              </h3>
              <div className="flex items-center gap-2 mt-2 opacity-80">
                <Music size={14} className="animate-spin-slow" />
                <span className="text-xs font-bold uppercase tracking-widest">Original Audio</span>
              </div>
            </div>

            {/* Interaction Sidebar */}
            <div className="absolute right-4 bottom-24 flex flex-col gap-8 z-10 text-white">
              <div className="flex flex-col items-center gap-1">
                <Heart size={32} className="hover:text-red-500 transition-colors" />
                <span className="text-[10px] font-bold">2.4k</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <MessageCircle size={32} className="hover:text-blue-400 transition-colors" />
                <span className="text-[10px] font-bold">128</span>
              </div>
              <Send size={32} className="hover:text-green-400 transition-colors" />
              <MoreVertical size={32} />
            </div>
          </div>
        </div>
      ))}

      {loading && (
        <div className="h-screen w-full flex items-center justify-center snap-start">
          <Loader2 size={40} className="text-white animate-spin opacity-40" />
        </div>
      )}
    </div>
  );
};

export default ReelsView;