"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Loader2, Type } from 'lucide-react';
import { updatePost, updateReel } from '@/app/actions/content';

interface EditContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    caption: string | null;
    imageUrl?: string;
    videoUrl?: string;
  } | null;
  type: 'post' | 'reel';
  onUpdate?: (id: string, caption: string) => void;
}

export default function EditContentModal({ isOpen, onClose, item, type, onUpdate }: EditContentModalProps) {
  const [caption, setCaption] = useState(item?.caption || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setCaption(item.caption || "");
    }
  }, [item]);

  if (!item) return null;

  const handleSave = async () => {
    setIsSaving(true);
    const res = type === 'post' 
      ? await updatePost(item.id, caption)
      : await updateReel(item.id, caption);

    if (res.success) {
      if (onUpdate) onUpdate(item.id, caption);
      onClose();
    } else {
      alert(res.error || "Failed to update caption");
    }
    setIsSaving(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="absolute inset-0" 
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="relative bg-zinc-950/90 border border-white/10 w-full max-w-5xl rounded-[3.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] backdrop-blur-3xl flex flex-col md:flex-row min-h-[600px] z-[120]"
          >
            {/* --- MEDIA PREVIEW (LEFT) --- */}
            <div className="w-full md:w-[55%] relative group bg-black flex items-center justify-center overflow-hidden border-r border-white/5">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/10 to-transparent z-10 pointer-events-none" />
              
              {type === 'post' ? (
                <motion.img 
                  layoutId={`post-media-${item.id}`}
                  src={`/api/media/post/${item.id}`} 
                  alt="Preview" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
              ) : (
                <motion.video 
                  layoutId={`reel-media-${item.id}`}
                  src={`/api/media/reel/${item.id}`} 
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              )}

              {/* Status Badge */}
              <div className="absolute top-8 left-8 z-20">
                <div className="px-4 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Live Preview</span>
                </div>
              </div>

              {/* Footer Gradient Overlay */}
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
            </div>

            {/* --- EDIT PANEL (RIGHT) --- */}
            <div className="w-full md:w-[45%] p-10 md:p-14 flex flex-col justify-between bg-gradient-to-br from-white/5 to-transparent">
              <div className="space-y-12">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none">
                      Edit <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">Caption</span>
                    </h2>
                    <p className="text-[10px] font-black uppercase text-white/30 tracking-[0.3em]">Revision Mode Alpha</p>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.1, rotate: 90, backgroundColor: "rgba(255,255,255,0.1)" }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose} 
                    className="p-4 bg-white/5 rounded-2xl border border-white/10 transition-all text-white/40 hover:text-white"
                  >
                    <X size={24} />
                  </motion.button>
                </div>

                <div className="space-y-6">
                   <div className="flex items-center gap-3 text-purple-400/60">
                      <Type size={18} />
                      <label className="text-xs font-black uppercase tracking-[0.2em]">Primary Description</label>
                   </div>
                   <div className="relative group">
                     <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-[2rem] blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                     <textarea
                       value={caption}
                       onChange={(e) => setCaption(e.target.value)}
                       placeholder="Enter new caption..."
                       rows={8}
                       className="relative w-full bg-black/40 border border-white/10 rounded-[2rem] p-8 text-base text-white/90 placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 transition-all resize-none leading-relaxed italic"
                     />
                   </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 pt-12">
                <motion.button 
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(168,85,247,1)", color: "#fff" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full py-6 bg-purple-600 text-white font-black uppercase tracking-[0.3em] text-xs rounded-3xl transition-all flex items-center justify-center gap-3 shadow-[0_20px_40px_-15px_rgba(168,85,247,0.4)] disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={20} className="animate-spin" /> : (
                    <>
                      <CheckCircle2 size={20} />
                      Commit Changes
                    </>
                  )}
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="w-full py-6 bg-transparent text-white/40 hover:text-white/70 font-black uppercase tracking-[0.3em] text-[10px] rounded-3xl border border-white/10 transition-all"
                >
                  Discard Edits
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
