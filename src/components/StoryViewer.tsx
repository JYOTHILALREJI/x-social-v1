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

export default function StoryViewer({ stories, initialStoryIndex, currentUserId, onClose }: StoryViewerProps) {
  const [storyIndex, setStoryIndex] = useState(initialStoryIndex);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef(0);

  const currentStory = stories[storyIndex];
  const currentMedia = currentStory?.media[mediaIndex];
  const isVideo = currentMedia?.type === "video";
  const duration = (currentMedia?.duration ?? 10) * 1000; // ms
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
    } else if (storyIndex < stories.length - 1) {
      // next story
      setStoryIndex(prev => prev + 1);
      setMediaIndex(0);
      setProgress(0);
    } else {
      // end of all stories
      onClose();
    }
  }, [currentStory, mediaIndex, storyIndex, stories.length, onClose]);

  const goToPrev = useCallback(() => {
    if (mediaIndex > 0) {
      setMediaIndex(prev => prev - 1);
      setProgress(0);
    } else if (storyIndex > 0) {
      setStoryIndex(prev => prev - 1);
      // go to last media of previous story
      setMediaIndex((stories[storyIndex - 1]?.media.length ?? 1) - 1);
      setProgress(0);
    }
  }, [mediaIndex, storyIndex, stories]);

  const handleDelete = async () => {
    if (!currentMedia || isDeleting || !isAuthor) return;
    setIsDeleting(true);
    const res = await deleteStoryMedia(currentUserId, currentMedia.id);
    if (res.success) {
      // If was the last media in this story, potentially move to next story
      if (currentStory.media.length === 1) {
        if (storyIndex < stories.length - 1) {
          setStoryIndex(prev => prev + 1);
          setMediaIndex(0);
        } else {
          onClose();
        }
      } else {
        // Just refresh the media list (this UI doesn't refresh automatically unless we fetch again)
        // For simplicity, we just move to next or previous
        if (mediaIndex < currentStory.media.length - 1) {
          // move forward (but technically the current one is gone)
          goToNext();
        } else {
          goToPrev();
        }
      }
    } else {
      alert(res.error || "Failed to delete item");
    }
    setIsDeleting(false);
  };

  // Progress timer
  useEffect(() => {
    if (isPaused || isDeleting) return;
    if (isVideo) {
      progressRef.current = 0;
      setProgress(0);
      return;
    }

    progressRef.current = 0;
    setProgress(0);
    const interval = 50; 
    const tick = duration / interval;

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
  }, [mediaIndex, storyIndex, isPaused, isVideo, duration, goToNext, isDeleting]);

  // Video time tracking
  const handleVideoTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || isDeleting) return;
    const pct = (video.currentTime / video.duration) * 100;
    setProgress(pct);
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
  }, [mediaIndex, storyIndex]);

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
        <div className="absolute top-0 left-0 right-0 p-3 flex gap-1 z-10">
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
        <div className="absolute top-6 left-0 right-0 px-4 flex items-center gap-3 z-10">
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
              onPointerDown={e => e.stopPropagation()}
              onClick={() => setIsMuted(m => !m)}
              className="p-2 bg-black/30 backdrop-blur-sm rounded-full text-white"
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            {isAuthor && (
              <button
                disabled={isDeleting}
                onPointerDown={e => e.stopPropagation()}
                onClick={handleDelete}
                className="p-2 bg-black/30 backdrop-blur-sm rounded-full text-red-500 hover:bg-red-500/10 transition-all"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            )}
            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={onClose}
              className="p-2 bg-black/30 backdrop-blur-sm rounded-full text-white"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Story counter */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center z-10">
          {stories.length > 1 && (
            <div className="flex gap-1">
              {stories.map((_, idx) => (
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
