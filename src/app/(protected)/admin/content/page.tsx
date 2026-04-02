"use client";

import { useEffect, useState } from "react";
import { getAllContent, deletePost, deleteReel } from "@/app/actions/admin-actions";
import { 
  Image as ImageIcon, 
  PlayCircle, 
  Trash2, 
  ExternalLink, 
  User, 
  Filter, 
  Search,
  Eye,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ContentManagementPage() {
  const [data, setData] = useState<{ posts: any[], reels: any[] }>({ posts: [], reels: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'posts' | 'reels'>('posts');
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchContent();
  }, []);

  async function fetchContent() {
    setLoading(true);
    const res = await getAllContent();
    if (res.success) {
      setData({ posts: res.posts || [], reels: res.reels || [] });
    }
    setLoading(false);
  }

  const handleDelete = async (id: string) => {
    if (confirm(`Are you sure you want to delete this ${tab.slice(0, -1)}?`)) {
      const res = tab === 'posts' ? await deletePost(id) : await deleteReel(id);
      if (res.success) fetchContent();
    }
  };

  const currentList = tab === 'posts' ? data.posts : data.reels;
  const filteredList = currentList.filter((item: any) => 
    item.caption?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.author.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-950 p-8 rounded-3xl border border-border-theme shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <ImageIcon size={200} />
        </div>
        <div className="space-y-1 relative z-10">
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
            Content Moderation
          </h1>
          <p className="text-zinc-500 font-medium">Manage all user generated posts and reels from a single place.</p>
        </div>
        <div className="flex gap-4 relative z-10">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-purple-400 transition-colors" size={20} />
                <input 
                    type="text" 
                    placeholder="Search content..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-6 py-3.5 bg-black border border-border-theme rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all w-full md:w-64 backdrop-blur-xl"
                />
            </div>
            <button className="p-3.5 bg-zinc-900 rounded-2xl text-zinc-400 hover:text-white transition-colors border border-border-theme">
                <Filter size={20} />
            </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex p-1.5 bg-zinc-950 border border-border-theme rounded-2xl w-fit shadow-xl">
        <button 
          onClick={() => setTab('posts')}
          className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all duration-300 ${tab === 'posts' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <ImageIcon size={18} /> Posts
        </button>
        <button 
          onClick={() => setTab('reels')}
          className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all duration-300 ${tab === 'reels' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <PlayCircle size={18} /> Reels
        </button>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {loading ? (
             Array(8).fill(0).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-zinc-950 rounded-3xl border border-border-theme animate-pulse" />
             ))
          ) : filteredList.length === 0 ? (
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               className="col-span-full py-32 flex flex-col items-center justify-center text-zinc-500 bg-zinc-950 rounded-3xl border border-border-theme border-dashed"
            >
               <ImageIcon size={48} className="mb-4 opacity-20" />
               <p className="text-xl font-bold">No content found</p>
            </motion.div>
          ) : filteredList.map((item, i) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.05 }}
              className="group bg-zinc-950 rounded-3xl border border-border-theme overflow-hidden shadow-xl hover:shadow-2xl hover:border-border-theme transition-all duration-500 relative"
            >
              {/* Media Preview */}
              <div className="aspect-[3/4] relative bg-black overflow-hidden">
                {tab === 'posts' ? (
                  <img src={item.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                ) : (
                  <video src={item.videoUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" muted />
                )}
                
                {/* Overlay Controls */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  <div className="flex gap-2">
                    <button className="flex-1 py-3 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors">
                      <Eye size={14} /> Preview
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-3 bg-red-600 text-white rounded-xl hover:bg-red-500 transition-colors shadow-lg shadow-red-500/20"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {item.isPremium && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-yellow-500 text-black font-black text-[10px] uppercase tracking-widest rounded-full shadow-xl">
                    Premium
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-xs">
                        {item.author.username[0].toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                        <p className="font-bold text-white text-sm truncate">{item.author.username}</p>
                        <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest flex items-center gap-1">
                            <Calendar size={10} /> {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <p className="text-zinc-400 text-xs line-clamp-2 italic">
                    "{item.caption || 'No caption'}"
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
