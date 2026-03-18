"use client";

import React, { useState } from 'react';
import { Loader2, Image as ImageIcon, Video, X } from 'lucide-react';
import { createPost, createReel } from '@/app/actions/content';

interface CreateContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'posts' | 'reels';
  authorId: string;
}

export default function CreateContentModal({ isOpen, onClose, type, authorId }: CreateContentModalProps) {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!url) {
      setError(`Please provide a ${type === 'posts' ? 'image' : 'video'} URL`);
      return;
    }

    setLoading(true);

    try {
      const parsedPrice = price ? parseInt(price) : null;
      if (type === 'posts') {
        const res = await createPost(authorId, url, caption, isPremium, parsedPrice);
        if (!res.success) throw new Error(res.error);
      } else {
        const res = await createReel(authorId, url, caption, isPremium, parsedPrice);
        if (!res.success) throw new Error(res.error);
      }
      
      // Reset form and close
      setUrl("");
      setCaption("");
      setIsPremium(false);
      setPrice("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create content");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-zinc-600 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
            {type === 'posts' ? <ImageIcon size={24} /> : <Video size={24} />}
          </div>
          <div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">
              Create {type === 'posts' ? 'Post' : 'Reel'}
            </h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              Share new content with your fans
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-2xl uppercase tracking-wider text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
             <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 pl-2">
               {type === 'posts' ? 'Image URL' : 'Video URL'}
             </label>
             <input
               type="url"
               value={url}
               onChange={(e) => setUrl(e.target.value)}
               placeholder={`https://example.com/${type === 'posts' ? 'image.jpg' : 'video.mp4'}`}
               className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium text-sm placeholder:text-zinc-600"
               required
             />
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 pl-2">
               Caption (Optional)
             </label>
             <textarea
               value={caption}
               onChange={(e) => setCaption(e.target.value)}
               placeholder="Write something nice..."
               className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium text-sm placeholder:text-zinc-600 resize-none h-24"
             />
          </div>

          <div className="p-5 bg-purple-500/5 border border-purple-500/20 rounded-3xl space-y-4">
             <div className="flex items-center justify-between">
               <div>
                 <h3 className="text-xs font-black uppercase tracking-widest text-purple-400">Premium Content</h3>
                 <p className="text-[10px] text-zinc-500 font-medium">Charge fans to unlock this content</p>
               </div>
               <button
                 type="button"
                 onClick={() => setIsPremium(!isPremium)}
                 className={`w-12 h-6 rounded-full transition-colors relative ${isPremium ? 'bg-purple-600' : 'bg-zinc-800'}`}
               >
                 <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${isPremium ? 'translate-x-7' : 'translate-x-1'}`} />
               </button>
             </div>
             
             {isPremium && (
               <div className="space-y-2 pt-2 border-t border-purple-500/20">
                  <label className="text-[10px] font-black uppercase tracking-widest text-purple-400/80 pl-2">
                    Unlock Price ($)
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 500 (for $5.00)"
                    className="w-full bg-black border border-purple-500/30 rounded-2xl p-4 text-white focus:outline-none focus:border-purple-500 transition-all font-medium text-sm placeholder:text-zinc-700"
                    required={isPremium}
                    min="1"
                  />
               </div>
             )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-transform flex justify-center items-center disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? <Loader2 size={16} className="animate-spin text-zinc-500" /> : `Publish ${type === 'posts' ? 'Post' : 'Reel'}`}
          </button>
        </form>
      </div>
    </div>
  );
}
