"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import PostCard from './PostCard';
import SuggestedCreators from './SuggestedCreators';
import { Loader2 } from 'lucide-react';

interface FeedClientProps {
  initialPosts: any[];
  initialCursor: string | null;
  currentUserId: string;
  currentUserBalance: number;
  isGhost: boolean;
  subscriptions: string[];
  suggested: any[];
}

const FeedClient = ({
  initialPosts,
  initialCursor,
  currentUserId,
  currentUserBalance,
  isGhost,
  subscriptions,
  suggested
}: FeedClientProps) => {
  const [posts, setPosts] = useState(initialPosts);
  const [cursor, setCursor] = useState(initialCursor);
  const [hasMore, setHasMore] = useState(initialCursor !== null);
  const [loading, setLoading] = useState(false);
  const { emit, status } = useSocket();

  const { targetRef, isIntersecting } = useIntersectionObserver({
    rootMargin: '400px', // Start loading when 400px from bottom
  });

  const loadMore = useCallback(() => {
    if (loading || !hasMore || status !== 'connected') return;

    setLoading(true);
    emit('get_feed', { cursor, limit: 10 }, (response: any) => {
      if (response.success) {
        setPosts(prev => {
          // Prevent duplicates by checking IDs
          const existingIds = new Set(prev.map(p => p.id));
          const newPosts = response.posts.filter((p: any) => !existingIds.has(p.id));
          return [...prev, ...newPosts];
        });
        setCursor(response.nextCursor);
        setHasMore(response.nextCursor !== null && response.posts.length > 0);
      } else {
        console.error('[Feed] Failed to load more posts:', response.error);
        setHasMore(false);
      }
      setLoading(false);
    });
  }, [cursor, hasMore, loading, status, emit]);

  useEffect(() => {
    if (isIntersecting && hasMore) {
      loadMore();
    }
  }, [isIntersecting, hasMore, loadMore]);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12">
        {posts.map((post: any, index: number) => (
          <React.Fragment key={post.id}>
            <PostCard 
              post={post} 
              isSubscribed={subscriptions.includes(post.authorId)} 
              currentUserId={currentUserId}
              currentUserBalance={currentUserBalance}
              isGhost={isGhost}
            />
            
            {/* INJECT SUGGESTED SECTION only once in the first batch */}
            {index === 1 && suggested.length > 0 && (
              <div className="col-span-full">
                <SuggestedCreators 
                  suggested={suggested} 
                  currentUserId={currentUserId} 
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Infinite Scroll Sentinel */}
      {hasMore && (
        <div 
          ref={targetRef} 
          className="w-full py-20 flex items-center justify-center col-span-full"
        >
          {loading ? (
            <div className="flex flex-col items-center gap-4">
               <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
                 Loading <span className="text-purple-500">More</span>
               </p>
            </div>
          ) : (
            <div className="h-10" /> 
          )}
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <div className="w-full py-20 text-center col-span-full opacity-30">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">
            You've reached the <span className="text-purple-500">End</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default FeedClient;
