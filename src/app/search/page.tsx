"use client";
import React, { useState } from 'react';
import { Search, UserPlus, X } from 'lucide-react';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Placeholder data - this will be replaced with database results later
  const mockResults = [
    { id: "1", username: "alex_designs", name: "Alex Rivera", followers: "5.2K" },
    { id: "2", username: "creative_mind", name: "Sarah Chen", followers: "12.8K" },
  ];

  return (
    <div className="w-full min-h-screen bg-black text-white px-4 md:px-10 lg:px-16 pt-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-black mb-8 tracking-tight uppercase italic">Search</h1>

        {/* Search Input Group */}
        <div className="relative mb-10 group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search size={20} className="text-zinc-500 group-focus-within:text-white transition-colors" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by User ID or username..."
            className="w-full bg-zinc-900/40 border border-zinc-800/50 rounded-2xl py-4 pl-14 pr-12 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-all backdrop-blur-md text-zinc-100 placeholder:text-zinc-600"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-5 flex items-center text-zinc-500 hover:text-white"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Search Results Area */}
        <div className="space-y-4">
          {searchQuery.length > 0 ? (
            <>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-2 mb-4">Results</p>
              {mockResults.map((user) => (
                <div 
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-zinc-900/20 border border-zinc-800/50 rounded-2xl hover:bg-zinc-800/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-950 border border-zinc-800 flex items-center justify-center font-bold text-zinc-600">
                      {user.username[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-100 group-hover:text-white">@{user.username}</h3>
                      <p className="text-xs text-zinc-500">{user.name} • {user.followers} followers</p>
                    </div>
                  </div>
                  <button className="p-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors">
                    <UserPlus size={18} />
                  </button>
                </div>
              ))}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-20">
              <Search size={64} className="mb-4" />
              <p className="text-lg font-medium">Find your community</p>
              <p className="text-sm">Search for creators, friends, or specific IDs</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;