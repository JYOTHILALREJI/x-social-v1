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
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!preview) {
      setError(`Please select a ${type === 'posts' ? 'image' : 'video'}`);
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("authorId", authorId);
      formData.append("caption", caption);
      formData.append("isPremium", isPremium.toString());
      if (price) formData.append("price", price);

      if (type === 'posts') {
        formData.append("imageUrl", preview);
        const res = await createPost(formData);
        if (!res.success) throw new Error(res.error);
      } else {
        formData.append("videoUrl", preview);
        const res = await createReel(formData);
        if (!res.success) throw new Error(res.error);
      }
      
      // Reset form and close
      setFile(null);
      setPreview("");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-0 md:p-6 lg:p-12 overflow-hidden">
      <div className="bg-zinc-950 border border-border-theme rounded-none md:rounded-[3rem] w-full max-w-5xl h-full md:h-auto md:max-h-[90vh] shadow-2xl relative flex flex-col md:flex-row overflow-hidden">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-20 text-zinc-600 hover:text-white transition-colors bg-black/40 backdrop-blur-md p-2 rounded-full"
        >
          <X size={20} />
        </button>

        {/* Left Side: Preview Area */}
        <div className="flex-1 bg-zinc-900/50 flex flex-col items-center justify-center p-4 md:p-0 relative min-h-[300px] md:min-h-0 border-b md:border-b-0 md:border-r border-border-theme">
           {!preview ? (
             <div 
               onClick={() => document.getElementById('file-upload')?.click()}
               className="w-full h-full flex flex-col items-center justify-center p-12 hover:bg-purple-500/5 transition-all cursor-pointer group"
             >
               <div className="w-24 h-24 rounded-full bg-zinc-950 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-2xl border border-border-theme">
                  {type === 'posts' ? <ImageIcon size={32} className="text-zinc-500 group-hover:text-purple-400 transition-colors" /> : <Video size={32} className="text-zinc-500 group-hover:text-purple-400 transition-colors" />}
               </div>
               <h3 className="text-xl font-black italic uppercase tracking-tighter text-white mb-2">Drop your media here</h3>
               <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-purple-400">Click to browse your device</p>
               <div className="mt-8 flex gap-4">
                  <div className="px-4 py-2 bg-zinc-950 rounded-xl border border-border-theme text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
                    MAX 50MB
                  </div>
                  <div className="px-4 py-2 bg-zinc-950 rounded-xl border border-border-theme text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
                    {type === 'posts' ? 'JPG, PNG, WEBP' : 'MP4, MOV'}
                  </div>
               </div>
             </div>
           ) : (
             <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
               {type === 'posts' ? (
                 <img src={preview} alt="Preview" className="w-full h-full object-contain" />
               ) : (
                 <video src={preview} className="w-full h-full object-contain" controls autoPlay />
               )}
               <div className="absolute top-6 left-6 flex items-center gap-3">
                  <div className="p-2 bg-purple-500 rounded-lg text-white">
                    {type === 'posts' ? <ImageIcon size={16} /> : <Video size={16} />}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white drop-shadow-md">Media Selected</span>
               </div>
               <button 
                type="button"
                onClick={() => { setFile(null); setPreview(""); }}
                className="absolute bottom-6 left-6 px-6 py-2 bg-red-500/20 hover:bg-red-500 backdrop-blur-md rounded-xl text-red-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-red-500/30"
               >
                 Change File
               </button>
             </div>
           )}
           
           <input
             id="file-upload"
             type="file"
             accept={type === 'posts' ? 'image/*' : 'video/*'}
             onChange={handleFileChange}
             className="hidden"
             required={!preview}
           />
        </div>

        {/* Right Side: Details Form */}
        <div className="w-full md:w-[400px] flex flex-col p-8 md:p-12 overflow-y-auto max-h-[60vh] md:max-h-none">
          <div className="flex items-center gap-4 mb-10">
            <div className="flex flex-col">
              <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">
                Post Details
              </h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Setup your {type === 'posts' ? 'post' : 'reel'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-8">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold rounded-2xl uppercase tracking-wider text-center">
                {error}
              </div>
            )}

            <div className="space-y-3">
               <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 pl-2">
                 Caption & Description
               </label>
               <textarea
                 value={caption}
                 onChange={(e) => setCaption(e.target.value)}
                 placeholder="What's on your mind? #vibrant #creator"
                 className="w-full bg-zinc-900 border border-border-theme rounded-3xl p-6 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium text-sm placeholder:text-zinc-600 resize-none h-40"
               />
            </div>

            <div className="p-6 bg-purple-500/5 border border-purple-500/10 rounded-[2rem] space-y-6">
               <div className="flex items-center justify-between">
                 <div>
                   <h3 className="text-xs font-black uppercase tracking-widest text-purple-400">Premium Access</h3>
                   <p className="text-[10px] text-zinc-500 font-medium">Require payment to view</p>
                 </div>
                 <button
                   type="button"
                   onClick={() => setIsPremium(!isPremium)}
                   className={`w-14 h-7 rounded-full transition-all relative ${isPremium ? 'bg-purple-600 shadow-[0_0_20px_rgba(147,51,234,0.3)]' : 'bg-zinc-800'}`}
                 >
                   <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-transform shadow-md ${isPremium ? 'translate-x-8' : 'translate-x-1'}`} />
                 </button>
               </div>
               
               {isPremium && (
                 <div className="space-y-3 pt-4 border-t border-purple-500/10 transition-all animate-in fade-in slide-in-from-top-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-purple-400/80 pl-2">
                      Unlock Price (in cents)
                    </label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-purple-500 font-bold">¢</span>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="500"
                        className="w-full bg-black border border-purple-500/20 rounded-2xl p-4 pl-12 text-white focus:outline-none focus:border-purple-500 transition-all font-black text-xl placeholder:text-zinc-800"
                        required={isPremium}
                        min="1"
                      />
                    </div>
                 </div>
               )}
            </div>

            <div className="pt-4 mt-auto">
              <button
                type="submit"
                disabled={loading || !preview}
                className="w-full py-5 bg-white text-black rounded-3xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center disabled:opacity-30 shadow-2xl hover:bg-purple-50 shadow-white/5"
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Uploading...</span>
                  </div>
                ) : (
                  <span>Publish Content</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
