"use client";

import React, { useEffect, useRef, useState } from 'react';
import { 
  Loader2, Music, MessageCircle, 
  Lock, Play, ArrowBigUp, Volume2, VolumeX,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import ReelComments from './ReelComments';
import { toggleReelLike, toggleReelUpvote, getReelStats } from '@/app/actions/reel-actions';
import { purchaseContent } from '@/app/actions/user-actions';
import PurchaseConfirmationModal from './PurchaseConfirmationModal';
import { useRouter } from 'next/navigation';
import { Crown } from 'lucide-react';

interface ReelData {
  id: string;
  url: string;
  isUnlocked?: boolean;
  isPremium?: boolean;
  price?: number | null;
  authorName?: string | null;
  authorUsername: string;
  authorImage?: string | null;
  likesCount?: number;
  commentsCount?: number;
  upvotesCount?: number;
  isLiked?: boolean;
  isUpvoted?: boolean;
}

interface ReelsViewProps {
  initialData: ReelData[];
  currentUserId: string;
  currentUserBalance: number;
}

const KissIcon = ({ className, filled }: { className?: string, filled?: boolean }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill={filled ? "currentColor" : "none"} 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 21.5c-3.5 0-6.5-2.5-8-6.502.5-1.5 2-2.5 4-2.5 1.5 0 3 1 4 2.5 1-1.5 2.5-2.5 4-2.5 2 0 3.5 1 4 2.5-1.5 4-4.5 6.502-8 6.502z"/>
    <path d="M12 12.5c-2.5 0-4.5-1-6-2.502.5-1.5 2-2.5 4-2.5 1 0 2 .5 2 1.5 0-1 1-1.5 2-1.5 2 0 3.5 1 4 2.5-1.5 1.502-3.5 2.502-6 2.502z"/>
  </svg>
);

const ReelsView = ({ initialData, currentUserId, currentUserBalance }: ReelsViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  
  const [reels, setReels] = useState<ReelData[]>(initialData);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showCommentId, setShowCommentId] = useState<string | null>(null);

  // Premium / Purchase State
  const [unlockedReelIds, setUnlockedReelIds] = useState<Set<string>>(new Set());
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedReel, setSelectedReel] = useState<ReelData | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const router = useRouter();

  // Sync Video Playback
  useEffect(() => {
    const activeReelId = reels[currentIndex]?.id;
    Object.keys(videoRefs.current).forEach(id => {
      const video = videoRefs.current[id];
      if (video) {
        if (id === activeReelId && isPlaying) {
          video.play().catch(e => {
            console.log("Autoplay blocked", e);
            setIsPlaying(false);
          });
        } else {
          video.pause();
        }
      }
    });
  }, [currentIndex, isPlaying, reels]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const index = Math.round(containerRef.current.scrollTop / containerRef.current.clientHeight);
    if (index !== currentIndex) {
      setCurrentIndex(index);
      setIsPlaying(true);
      if (reels[index] && typeof reels[index].likesCount === 'undefined') {
        fetchReelStats(reels[index].id, index);
      }
    }
  };

  const fetchReelStats = async (reelId: string, index: number) => {
    const res = await getReelStats(reelId, currentUserId);
    if (res.success && res.stats) {
      setReels(prev => {
        const next = [...prev];
        next[index] = { ...next[index], ...res.stats };
        return next;
      });
    }
  };

  useEffect(() => {
     if (reels[0]) fetchReelStats(reels[0].id, 0);
  }, []);

  const toggleLike = async (reelId: string, index: number) => {
    const res = await toggleReelLike(currentUserId, reelId);
    if (res.success) {
      setReels(prev => {
        const next = [...prev];
        const item = next[index];
        next[index] = { 
          ...item, 
          isLiked: res.isLiked, 
          likesCount: (item.likesCount || 0) + (res.isLiked ? 1 : -1) 
        };
        return next;
      });
    }
  };

  const toggleUpvote = async (reelId: string, index: number) => {
    const res = await toggleReelUpvote(currentUserId, reelId);
    if (res.success) {
      setReels(prev => {
        const next = [...prev];
        const item = next[index];
        next[index] = { 
          ...item, 
          isUpvoted: res.isUpvoted, 
          upvotesCount: (item.upvotesCount || 0) + (res.isUpvoted ? 1 : -1) 
        };
        return next;
      });
    }
  };

  const handleUnlock = async () => {
    if (!selectedReel || !selectedReel.price) return;
    
    setUnlocking(true);
    const res = await purchaseContent(currentUserId, selectedReel.id, 'reel', selectedReel.price);
    if (res.success) {
      setUnlockedReelIds(prev => new Set(prev).add(selectedReel.id));
      setIsConfirmModalOpen(false);
      setIsPlaying(true); // Start playing immediately
      router.refresh(); 
    } else {
      alert(res.error || "Failed to unlock");
    }
    setUnlocking(false);
  };

  return (
    // On mobile: subtract the fixed bottom navbar (~56px). On md+ navbar is a left sidebar so use full dvh.
    <div className="h-[calc(100dvh-56px)] md:h-[100dvh] w-full bg-black flex overflow-hidden flex-col relative">

      {/* Short Form Header — offset past sidebar on lg screens */}
      <div className="absolute top-6 left-4 lg:left-72 z-30 flex flex-col items-start group pointer-events-none">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black italic tracking-tighter text-white uppercase leading-none drop-shadow-lg">
          Short <span className="text-white/40">Form</span>
        </h2>
        <div className="h-0.5 lg:h-1 w-16 lg:w-24 bg-purple-600 mt-2 lg:mt-4 rounded-full" />
      </div>

      {/* Scroll Container */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
      >
        {reels.map((reel, i) => (
          <div 
            key={reel.id} 
            // Each reel snap item matches the container height
            className="h-[calc(100dvh-56px)] md:h-[100dvh] w-full flex-shrink-0 snap-start flex lg:items-center lg:justify-center"
          >
            {/* REEL CONTAINER */}
            <div className="h-full w-full lg:h-[90vh] lg:max-w-7xl lg:flex lg:gap-8 lg:p-12">
              
              {/* ===== MOBILE LAYOUT ===== */}
              {/* Restructured as a flex-col so video doesn't cover the info bar */}
              <div className="lg:hidden flex flex-col h-full w-full relative">
                
                {/* Video — takes remaining space but leaves room for info bar */}
                <div 
                  className="relative flex-1 min-h-0 bg-zinc-950 overflow-hidden cursor-pointer"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {reel.isUnlocked || unlockedReelIds.has(reel.id) ? (
                    <video 
                      ref={el => { videoRefs.current[reel.id] = el }}
                      src={`/api/media/reel/${reel.id}`} 
                      onContextMenu={(e) => e.preventDefault()}
                      className="h-full w-full object-cover select-none"
                      loop 
                      muted={isMuted}
                      playsInline
                    />
                  ) : (
                    <div className="relative h-full w-full">
                      <Image 
                        src="/locked-content.png" 
                        alt="Locked" 
                        fill
                        className="object-cover blur-[40px] brightness-50 opacity-60" 
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-[0_0_32px_rgba(168,85,247,0.5)]"
                          style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                          <Lock size={26} className="text-white" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-300 mb-3">Premium Reel</p>
                        
                        {/* Price Badge */}
                        <div className="flex items-center gap-1 px-4 py-1.5 rounded-full mb-6 border border-purple-500/40 bg-purple-500/10">
                          <span className="text-[11px] font-black text-purple-300">$</span>
                          <span className="text-lg font-black text-white">
                            {((reel.price || 0) / 100).toFixed(2)}
                          </span>
                        </div>

                        {/* Unlock Button */}
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setSelectedReel(reel);
                            setIsConfirmModalOpen(true);
                          }}
                          className="px-8 py-3 bg-purple-600 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl shadow-purple-600/30 active:scale-95 transition-all"
                        >
                          🔓 Unlock Now
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Gradient overlays */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/20 pointer-events-none z-[5]" />

                  {/* Play/Pause indicator */}
                  <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                    <AnimatePresence>
                      {!isPlaying && (
                        <motion.div 
                          initial={{ scale: 0.5, opacity: 0 }} 
                          animate={{ scale: 1, opacity: 1 }} 
                          exit={{ scale: 1.5, opacity: 0 }} 
                          className="p-8 bg-black/20 backdrop-blur-3xl rounded-full text-white border border-white/10"
                        >
                          <Play size={48} fill="currentColor" className="ml-1" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Mute button — top right inside video */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                    className="absolute top-16 right-4 z-30 p-2.5 bg-black/40 backdrop-blur-md rounded-xl text-white border border-white/10"
                  >
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>

                  {/* Action buttons — right side, vertically centered */}
                  <div className="absolute right-3 bottom-4 z-20 flex flex-col gap-5 items-center text-white">
                    <div className="flex flex-col items-center gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleLike(reel.id, i); }} 
                        className={`p-3 rounded-full backdrop-blur-md transition-all active:scale-125 ${reel.isLiked ? 'bg-red-500 text-white' : 'bg-black/40 border border-white/10'}`}
                      >
                        <KissIcon className="w-5 h-5" filled={reel.isLiked} />
                      </button>
                      <span className="text-[9px] font-black uppercase tracking-widest">{reel.likesCount || 0}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setShowCommentId(reel.id); }} 
                        className="p-3 bg-black/40 border border-white/10 rounded-full backdrop-blur-md"
                      >
                        <MessageCircle size={20} />
                      </button>
                      <span className="text-[9px] font-black uppercase tracking-widest">{reel.commentsCount || 0}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleUpvote(reel.id, i); }} 
                        className={`p-3 rounded-full backdrop-blur-md transition-all active:scale-125 ${reel.isUpvoted ? 'bg-orange-500 text-white' : 'bg-black/40 border border-white/10'}`}
                      >
                        <ArrowBigUp size={20} />
                      </button>
                      <span className="text-[9px] font-black uppercase tracking-widest">{reel.upvotesCount || 0}</span>
                    </div>
                    <button 
                      onClick={(e) => e.stopPropagation()}
                      className="p-3 bg-black/40 border border-white/10 rounded-full backdrop-blur-md"
                    >
                      <Share2 size={20} />
                    </button>
                  </div>
                </div>

                {/* Author Info Bar — always visible below video, above navbar */}
                <div 
                  className="flex-shrink-0 bg-black/90 backdrop-blur-xl px-4 py-3 flex items-center gap-3 border-t border-white/5"
                >
                  <div className="w-10 h-10 rounded-full border-2 border-purple-500/40 overflow-hidden relative shadow-lg flex-shrink-0">
                    <Image src={reel.authorImage || "/default_user_profile/default-avatar.png"} alt={reel.authorUsername} fill className="object-cover" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-white text-sm font-black italic tracking-tighter leading-none uppercase truncate">
                      {reel.authorName || reel.authorUsername}
                    </span>
                    <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest lowercase truncate">
                      @{reel.authorUsername}
                    </span>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 text-white/30 flex-shrink-0">
                    <Music size={11} className="animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] max-w-[80px] truncate">
                      Original
                    </span>
                  </div>
                </div>
              </div>

              {/* ===== DESKTOP LAYOUT ===== */}
              {/* VIDEO SCREEN */}
              <div 
                className="hidden lg:block relative h-full w-[450px] flex-shrink-0 bg-zinc-950 rounded-[3rem] overflow-hidden group shadow-2xl shadow-purple-500/10 cursor-pointer"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {reel.isUnlocked || unlockedReelIds.has(reel.id) ? (
                  <video 
                    ref={el => { videoRefs.current[reel.id] = el }}
                    src={`/api/media/reel/${reel.id}`} 
                    onContextMenu={(e) => e.preventDefault()}
                    className="h-full w-full object-cover select-none"
                    loop 
                    muted={isMuted}
                    playsInline
                  />
                ) : (
                  <div className="relative h-full w-full">
                    <Image 
                      src="/locked-content.png" 
                      alt="Locked" 
                      fill
                      className="object-cover blur-[60px] brightness-50 opacity-60" 
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md">
                      <div className="w-24 h-24 rounded-full flex items-center justify-center mb-5 shadow-[0_0_60px_rgba(168,85,247,0.6)]"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                        <Lock size={36} className="text-white" />
                      </div>
                      <p className="text-sm font-black uppercase tracking-[0.3em] text-purple-300 mb-4">Exclusive Content</p>
                      
                      {/* Price Badge */}
                      <div className="flex items-center gap-2 px-6 py-2 rounded-full mb-8 border border-purple-500/40 bg-purple-500/10">
                        <span className="text-[14px] font-black text-purple-300">$</span>
                        <span className="text-2xl font-black text-white">
                          {((reel.price || 0) / 100).toFixed(2)}
                        </span>
                      </div>

                      {/* Unlock Button */}
                      <button
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setSelectedReel(reel);
                          setIsConfirmModalOpen(true);
                        }}
                        className="px-12 py-4 bg-purple-600 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-2xl shadow-purple-600/40 hover:scale-105 active:scale-95 transition-all"
                      >
                        🔓 Unlock Reel
                      </button>
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                  <AnimatePresence>
                    {!isPlaying && (
                      <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }} 
                        exit={{ scale: 1.5, opacity: 0 }} 
                        className="p-10 bg-black/20 backdrop-blur-3xl rounded-full text-white border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)]"
                      >
                        <Play size={64} fill="currentColor" className="ml-2" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none z-[5]" />
              </div>

              {/* --- DESKTOP SIDEBAR (Visible on LG) --- */}
              <div className="hidden lg:flex flex-col flex-grow bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-[3rem] overflow-hidden">
                <div className="p-10 flex flex-col h-full bg-gradient-to-br from-white/5 via-transparent to-purple-500/5">
                   
                   {/* Stats / Interactions */}
                   <div className="grid grid-cols-3 gap-6 mb-12">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleLike(reel.id, i)}
                        className={`flex flex-col items-center gap-3 p-8 rounded-[2.5rem] border transition-all ${reel.isLiked ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10'}`}
                      >
                         <KissIcon className="w-10 h-10" filled={reel.isLiked} />
                         <span className="text-lg font-black uppercase italic tracking-tighter">{reel.likesCount || 0}</span>
                         <span className="text-[8px] font-black uppercase tracking-widest">Kisses</span>
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleUpvote(reel.id, i)}
                        className={`flex flex-col items-center gap-3 p-8 rounded-[2.5rem] border transition-all ${reel.isUpvoted ? 'bg-orange-500/10 border-orange-500/30 text-orange-500' : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10'}`}
                      >
                         <ArrowBigUp size={40} />
                         <span className="text-lg font-black uppercase italic tracking-tighter">{reel.upvotesCount || 0}</span>
                         <span className="text-[8px] font-black uppercase tracking-widest">Upvotes</span>
                      </motion.button>
                      <motion.button 
                         whileHover={{ scale: 1.05 }}
                         whileTap={{ scale: 0.95 }}
                         onClick={() => setShowCommentId(reel.id)}
                         className="flex flex-col items-center gap-3 p-8 bg-white/5 border border-white/5 rounded-[2.5rem] text-white/50 hover:bg-white/10 transition-all group"
                      >
                         <MessageCircle size={40} className="group-hover:text-purple-500 transition-colors" />
                         <span className="text-lg font-black uppercase italic tracking-tighter">{reel.commentsCount || 0}</span>
                         <span className="text-[8px] font-black uppercase tracking-widest">Speak</span>
                      </motion.button>
                   </div>

                   {/* Desktop Comments Section (Inline Carousel) */}
                   <div className="flex-1 rounded-[2.5rem] border border-white/5 bg-black/20 overflow-hidden shadow-inner">
                      <ReelComments 
                        reelId={reel.id} 
                        currentUserId={currentUserId} 
                        isOpen={true} 
                        onClose={() => {}} 
                        isMobile={false}
                        isCarousel={true}
                      />
                   </div>

                   {/* Creator Details */}
                   <div className="mt-10 flex flex-col items-end gap-6">
                      <div className="flex gap-4 items-center">
                         <div className="flex flex-col items-end text-right">
                           <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase leading-none mb-1">{reel.authorName || reel.authorUsername}</h2>
                           <span className="text-purple-500 text-[8px] font-black uppercase tracking-widest italic opacity-60">@{reel.authorUsername}</span>
                         </div>
                         <div className="w-14 h-14 rounded-2xl border border-purple-500/30 overflow-hidden relative shadow-2xl">
                           <Image src={reel.authorImage || "/default_user_profile/default-avatar.png"} alt={reel.authorUsername} fill className="object-cover" />
                        </div>
                      </div>

                      <div className="w-full flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3 text-white/30">
                           <Music size={12} className="animate-pulse" />
                           <span className="text-[9px] font-black uppercase tracking-[0.2em]">Original - {reel.authorName || 'Creator'}</span>
                        </div>
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setIsMuted(!isMuted)}
                          className="p-3 bg-purple-600/10 text-purple-500 rounded-xl border border-purple-500/20 hover:bg-purple-600 hover:text-white transition-all active:scale-95 shadow-xl shadow-purple-500/5"
                        >
                           {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </motion.button>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="h-[calc(100dvh-56px)] md:h-[100dvh] w-full flex items-center justify-center snap-start bg-black">
            <Loader2 size={40} className="text-purple-600 animate-spin" />
          </div>
        )}
      </div>

      {/* Mobile Comments Drawer */}
      <ReelComments 
        reelId={showCommentId || ""} 
        currentUserId={currentUserId} 
        isOpen={!!showCommentId} 
        onClose={() => setShowCommentId(null)} 
        isMobile={true} 
      />

      {selectedReel && selectedReel.price != null && (
        <PurchaseConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleUnlock}
          itemName={`Premium Reel by @${selectedReel.authorUsername}`}
          itemPrice={selectedReel.price}
          currentBalance={currentUserBalance}
          loading={unlocking}
        />
      )}
    </div>
  );
};

export default ReelsView;