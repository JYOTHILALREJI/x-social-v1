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
  const sessionToken = cookieStore.get("auth_session")?.value;
  
  let userId: string | undefined;
  if (sessionToken) {
    const sessionTokenRecord = await prisma.session.findUnique({
        where: { sessionToken },
        select: { user: { select: { id: true } } }
    });
    userId = sessionTokenRecord?.user?.id;
  }

  // SAFETY CHECK: Prevent Prisma crash if user is not logged in or session invalid
  if (!userId) {
    return (
      <div className="h-[calc(100vh-80px)] w-full flex flex-col items-center justify-center bg-black text-zinc-500">
        <div className="max-w-md text-center px-6">
          <Users size={64} className="mb-6 text-purple-500 opacity-50 mx-auto" />
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic text-white mb-4 leading-none text-center">
            Your Feed is <span className="text-purple-500">Waitng</span>
          </h2>
          <p className="text-xs md:text-sm uppercase tracking-[0.2em] font-bold text-zinc-600 leading-relaxed mb-10 text-center">
            Please sign in to see your personalized feed and community updates.
          </p>
          <Link href="/auth">
            <button className="px-10 py-5 bg-white text-black border border-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all shadow-xl shadow-white/5 active:scale-95">
              Explore Now
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // 1. Fetch Followed Data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      walletBalance: true,
      isGhost: true,
      follows: { 
        where: {
          following: { isGhost: false }
        },
        select: {
          followingId: true,
          subscriptionTier: true,
          following: { 
            select: { id: true, username: true, name: true, image: true } 
          }
        }
      }
    }
  });

  const followingIds = user?.follows.map(f => f.followingId) || [];
  const followedCreators = user?.follows.map(f => f.following) || [];
  const subscriptions = user?.follows.filter(f => (f.subscriptionTier || 0) > 0).map(f => f.followingId) || [];

  // 2. Fetch Posts or Random Fallback
  let posts: any[] = [];
  
  if (followingIds.length > 0) {
    posts = await prisma.post.findMany({
      where: { 
          authorId: { in: followingIds },
          author: { isGhost: false },
          isPrivate: false
      },
      select: { 
        id: true, 
        caption: true, 
        createdAt: true, 
        isPremium: true, 
        price: true, 
        authorId: true,
        author: { select: { username: true, name: true, image: true } },
        purchases: { where: { userId } },
        likes: { where: { userId } },
        _count: { select: { likes: true } },
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { 
            user: { select: { username: true, name: true, image: true } } 
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
  } else {
    // 50% FREE, 50% PREMIUM MIX
    const [freePosts, premiumPosts] = await Promise.all([
      prisma.post.findMany({
        where: { isPremium: false, author: { isGhost: false }, isPrivate: false },
        take: 10,
        select: { 
            id: true, caption: true, createdAt: true, isPremium: true, price: true, authorId: true,
            author: { select: { username: true, name: true, image: true } },
            purchases: { where: { userId } },
            likes: { where: { userId } },
            _count: { select: { likes: true } },
            comments: {
              orderBy: { createdAt: 'desc' },
              take: 10,
              include: { user: { select: { username: true, name: true, image: true } } }
            }
        }
      }),
      prisma.post.findMany({
        where: { isPremium: true, author: { isGhost: false }, isPrivate: false },
        take: 10,
        select: { 
            id: true, caption: true, createdAt: true, isPremium: true, price: true, authorId: true,
            author: { select: { username: true, name: true, image: true } },
            purchases: { where: { userId } },
            likes: { where: { userId } },
            _count: { select: { likes: true } },
            comments: {
              orderBy: { createdAt: 'desc' },
              take: 10,
              include: { user: { select: { username: true, name: true, image: true } } }
            }
        }
      })
    ]);

    posts = [...freePosts, ...premiumPosts];
    // Fisher-Yates Shuffle
    for (let i = posts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [posts[i], posts[j]] = [posts[j], posts[i]];
    }
  }

  // 3. Fetch Suggested (Creators user IS NOT following)
  const suggested = await prisma.user.findMany({
    where: { 
      id: { notIn: [...followingIds, userId] },
      role: "CREATOR",
      isGhost: false
    },
    take: 4
  });


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
          {posts.map((post: any, index: number) => (
            <React.Fragment key={post.id}>
              <PostCard 
                post={post} 
                isSubscribed={subscriptions.includes(post.authorId)} 
                currentUserId={userId}
                currentUserBalance={user?.walletBalance || 0}
                isGhost={user?.isGhost || false}
              />
              
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