import React from 'react';
import Image from 'next/image';

interface StoriesBarProps {
  followedCreators: any[];
}

const StoriesBar = ({ followedCreators }: StoriesBarProps) => {
  return (
    <div className="w-full pb-8 border-b border-border-theme mb-8">
      <div className="flex gap-6 overflow-x-auto no-scrollbar py-2">
        {followedCreators.map((creator) => (
          <div key={creator.id} className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group">
            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-purple-600 to-pink-500 transition-transform group-hover:scale-105">
              <div className="w-full h-full rounded-full bg-black p-[2px]">
                <div className="w-full h-full rounded-full overflow-hidden relative border border-border-theme">
                  <Image 
                    src={creator.image || "/default_user_profile/default-avatar.png"} 
                    alt={creator.username} 
                    fill 
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-400 group-hover:text-white transition-colors text-center w-16 truncate">
              {creator.name || creator.username}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoriesBar;