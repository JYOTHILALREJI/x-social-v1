import { prisma } from "@/app/lib/prisma"; 
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import PublicProfileClient from "./PublicProfileClient";

export default async function PublicProfilePage({ params }: { params: { id: string } }) {
  // Await params for next.js 15+ compatibility
  const resolvedParams = await Promise.resolve(params);
  const targetUserId = resolvedParams.id;
  
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('auth_session')?.value;

  if (!sessionToken) {
    redirect("/auth");
  }

  // 1. Find the current user
  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: {
      user: { select: { id: true, walletBalance: true, isGhost: true } }
    }
  });

  if (!session?.user) {
    redirect("/auth");
  }

  const currentUserId = session.user.id;

  // 2. If it's the current user's profile, redirect to their own profile page
  if (currentUserId === targetUserId) {
    redirect("/profile");
  }

  // 3. Fetch the requested profile
  const profile = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      creatorStatus: true,
      isGhost: true,
      image: true,
      bio: true,
      followersCount: true,
      followingCount: true,
      subscribersCount: true,
      isPrivateAccount: true,
      creatorProfile: {
        select: {
            tier1Price: true,
            tier1Duration: true,
            tier2Price: true,
            tier2Duration: true,
            tier3Price: true,
            tier3Duration: true
        }
      },
      posts: {
        where: { author: { isGhost: false }, isPrivate: false },
        take: 10,
        select: { 
          id: true, 
          caption: true, 
          createdAt: true, 
          isPremium: true, 
          price: true,
          purchases: { where: { userId: currentUserId } }
        },
        orderBy: { createdAt: 'desc' }
      },
      reels: {
        where: { author: { isGhost: false }, isPrivate: false },
        take: 10,
        select: { 
          id: true, 
          caption: true, 
          createdAt: true, 
          isPremium: true, 
          price: true,
          purchases: { where: { userId: currentUserId } }
        },
        orderBy: { createdAt: 'desc' }
      },
      _count: {
        select: { posts: true, reels: true }
      }
    }
  });

  if (!profile || (profile.isGhost && profile.id !== currentUserId)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white px-6">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-black uppercase italic tracking-tighter text-zinc-600">User not found</h2>
          <p className="text-zinc-500 font-medium text-sm">The user you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // 4. Check if current user is following this profile
  const followRecord = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: currentUserId,
        followingId: profile.id
      }
    }
  });

  const isInitialFollowing = !!followRecord;
  const initialSubscriptionTier = followRecord?.subscriptionTier || 0;
  const followStatus = followRecord?.status || null;
  
  // 4b. Check for Blocks
  const blockRecord = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: currentUserId, blockedId: profile.id },
        { blockerId: profile.id, blockedId: currentUserId }
      ]
    }
  });

  if (blockRecord) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white px-6">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-black uppercase italic tracking-tighter text-zinc-600">User not found</h2>
          <p className="text-zinc-500 font-medium text-sm">The user you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // 5. Privacy Guard: If private and not accepted follower, hide posts/reels
  const isRestricted = profile.isPrivateAccount && profile.id !== currentUserId && followStatus !== "ACCEPTED";

  const posts = isRestricted ? [] : profile.posts;
  const reels = isRestricted ? [] : profile.reels;

  return (
    <PublicProfileClient 
      currentUserId={currentUserId} 
      currentUserBalance={session.user.walletBalance}
      currentIsGhost={session.user.isGhost}
      profile={{
        ...profile,
        posts,
        reels
      } as any} 
      isInitialFollowing={isInitialFollowing} 
      initialSubscriptionTier={initialSubscriptionTier}
      followStatus={followStatus}
      isRestricted={isRestricted}
    />
  );
}