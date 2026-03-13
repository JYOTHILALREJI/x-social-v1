"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

// Mock data for Phase 1
const MOCK_STORIES = [
  { id: 1, name: 'Your Story', image: 'https://i.pravatar.cc/150?u=1', isUser: true },
  { id: 2, name: 'Amelia_V', image: 'https://i.pravatar.cc/150?u=2', isLive: true },
  { id: 3, name: 'Zara_Lux', image: 'https://i.pravatar.cc/150?u=3', isLive: false },
  { id: 4, name: 'Sasha_Red', image: 'https://i.pravatar.cc/150?u=4', isLive: false },
  { id: 5, name: 'Mia_K', image: 'https://i.pravatar.cc/150?u=5', isLive: true },
  { id: 6, name: 'Elena_X', image: 'https://i.pravatar.cc/150?u=6', isLive: false },
  { id: 7, name: 'Jade_B', image: 'https://i.pravatar.cc/150?u=7', isLive: false },
];

const StoriesBar = () => {
  return (
    <div className="w-full bg-[var(--background)] border-b border-[var(--border)] py-4 overflow-x-auto no-scrollbar">
      <div className="flex px-4 gap-4">
        {MOCK_STORIES.map((story) => (
          <motion.div
            key={story.id}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer"
          >
            <div className="relative">
              {/* The Border Ring */}
              <div className={`p-[2px] rounded-full ${
                story.isLive 
                  ? 'bg-gradient-to-tr from-yellow-400 to-red-600' // Live Ring
                  : story.isUser 
                    ? 'bg-transparent' // Your story ring
                    : 'bg-gradient-to-tr from-[var(--primary)] to-[var(--accent)]' // Standard Story Ring
              }`}>
                {/* The Avatar */}
                <div className="bg-[var(--background)] p-[2px] rounded-full">
                  <img
                    src={story.image}
                    alt={story.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                </div>
              </div>

              {/* "Plus" Icon for User */}
              {story.isUser && (
                <div className="absolute bottom-0 right-0 bg-[var(--primary)] rounded-full border-2 border-[var(--background)] p-1">
                  <Plus size={12} className="text-white" strokeWidth={4} />
                </div>
              )}

              {/* "Live" Badge */}
              {story.isLive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded border-2 border-[var(--background)] text-white">
                  LIVE
                </div>
              )}
            </div>
            
            <span className="text-[11px] font-medium max-w-[72px] truncate">
              {story.name}
            </span>
          </motion.div>
        ))}
      </div>
      
      {/* CSS to hide scrollbar but allow scrolling */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default StoriesBar;