"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play } from 'lucide-react';
import { toggleFollow } from '@/app/actions/follow';

const SuggestedCreators = ({ suggested, currentUserId }: { suggested: any[], currentUserId: string }) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleFollow = async (creatorId: string) => {
    setLoadingId(creatorId);
    await toggleFollow(currentUserId, creatorId, false);
    setLoadingId(null);
  };

  return (
    <div className="col-span-full py-12 my-8 border-y border-border-theme bg-zinc-950/20 rounded-[3rem] px-8">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">
          Suggested <span className="text-purple-500">For You</span>
        </h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {suggested.map((creator) => (
          <div key={creator.id} className="relative aspect-[9/16] bg-zinc-900 rounded-3xl overflow-hidden group border border-border-theme">
            {/* Clickable Area for Profile */}
            <Link href={`/profile/${creator.id}`} className="absolute inset-0 z-10">
              <Image 
                src={creator.latestReelThumb || "/default_user_profile/default-avatar.png"} 
                alt="Reel" fill className="object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            </Link>
            
            <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col gap-2">
              <Link href={`/profile/${creator.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-6 h-6 rounded-full overflow-hidden relative border border-white/20">
                  <Image src={creator.image || "/default_user_profile/default-avatar.png"} alt="" fill className="object-cover" />
                </div>
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="text-[10px] font-black text-white uppercase italic truncate">
                    {creator.name || creator.username}
                  </span>
                  {creator.name && (
                    <span className="text-[8px] font-bold text-zinc-500 lowercase opacity-60">
                      @{creator.username}
                    </span>
                  )}
                </div>
              </Link>
              <button 
                onClick={() => handleFollow(creator.id)}
                disabled={loadingId === creator.id}
                className="w-full py-2 bg-white text-black rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all disabled:opacity-50"
              >
                {loadingId === creator.id ? "..." : "Follow"}
              </button>
            </div>
            <Play className="absolute top-4 right-4 text-white/50 z-20" size={16} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuggestedCreators;