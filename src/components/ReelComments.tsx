"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, MessageSquare } from 'lucide-react';
import Image from 'next/image';
import { getReelComments, addReelComment } from '@/app/actions/reel-actions';

interface Comment {
  id: string;
  text: string;
  userId: string;
  createdAt: string | Date;
  user: {
    username: string;
    name: string | null;
    image: string | null;
  };
}

interface ReelCommentsProps {
  reelId: string;
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
  /** If true: shows 2 comments at a time rotating every 5s, hides the input */
  isCarousel?: boolean;
}

export default function ReelComments({
  reelId,
  currentUserId,
  isOpen,
  onClose,
  isMobile = false,
  isCarousel = false,
}: ReelCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const [text, setText] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Carousel state — index of the FIRST comment in the current pair
  const [carouselPairIndex, setCarouselPairIndex] = useState(0);

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Carousel rotation — advance by 2 every 5 seconds
  useEffect(() => {
    if (!isCarousel || comments.length <= 2) return;
    const timer = setInterval(() => {
      setCarouselPairIndex(prev => {
        const next = prev + 2;
        return next >= comments.length ? 0 : next;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [isCarousel, comments.length]);

  const fetchComments = async (isNew = false) => {
    if (loading) return;
    setLoading(true);
    const newSkip = isNew ? 0 : skip;
    const res = await getReelComments(reelId, newSkip, 10);
    
    if (res.success && res.comments) {
      if (isNew) {
        setComments(res.comments as any);
        setCarouselPairIndex(0);
        setSkip(10);
      } else {
        setComments(prev => [...prev, ...(res.comments as any[])]);
        setSkip(prev => prev + 10);
      }
      setHasMore(res.hasMore || false);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchComments(true);
    } else {
      setComments([]);
      setSkip(0);
      setCarouselPairIndex(0);
    }
  }, [isOpen, reelId]);

  const handleScroll = () => {
    if (!scrollRef.current || !hasMore || loading || isCarousel) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      fetchComments();
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isPosting) return;

    setIsPosting(true);
    const res = await addReelComment(currentUserId, reelId, text.trim());
    if (res.success && res.comment) {
      setComments(prev => [res.comment as any, ...prev]);
      setText("");
    } else {
      alert(res.error || "Failed to post comment");
    }
    setIsPosting(false);
  };

  // The pair currently shown in carousel mode
  const carouselPair = isCarousel ? comments.slice(carouselPairIndex, carouselPairIndex + 2) : [];

  const CarouselContent = (
    <div className="flex flex-col h-full bg-background/95 backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border-theme flex items-center justify-between bg-card-bg/20 flex-shrink-0">
        <div>
          <h3 className="text-sm font-black italic uppercase tracking-tighter text-foreground leading-none">Comments</h3>
          <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mt-0.5">Join the conversation</p>
        </div>
        <MessageSquare size={14} className="text-muted-foreground opacity-40" />
      </div>

      {/* Carousel body */}
      <div className="flex-1 relative overflow-hidden px-4 py-3">
        {comments.length === 0 && !loading ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
            <MessageSquare size={36} className="mb-3" />
            <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">
              No comments yet.<br />Be the first to speak!
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={carouselPairIndex}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="space-y-3 absolute inset-x-4"
            >
              {carouselPair.map(comment => (
                <div key={comment.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-card-bg border border-border-theme relative overflow-hidden shrink-0">
                    <Image
                      src={comment.user.image || "/default_user_profile/default-avatar.png"}
                      alt={comment.user.username}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-black uppercase italic tracking-tighter text-purple-400 leading-none block mb-1">
                      {comment.user.name || comment.user.username}
                    </span>
                    <div className="bg-card-bg/30 border border-border-theme px-3 py-2 rounded-xl rounded-tl-none">
                      <p className="text-xs text-foreground leading-relaxed italic truncate">
                        &ldquo;{comment.text}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={20} className="animate-spin text-purple-600 opacity-50" />
          </div>
        )}
      </div>

      {/* Pagination dots */}
      {comments.length > 2 && (
        <div className="flex-shrink-0 flex justify-center gap-1.5 py-2">
          {Array.from({ length: Math.ceil(comments.length / 2) }).map((_, idx) => (
            <div
              key={idx}
              className={`rounded-full transition-all duration-300 ${
                Math.floor(carouselPairIndex / 2) === idx
                  ? 'w-4 h-1 bg-purple-500'
                  : 'w-1 h-1 bg-white/20'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );

  const FullContent = (
    <div className="flex flex-col h-full bg-background/95 backdrop-blur-xl border-l border-border-theme overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border-theme flex justify-between items-center bg-card-bg/20 flex-shrink-0">
        <div>
          <h3 className="text-xl font-black italic uppercase tracking-tighter text-foreground leading-none">Comments</h3>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Join the conversation</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-card-bg rounded-xl transition-all">
          <X size={20} className="text-muted-foreground" />
        </button>
      </div>

      {/* Comment List */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar"
      >
        {comments.length === 0 && !loading ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
            <MessageSquare size={48} className="mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">No comments yet.<br/>Be the first to speak!</p>
          </div>
        ) : (
          comments.map(comment => (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              key={comment.id} 
              className="group"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-card-bg border border-border-theme relative overflow-hidden shrink-0">
                  <Image 
                    src={comment.user.image || "/default_user_profile/default-avatar.png"} 
                    alt={comment.user.username} 
                    fill 
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black uppercase italic tracking-tighter text-foreground leading-none">
                      {comment.user.name || comment.user.username}
                    </span>
                    <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-40">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="bg-card-bg/30 border border-border-theme p-4 rounded-2xl rounded-tl-none group-hover:border-purple-500/30 transition-all">
                    <p className="text-sm text-foreground leading-relaxed italic">
                      &ldquo;{comment.text}&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
        {loading && (
          <div className="py-4 flex justify-center">
             <Loader2 size={24} className="animate-spin text-purple-600 opacity-50" />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 border-t border-border-theme bg-card-bg/10 backdrop-blur-sm flex-shrink-0">
        <form onSubmit={handlePost} className="relative flex items-center gap-3">
           <input 
             type="text"
             value={text}
             onChange={(e) => setText(e.target.value)}
             placeholder="Add a comment..."
             className="w-full bg-background border border-border-theme rounded-2xl py-4 pl-6 pr-14 text-sm focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 transition-all text-foreground placeholder:text-muted-foreground uppercase font-medium italic"
           />
           <button 
             type="submit"
             disabled={!text.trim() || isPosting}
             className="absolute right-3 p-3 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-purple-600/30"
           >
             {isPosting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
           </button>
        </form>
      </div>
    </div>
  );

  // Carousel mode: render inline (no drawer, no wrapper needed)
  if (isCarousel) {
    return CarouselContent;
  }

  // Mobile / desktop drawer mode
  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={isDesktop ? { x: "100%" } : { y: "100%" }}
              animate={isDesktop ? { x: 0 } : { y: 0 }}
              exit={isDesktop ? { x: "100%" } : { y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className={`fixed z-[110] overflow-hidden bg-background shadow-2xl ${
                isDesktop 
                  ? "top-0 right-0 bottom-0 w-[500px] border-l border-border-theme" 
                  : "bottom-0 left-0 right-0 h-[70vh] rounded-t-[3rem]"
              }`}
            >
              {FullContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop non-carousel (fallback — full panel inside sidebar)
  return (
    <div className={`transition-all duration-500 w-full h-full ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible overflow-hidden'}`}>
      {FullContent}
    </div>
  );
}
