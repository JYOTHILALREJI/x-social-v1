"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, UserPlus, X, Users, Loader2 } from 'lucide-react';
import { toggleFollow } from '@/app/actions/follow';
import { searchUsers } from '@/app/actions/search'; // Import the new action

const SearchPage = ({ currentUserId }: { currentUserId: string }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Effect to handle real-time search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery) {
        setIsSearching(true);
        const data = await searchUsers(searchQuery, currentUserId);
        setResults(data);
        setIsSearching(false);
      } else {
        setResults([]);
      }
    }, 300); // 300ms debounce to prevent spamming the DB

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, currentUserId]);

  const handleFollow = async (e: React.MouseEvent, creatorId: string) => {
    e.preventDefault();
    setLoadingId(creatorId);
    await toggleFollow(currentUserId, creatorId, false);
    setLoadingId(null);
  };

  return (
    <div className="w-full min-h-screen bg-black text-white px-6 md:px-12 pt-10 pb-32">
      <div className="w-full max-w-7xl mx-auto">
        
        <header className="mb-12 text-left">
          <h1 className="text-5xl font-black italic tracking-tighter text-white uppercase">
            Search <span className="text-zinc-500">Creators</span>
          </h1>
          <div className="h-1 w-20 bg-purple-600 mt-4 rounded-full" />
        </header>

        <div className="relative mb-16 group max-w-4xl">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            {isSearching ? (
              <Loader2 size={22} className="text-purple-500 animate-spin" />
            ) : (
              <Search size={22} className="text-zinc-500 group-focus-within:text-purple-500 transition-colors" />
            )}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by User ID, Name or Username..."
            className="w-full bg-zinc-900/20 border border-zinc-800/50 rounded-[2rem] py-6 pl-16 pr-14 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all backdrop-blur-md text-zinc-100 text-lg placeholder:text-zinc-600 font-medium"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-6 flex items-center text-zinc-500 hover:text-white"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="w-full">
          {searchQuery.length > 0 ? (
            <>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-8 ml-2">
                Found {results.length} Results
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((user) => (
                  <Link 
                    href={`/profile/${user.id}`} 
                    key={user.id}
                    className="flex items-center justify-between p-6 bg-zinc-900/20 border border-zinc-800/50 rounded-3xl hover:bg-zinc-800/30 transition-all cursor-pointer group hover:border-zinc-700"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-950 border border-zinc-800 flex items-center justify-center font-black text-zinc-400 text-xl italic overflow-hidden relative">
                        {user.image ? (
                           <img src={user.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          user.username?.[0].toUpperCase() || "?"
                        )}
                      </div>
                      <div>
                        <h3 className="font-black italic uppercase tracking-tighter text-white group-hover:text-purple-400 transition-colors">
                          @{user.username || "unknown"}
                        </h3>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                          {user.name || "User"} • {user._count?.followers || 0} Followers
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => handleFollow(e, user.id)}
                      disabled={loadingId === user.id}
                      className="p-3 bg-white text-black rounded-2xl hover:scale-110 transition-transform active:scale-95 shadow-lg shadow-white/5 disabled:opacity-50"
                    >
                      {loadingId === user.id ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <UserPlus size={18} />
                      )}
                    </button>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-24 h-24 rounded-full bg-zinc-900/50 flex items-center justify-center mb-8 border border-zinc-800">
                <Users size={40} className="text-zinc-700" />
              </div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-zinc-500">
                Find your <span className="text-zinc-800">community</span>
              </h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-800 mt-4">
                Search for creators, friends, or specific IDs
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;