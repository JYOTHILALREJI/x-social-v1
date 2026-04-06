"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Volume2, VolumeX, Trash2, Loader2 } from "lucide-react";
import Image from "next/image";
import { markMediaViewed, deleteStoryMedia } from "@/app/actions/story-actions";

export interface StoryMediaItem {
  id: string;
  type: "image" | "video";
  duration: number;
  order: number;
  views: { id: string }[];
}

export interface StoryData {
  id: string;
  author: {
    id: string;
    username: string;
    name: string | null;
    image: string | null;
  };
  media: StoryMediaItem[];
  isViewed: boolean;
  expiresAt?: Date | string;
}

interface StoryViewerProps {
  stories: StoryData[];
  initialStoryIndex: number;
  currentUserId: string;
  onClose: () => void;
}

export default function StoryViewer({ stories: initialStories, initialStoryIndex, currentUserId, onClose }: StoryViewerProps) {
  // 1. Maintain local state for stories so deleted items disappear instantly
  const [localStories, setLocalStories] = useState<StoryData[]>(initialStories);
  const [storyIndex, setStoryIndex] = useState(initialStoryIndex);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(true); // Default to muted for social standards
  const [isPaused, setIsPaused] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef(0);

  const currentStory = localStories[storyIndex];
  const currentMedia = currentStory?.media[mediaIndex];
  const isVideo = currentMedia?.type === "video";
  const durationLimit = currentMedia?.duration ?? (isVideo ? 30 : 10);
  const durationMs = durationLimit * 1000;
  const isAuthor = currentStory?.author.id === currentUserId;

  // Mark specific media as viewed
  useEffect(() => {
    if (currentMedia) {
      markMediaViewed(currentUserId, currentMedia.id);
    }
  }, [currentMedia?.id, currentUserId]);

  const goToNext = useCallback(() => {
    if (!currentStory) return;
    if (mediaIndex < currentStory.media.length - 1) {
      // next media in same story
      setMediaIndex(prev => prev + 1);
      setProgress(0);
    } else if (storyIndex < localStories.length - 1) {
      // next story
      setStoryIndex(prev => prev + 1);
      setMediaIndex(0);
      setProgress(0);
    } else {
      // end of all stories
      onClose();
    }
  }, [currentStory, mediaIndex, storyIndex, localStories.length, onClose]);

  const goToPrev = useCallback(() => {
    if (mediaIndex > 0) {
      setMediaIndex(prev => prev - 1);
      setProgress(0);
    } else if (storyIndex > 0) {
      const prevIdx = storyIndex - 1;
      setStoryIndex(prevIdx);
      // go to last media of previous story
      setMediaIndex((localStories[prevIdx]?.media.length ?? 1) - 1);
      setProgress(0);
    }
  }, [mediaIndex, storyIndex, localStories]);

  const handleDelete = async () => {
    if (!currentMedia || isDeleting || !isAuthor) return;
    setIsDeleting(true);
    const res = await deleteStoryMedia(currentUserId, currentMedia.id);
    if (res.success) {
      // Remove item locally for instant feedback
      const updatedStories = localStories.map((s, sIdx) => {
        if (sIdx !== storyIndex) return s;
        return {
          ...s,
          media: s.media.filter((m, mIdx) => mIdx !== mediaIndex)
        };
      }).filter(s => s.media.length > 0);

      if (updatedStories.length === 0) {
        onClose();
        return;
      }

      setLocalStories(updatedStories);
      
      // Stay on same indices if possible, or move
      if (storyIndex >= updatedStories.length) {
        setStoryIndex(updatedStories.length - 1);
        setMediaIndex(0);
      } else if (mediaIndex >= updatedStories[storyIndex].media.length) {
        setMediaIndex(Math.max(0, updatedStories[storyIndex].media.length - 1));
      }
      setProgress(0);
    } else {
      alert(res.error || "Failed to delete item");
    }
    setIsDeleting(false);
  };

  // Progress timer for images
  useEffect(() => {
    if (isPaused || isDeleting || isVideo) return;

    progressRef.current = 0;
    setProgress(0);
    const interval = 50; 
    const tick = durationMs / interval;

    timerRef.current = setInterval(() => {
      progressRef.current += 1;
      const pct = (progressRef.current / tick) * 100;
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(timerRef.current!);
        goToNext();
      }
    }, interval);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [mediaIndex, storyIndex, isPaused, isVideo, durationMs, goToNext, isDeleting]);

  // Sync mute state via ref for better browser reliability
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Video time tracking and limit enforcement
  const handleVideoTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || isDeleting || isPaused) return;
    
    // Enforce the 30s (or custom) duration limit
    const currentLimit = durationLimit;
    const actualDuration = video.duration || currentLimit;
    const effLimit = Math.min(actualDuration, currentLimit);
    
    const pct = (video.currentTime / effLimit) * 100;
    setProgress(pct >= 100 ? 100 : pct);

    if (video.currentTime >= effLimit) {
      goToNext();
    }
  };

  const handleVideoEnded = () => {
    goToNext();
  };

  // Play/pause video
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPaused || isDeleting) videoRef.current.pause();
    else videoRef.current.play().catch(() => {});
  }, [isPaused, isDeleting]);

  // Reset & play video when media changes
  useEffect(() => {
    if (!videoRef.current || !isVideo) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play().catch(() => {});
  }, [mediaIndex, storyIndex, isVideo]);

  if (!currentStory || !currentMedia) return null;

  const mediaSrc = `/api/media/story/${currentMedia.id}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-black flex items-center justify-center"
    >
      <div className="relative w-full h-full max-w-md mx-auto select-none" onPointerDown={() => setIsPaused(true)} onPointerUp={() => setIsPaused(false)}>

        {/* Media */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMedia.id}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0"
          >
            {isVideo ? (
              <video
                ref={videoRef}
                src={mediaSrc}
                className="w-full h-full object-cover"
                muted={isMuted}
                playsInline
                onTimeUpdate={handleVideoTimeUpdate}
                onEnded={handleVideoEnded}
                autoPlay
              />
            ) : (
              <img
                src={mediaSrc}
                alt="Story"
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/30 pointer-events-none" />
          </motion.div>
        </AnimatePresence>

        {/* Progress Bars */}
        <div className="absolute top-0 left-0 right-0 p-3 flex gap-1 z-[40]">
          {currentStory.media.map((m, idx) => (
            <div key={m.id} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-white"
                style={{
                  width: idx < mediaIndex
                    ? "100%"
                    : idx === mediaIndex
                    ? `${progress}%`
                    : "0%",
                }}
                transition={{ ease: "linear" }}
              />
            </div>
          ))}
        </div>

        {/* Author Header */}
        <div className="absolute top-6 left-0 right-0 px-4 flex items-center gap-3 z-[40]">
          <div className="w-9 h-9 rounded-full border-2 border-purple-500 overflow-hidden relative shrink-0">
            <Image
              src={currentStory.author.image || "/default_user_profile/default-avatar.png"}
              alt={currentStory.author.username}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-white text-sm font-black italic tracking-tighter uppercase leading-none">
              {currentStory.author.name || currentStory.author.username}
            </span>
            <span className="text-white/50 text-[9px] font-bold uppercase tracking-widest">
              @{currentStory.author.username}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onPointerDown={e => { e.stopPropagation(); }}
              onClick={(e) => { e.stopPropagation(); setIsMuted(m => !m); }}
              className="p-2 bg-black/30 backdrop-blur-sm rounded-full text-white"
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            {isAuthor && (
              <button
                disabled={isDeleting}
                onPointerDown={e => { e.stopPropagation(); }}
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                className="p-2 bg-black/30 backdrop-blur-sm rounded-full text-red-500 hover:bg-red-500/10 transition-all"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            )}
            <button
              onPointerDown={e => { e.stopPropagation(); }}
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="p-2 bg-black/30 backdrop-blur-sm rounded-full text-white"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Story counter */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center z-10">
          {localStories.length > 1 && (
            <div className="flex gap-1">
              {localStories.map((_, idx) => (
                <div
                  key={idx}
                  className={`rounded-full transition-all duration-300 ${
                    idx === storyIndex ? "w-4 h-1 bg-white" : "w-1 h-1 bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Left/Right click zones */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1/3 z-20 cursor-pointer flex items-center pl-2"
          onPointerDown={e => { e.stopPropagation(); }}
          onClick={goToPrev}
        >
          {(mediaIndex > 0 || storyIndex > 0) && (
            <div className="p-2 bg-black/20 backdrop-blur-sm rounded-full text-white/60">
              <ChevronLeft size={18} />
            </div>
          )}
        </div>

        <div
          className="absolute right-0 top-0 bottom-0 w-1/4 z-20 cursor-pointer flex items-center justify-end pr-2"
          onPointerDown={e => { e.stopPropagation(); }}
          onClick={goToNext}
        >
          <div className="p-2 bg-black/20 backdrop-blur-sm rounded-full text-white/60">
            <ChevronRight size={18} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
