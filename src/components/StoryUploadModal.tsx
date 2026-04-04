"use client";

import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Image as ImageIcon, Film, Loader2, Trash2, Upload } from "lucide-react";
import { createStory, StoryMediaInput } from "@/app/actions/story-actions";

interface StoryUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  isUpdating?: boolean;
  onSuccess?: () => void;
}

export default function StoryUploadModal({ isOpen, onClose, currentUserId, isUpdating = false, onSuccess }: StoryUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaItems, setMediaItems] = useState<(StoryMediaInput & { preview: string })[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      if (!isVideo && !isImage) return;

      const reader = new FileReader();
      reader.onload = ev => {
        const url = ev.target?.result as string;
        setMediaItems(prev => [...prev, {
          url,
          preview: url,
          type: isVideo ? "video" : "image",
          duration: isVideo ? 30 : 10,
        }]);
      };
      reader.readAsDataURL(file);
    });
    // reset input
    if (e.target) e.target.value = "";
  };

  const removeItem = (idx: number) => {
    setMediaItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePost = async () => {
    if (!mediaItems.length) return;
    setIsPosting(true);
    setError("");
    const res = await createStory(currentUserId, mediaItems.map(m => ({
      url: m.url,
      type: m.type,
      duration: m.duration,
    })));
    setIsPosting(false);
    if (res.success) {
      setMediaItems([]);
      onSuccess?.();
      onClose();
    } else {
      setError(res.error || "Failed to create story");
    }
  };

  const handleClose = () => {
    if (isPosting) return;
    setMediaItems([]);
    setError("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200]"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[210] max-w-lg mx-auto bg-background border border-border-theme rounded-[2.5rem] overflow-hidden shadow-2xl shadow-purple-500/10"
          >
            {/* Header */}
            <div className="p-8 border-b border-border-theme flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-foreground leading-none">
                  {isUpdating ? "Add to Story" : "New Story"}
                </h2>
                <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground mt-1">
                  Images (10s) · Videos (30s max)
                </p>
              </div>
              <button onClick={handleClose} className="p-2 hover:bg-card-bg rounded-xl transition-all">
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            {/* Media Preview Strip */}
            <div className="p-6">
              {mediaItems.length > 0 && (
                <div className="flex gap-3 overflow-x-auto no-scrollbar mb-6 pb-2">
                  {mediaItems.map((m, idx) => (
                    <div key={idx} className="relative shrink-0 w-24 h-36 rounded-2xl overflow-hidden border border-border-theme group">
                      {m.type === "image" ? (
                        <img src={m.preview} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <video src={m.preview} className="w-full h-full object-cover" muted playsInline />
                      )}
                      {/* type badge */}
                      <div className="absolute bottom-1 left-1">
                        {m.type === "video"
                          ? <Film size={12} className="text-white drop-shadow" />
                          : <ImageIcon size={12} className="text-white drop-shadow" />
                        }
                      </div>
                      {/* remove button */}
                      <button
                        onClick={() => removeItem(idx)}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={11} className="text-red-400" />
                      </button>
                      {/* order indicator */}
                      <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-purple-600/80 flex items-center justify-center">
                        <span className="text-[9px] font-black text-white">{idx + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border-theme rounded-2xl py-8 flex flex-col items-center gap-3 hover:border-purple-500/50 hover:bg-card-bg/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-card-bg flex items-center justify-center group-hover:bg-purple-600/10 transition-colors">
                  <Upload size={20} className="text-muted-foreground group-hover:text-purple-500 transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    {mediaItems.length > 0 ? "Add More Media" : "Upload Images or Videos"}
                  </p>
                  <p className="text-[9px] text-muted-foreground/50 uppercase tracking-widest mt-1">
                    Tap to browse · Multiple files allowed
                  </p>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Error */}
            {error && (
              <p className="px-8 text-[10px] font-black uppercase text-red-500 tracking-widest pb-2">{error}</p>
            )}

            {/* Actions */}
            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-4 border border-border-theme rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-card-bg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handlePost}
                disabled={!mediaItems.length || isPosting}
                className="flex-1 py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30"
              >
                {isPosting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {isPosting ? "Posting..." : `Share Story (${mediaItems.length})`}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
