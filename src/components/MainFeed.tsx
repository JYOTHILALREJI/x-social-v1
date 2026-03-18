import React from 'react';
import { cookies } from 'next/headers';
import { prisma } from "@/app/lib/prisma";
import StoriesBar from './StoriesBar';
import SuggestedCreators from './SuggestedCreators';
import PostCard from './PostCard'; 
import Link from 'next/link';
import { Users } from 'lucide-react';

const MainFeed = async () => {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  // SAFETY CHECK: Prevent Prisma crash if user is not logged in
  if (!userId) {
    return (
      <div className="h-[calc(100vh-80px)] w-full flex flex-col items-center justify-center bg-black text-zinc-500">
        <div className="max-w-md text-center">
          <Users size={64} className="mb-6 text-purple-500 opacity-50 mx-auto" />
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic text-white mb-4 leading-none">
            Your Feed is <span className="text-purple-500">Empty</span>
          </h2>
          <p className="text-xs md:text-sm uppercase tracking-[0.2em] font-bold text-zinc-600 leading-relaxed px-6 mb-10">
            Please follow the amazing creators to start liking and commenting.
          </p>
          <Link href="/search">
            <button className="px-10 py-5 bg-zinc-900 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">
              Explore Creators
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // 1. Fetch Followed Data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      // Using 'follows' as per your schema relation name
      follows: { 
        include: { 
          following: { 
            select: { id: true, username: true, image: true } 
          } 
        } 
      }
    }
  });

  const followingIds = user?.follows.map(f => f.followingId) || [];
  const followedCreators = user?.follows.map(f => f.following) || [];

  // 2. Fetch Posts
  const posts = followingIds.length > 0 ? await prisma.post.findMany({
    where: { authorId: { in: followingIds } },
    include: { author: { select: { username: true, image: true } } },
    orderBy: { createdAt: 'desc' }
  }) : [];

  // 3. Fetch Suggested (Creators user IS NOT following)
  const suggested = await prisma.user.findMany({
    where: { 
      id: { notIn: [...followingIds, userId] },
      role: "CREATOR"
    },
    take: 4
  });

  // Handle empty feed for logged-in users with no follows
  if (posts.length === 0) {
    return (
      <div className="h-[calc(100vh-80px)] w-full flex flex-col items-center justify-center bg-black text-zinc-500">
        <div className="max-w-md text-center">
          <Users size={64} className="mb-6 text-purple-500 opacity-50 mx-auto" />
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic text-white mb-4 leading-none">
            Your Feed is <span className="text-purple-500">Empty</span>
          </h2>
          <p className="text-xs md:text-sm uppercase tracking-[0.2em] font-bold text-zinc-600 leading-relaxed px-6 mb-10">
            Please follow the amazing creators to start liking and commenting.
          </p>
          <Link href="/search">
            <button className="px-10 py-5 bg-zinc-900 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">
              Explore Creators
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto no-scrollbar bg-black">
      <div className="w-full max-w-7xl mx-auto pt-12 pb-24 px-4 md:px-10">
        
        {/* STORIES SECTION */}
        <StoriesBar followedCreators={followedCreators} />

        <header className="mb-16 text-left">
          <h2 className="text-5xl font-black italic tracking-tighter text-white uppercase">
            For <span className="text-zinc-500">You</span>
          </h2>
          <div className="h-1 w-20 bg-purple-600 mt-4 rounded-full" />
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12">
          {posts.map((post, index) => (
            <React.Fragment key={post.id}>
              <PostCard post={post} />
              
              {/* INJECT SUGGESTED SECTION after 2 posts */}
              {index === 1 && suggested.length > 0 && (
                <SuggestedCreators 
                  suggested={suggested} 
                  currentUserId={userId} 
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MainFeed;