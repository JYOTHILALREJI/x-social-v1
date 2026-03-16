"use client";
import React, { useState } from 'react';
import { Search, MoreVertical, Edit, CheckCheck, Send, Paperclip, Smile } from 'lucide-react';

const MessagesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");

  const chats = [
    { id: 1, name: "Sarah Chen", lastMsg: "The new design looks fire! 🔥", time: "12:45 PM", unread: 2, online: true },
    { id: 2, name: "Alex Rivera", lastMsg: "Did you check the reels?", time: "Yesterday", unread: 0, online: false },
    { id: 3, name: "Neon Vibes", lastMsg: "Sent a video", time: "Wed", unread: 0, online: true },
  ];

  return (
    /* Height calculation to account for mobile navbar. 
       Flex-row-reverse on mobile puts list first, 
       but on desktop we use a standard flex-row.
    */
    <div className="w-full h-[calc(100vh-6rem)] md:h-screen bg-black text-white flex overflow-hidden">
      
      {/* 1. MIDDLE SECTION: Messaging / Chat Window (Takes most space) */}
      <div className="flex-1 flex flex-col bg-zinc-950/20 relative">
        {/* Chat Header */}
        <div className="p-4 md:p-6 border-b border-zinc-900 flex items-center justify-between backdrop-blur-md bg-black/40">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700" />
            <div>
              <h2 className="font-bold text-sm md:text-base">Sarah Chen</h2>
              <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Online</p>
            </div>
          </div>
          <MoreVertical size={20} className="text-zinc-500 cursor-pointer" />
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          <div className="max-w-[80%] bg-zinc-900/50 p-4 rounded-2xl rounded-tl-none border border-zinc-800/50 text-sm">
            Hey! Have you seen the latest UI updates for the Reels page?
          </div>
          <div className="max-w-[80%] bg-white text-black p-4 rounded-2xl rounded-br-none ml-auto text-sm font-medium">
            Just checked them out. The snapping feels way smoother now.
          </div>
        </div>

        {/* Message Input */}
        <div className="p-4 md:p-6 border-t border-zinc-900 bg-black">
          <div className="relative flex items-center gap-4">
            <div className="flex-1 relative">
              <input 
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a message..."
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-3 px-12 focus:outline-none focus:ring-1 focus:ring-zinc-600 text-sm"
              />
              <Smile className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
              <Paperclip className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer" size={20} />
            </div>
            <button className="bg-white text-black p-3 rounded-xl hover:bg-zinc-200 transition-colors">
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. RIGHT SECTION: Chat List (Sidebar-style on the right) */}
      <div className="hidden lg:flex w-[350px] border-l border-zinc-900 flex-col bg-black">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-black italic tracking-tighter uppercase">Contacts</h1>
            <Edit size={18} className="text-zinc-500 hover:text-white cursor-pointer" />
          </div>

          <div className="relative group mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
            <input 
              type="text"
              placeholder="Search..."
              className="w-full bg-zinc-900/30 border border-zinc-800/50 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-zinc-700 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {chats.map((chat) => (
            <div key={chat.id} className="px-6 py-4 flex items-center gap-4 hover:bg-zinc-900/30 cursor-pointer transition-all border-b border-zinc-900/50 last:border-0 group">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-600 text-sm">
                  {chat.name[0]}
                </div>
                {chat.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-xs text-zinc-300 group-hover:text-white truncate">{chat.name}</h3>
                  <span className="text-[9px] text-zinc-600 font-medium">{chat.time}</span>
                </div>
                <p className="text-xs text-zinc-500 truncate mt-0.5">{chat.lastMsg}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;