"use client";
import React from 'react';
import Image from 'next/image';
import { Heart, MessageSquare, Send, Lock, Crown, Loader2, MessageCircle } from 'lucide-react';
import { purchaseContent, togglePostLike, addPostComment } from '@/app/actions/user-actions';
import { useRouter } from 'next/navigation';
import PurchaseConfirmationModal from './PurchaseConfirmationModal';
import { motion, AnimatePresence } from 'framer-motion';

interface PostCardProps {
  post: {
    id: string;
    caption: string | null;
    imageUrl?: string | null;
    authorId: string;
    isPremium: boolean;
    isPrivate?: boolean;
    price: number | null;
    author: {
      username: string;
      name: string | null;
      image: string | null;
    };
    purchases?: any[];
    likes?: { userId: string }[];
    _count?: { likes: number };
    comments?: {
      id: string;
      text: string;
      user: { username: string; name: string | null; image: string | null };
    }[];
  };
  isSubscribed?: boolean;
  currentUserId: string;
  currentUserBalance: number;
  isGhost?: boolean;
}

const PostCard = ({ post, isSubscribed = false, currentUserId, currentUserBalance, isGhost = false }: PostCardProps) => {
  const router = useRouter();
  const [loadingMedia, setLoadingMedia] = React.useState(false);
  const [unlocking, setUnlocking] = React.useState(false);
  const [isUnlockedLocal, setIsUnlockedLocal] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = React.useState(false);

  // Like State
  const initialIsLiked = post.likes && post.likes.length > 0;
  const initialLikesCount = post._count?.likes || 0;
  const [isLiked, setIsLiked] = React.useState(initialIsLiked);
  const [likesCount, setLikesCount] = React.useState(initialLikesCount);
  const [isLiking, setIsLiking] = React.useState(false);

  // Comment State
  const [comments, setComments] = React.useState(post.comments || []);
  const [commentText, setCommentText] = React.useState("");
  const [isCommenting, setIsCommenting] = React.useState(false);
  const [showCommentInput, setShowCommentInput] = React.useState(false);
  const [activeCommentIndex, setActiveCommentIndex] = React.useState(0);

  // Comment Rotation Effect
  React.useEffect(() => {
    if (comments.length <= 1) return;
    const interval = setInterval(() => {
      setActiveCommentIndex((prev) => (prev + 1) % comments.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [comments.length]);

  const isUnlockedServer = !post.isPremium || post.authorId === currentUserId || isSubscribed || (post.purchases && post.purchases.length > 0);
  const isUnlocked = isUnlockedServer || isUnlockedLocal;

  const handleUnlock = async () => {
    if (!post.price) return;
    if (currentUserBalance < post.price) {
      alert("Insufficient wallet balance.");
      return;
    }
    
    setUnlocking(true);
    const res = await purchaseContent(currentUserId, post.id, 'post', post.price);
    if (res.success) {
      setLoadingMedia(true);
      setIsUnlockedLocal(true);
      setRefreshKey(prev => prev + 1);
      setIsConfirmModalOpen(false);
      router.refresh(); // Tells NextJS to refetch the server component props in the background
    } else {
      alert(res.error || "Failed to unlock");
    }
    setUnlocking(false);
  };

  const handleLike = async () => {
    if (isLiking || isGhost) return;
    setIsLiking(true);

    // Optimistic Update
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

    const res = await togglePostLike(currentUserId, post.id);
    if (!res.success) {
      // Revert if failed
      setIsLiked(isLiked);
      setLikesCount(prev => isLiked ? prev + 1 : prev - 1);
      console.error(res.error);
    }
    setIsLiking(false);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isCommenting || isGhost) return;

    setIsCommenting(true);
    const res = await addPostComment(currentUserId, post.id, commentText.trim());
    
    if (res.success && res.comment) {
      setComments(prev => [res.comment as any, ...prev]);
      setCommentText("");
      setShowCommentInput(false);
      setActiveCommentIndex(0);
    } else {
      alert("Failed to post comment.");
    }
    setIsCommenting(false);
  };

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

  return (
    <article className="snap-start w-full bg-zinc-900/20 backdrop-blur-md rounded-[2.5rem] border border-border-theme overflow-hidden transition-all duration-500 hover:border-border-theme text-white">
      <div className="p-8 md:p-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-zinc-800 overflow-hidden relative border border-border-theme">
            <Image 
              src={post.author.image || "/default_user_profile/default-avatar.png"} 
              alt={post.author.username} 
              fill 
              className="object-cover" 
            />
          </div>
          <div className="flex flex-col">
            <span className="font-black italic uppercase tracking-tighter text-white text-lg leading-tight">
              {post.author.name || post.author.username}
            </span>
            {post.author.name && (
              <span className="text-[10px] font-bold text-zinc-500 lowercase opacity-60">
                @{post.author.username}
              </span>
            )}
          </div>
          {post.isPrivate && (
            <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-zinc-800 border border-border-theme rounded-full">
              <Lock size={12} className="text-zinc-500" />
              <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Private</span>
            </div>
          )}
          {post.isPremium && (
            <div className={`${post.isPrivate ? '' : 'ml-auto'} flex items-center gap-2 px-3 py-1 bg-purple-600/10 border border-purple-500/20 rounded-full`}>
              <Crown size={12} className="text-purple-500" />
              <span className="text-[10px] font-black uppercase text-purple-500 tracking-widest">Premium</span>
            </div>
          )}
        </div>

        {post.id && (
          <div className="relative aspect-square w-full rounded-3xl overflow-hidden mb-8 border border-border-theme group/media">
            <Image 
              src={isUnlocked ? `/api/media/post/${post.id}?t=${refreshKey}` : "/locked-content.png"} 
              alt="Post content" 
              fill 
              onLoad={() => setLoadingMedia(false)}
              className={`object-cover transition-all duration-700 select-none pointer-events-none ${(!isUnlocked || loadingMedia) ? 'blur-sm scale-105 opacity-80' : 'group-hover/media:scale-105'}`} 
              unoptimized 
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            />
            {/* Loading Spinner for newly unlocked content */}
            {isUnlocked && loadingMedia && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20">
                <Loader2 size={40} className="animate-spin text-purple-400 drop-shadow-lg" />
              </div>
            )}
            {!isUnlocked && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-black/40 via-black/10 to-black/60 backdrop-blur-[3px]">
                {/* Lock Icon */}
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-2xl"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 0 32px rgba(168,85,247,0.5)' }}>
                  <Lock size={26} className="text-white" />
                </div>

                {/* Label */}
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-purple-300 mb-3">Premium Content</p>

                {/* Price Badge */}
                <div className="flex items-center gap-1 px-4 py-1.5 rounded-full mb-6 border border-purple-500/40"
                  style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.35), rgba(168,85,247,0.2))' }}>
                  <span className="text-[11px] font-black text-purple-300">$</span>
                  <span className="text-lg font-black text-white" style={{ textShadow: '0 0 12px rgba(168,85,247,0.8)' }}>
                    {((post.price || 0) / 100).toFixed(2)}
                  </span>
                </div>

                {/* Unlock Button */}
                <button
                  onClick={() => setIsConfirmModalOpen(true)}
                  disabled={unlocking}
                  className="relative px-8 py-3 text-[10px] font-black uppercase tracking-widest text-white rounded-full overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)',
                    boxShadow: '0 0 24px rgba(168,85,247,0.6), 0 4px 20px rgba(0,0,0,0.4)'
                  }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {unlocking ? <Loader2 size={12} className="animate-spin" /> : "🔓 Unlock Now"}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        <p className="text-zinc-300 text-base leading-relaxed mb-8 font-medium">
          {post.caption}
        </p>

        {/* ROTATING COMMENTS SECTION */}
        {comments.length > 0 && (
          <div className="mb-8 p-4 bg-zinc-950/40 rounded-2xl border border-border-theme h-16 overflow-hidden relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={comments[activeCommentIndex]?.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute inset-x-4 inset-y-0 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-zinc-800 shrink-0 relative overflow-hidden border border-border-theme">
                  <Image 
                    src={comments[activeCommentIndex]?.user.image || "/default_user_profile/default-avatar.png"} 
                    alt={comments[activeCommentIndex]?.user.username} 
                    fill 
                    className="object-cover" 
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-black uppercase text-purple-400 tracking-tight leading-none mb-1">
                    {comments[activeCommentIndex]?.user.name || `@${comments[activeCommentIndex]?.user.username}`}
                  </span>
                  <p className="text-xs text-white font-medium truncate italic">
                    "{comments[activeCommentIndex]?.text}"
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1 items-center opacity-30">
              <MessageCircle size={12} className="animate-pulse" />
            </div>
          </div>
        )}

        {/* COMMENT INPUT ACTION */}
        <AnimatePresence>
          {showCommentInput && (
            <motion.form 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleCommentSubmit}
              className="mb-8 flex gap-3 items-center overflow-hidden"
            >
              <input 
                autoFocus
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-zinc-950/80 border border-border-theme rounded-xl px-4 py-3 text-xs font-medium text-white focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all text-white placeholder:text-zinc-600"
              />
              <button 
                type="submit"
                disabled={isCommenting || !commentText.trim()}
                className="px-4 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:bg-zinc-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                {isCommenting ? <Loader2 size={14} className="animate-spin" /> : "Post"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
        
        <div className="flex items-center gap-8 text-zinc-500 border-t border-border-theme pt-8">
          <button 
            disabled={isLiking || isGhost}
            onClick={handleLike} 
            className={`flex items-center gap-2 hover:text-red-500 transition-colors group ${isGhost ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <KissIcon 
               className={`w-[22px] h-[22px] group-active:scale-125 transition-transform ${isLiked ? "text-red-500" : ""}`} 
               filled={isLiked} 
            />
            <span className="text-[10px] font-black uppercase flex items-center gap-1">Like <span className="opacity-70">({likesCount})</span></span>
          </button>
          <button 
            disabled={isGhost}
            onClick={() => setShowCommentInput(!showCommentInput)}
            className={`flex items-center gap-2 transition-colors ${showCommentInput ? "text-blue-400" : "hover:text-blue-500"} ${isGhost ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <MessageSquare size={22} />
            <span className="text-[10px] font-black uppercase">Comment</span>
          </button>
          <button className="flex items-center gap-2 hover:text-green-500 transition-colors ml-auto">
            <Send size={22} />
          </button>
        </div>
      </div>

      {post.price != null && (
        <PurchaseConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleUnlock}
          itemName={`Premium Post by @${post.author.username}`}
          itemPrice={post.price}
          currentBalance={currentUserBalance}
          loading={unlocking}
        />
      )}
    </article>
  );
};

export default PostCard;