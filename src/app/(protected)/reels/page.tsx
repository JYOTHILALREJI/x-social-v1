import { prisma } from "@/app/lib/prisma";
import ReelsView from "@/components/ReelsView";
import { VideoOff } from 'lucide-react';
import { cookies } from "next/headers";

export default async function ReelsPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("auth_session")?.value;
  let userId = "";
  let currentUserBalance = 0;

  if (sessionToken) {
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      select: { 
        user: { 
          select: { 
            id: true,
            walletBalance: true
          } 
        } 
      }
    });
    userId = session?.user?.id || "";
    currentUserBalance = session?.user?.walletBalance || 0;
  }

  // 1. Fetch a smaller pool of reels (20) for the initial fast paint
  const dbReels = await prisma.reel.findMany({
    take: 20,
    include: {
      author: {
        select: { 
            id: true,
            username: true,
            name: true,
            image: true,
            followers: { where: { followerId: userId } }
         }
      },
      purchases: { where: { userId } },
      likes: { where: { userId } },
      upvotes: { where: { userId } },
      _count: { select: { likes: true, upvotes: true, comments: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  // 2. VIRALITY ALGORITHM: Score and sort based on engagement and recency
  // Formula: ((Likes * 1) + (Upvotes * 10) + (Comments * 5)) / (AgeInHours + 2)^1.8
  const scoredReels = dbReels.map(r => {
    const ageInHours = (Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60);
    const engagement = (r._count.likes * 1) + (r._count.upvotes * 10) + (r._count.comments * 5);
    const viralityScore = engagement / Math.pow(ageInHours + 2, 1.8);
    return { ...r, viralityScore };
  }).sort((a, b) => b.viralityScore - a.viralityScore);

  // Take the top 20 viral performing reels
  const topReels = scoredReels.slice(0, 20);

  // 3. Display blank screen with message if no data exists
  if (topReels.length === 0) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-zinc-500">
        <VideoOff size={48} className="mb-4 opacity-20" />
        <h2 className="text-xl font-bold tracking-tighter uppercase italic opacity-50">
          No reels to display
        </h2>
        <p className="mt-2 text-[10px] font-medium uppercase tracking-widest opacity-30">
          Check back later for new content
        </p>
      </div>
    );
  }

  // 4. Transform database data into the format expected by the frontend
  const formattedReels = topReels.map(r => {
    // Current user's relationship to author
    const isOwner = userId === r.authorId;
    const follow = r.author.followers[0];
    const isSubscribed = !!follow && (
      (follow.expiresAt && new Date(follow.expiresAt).getTime() > Date.now()) ||
      (!follow.expiresAt && (follow.subscriptionTier || 0) > 0)
    );
    const isPurchased = r.purchases.length > 0;
    const isUnlocked = !r.isPremium || isOwner || isSubscribed || isPurchased;

    return {
      id: r.id,
      url: r.videoUrl,
      authorId: r.author.id,
      authorName: r.author.name,
      authorUsername: r.author.username,
      authorImage: r.author.image,
      isUnlocked,
      isPremium: r.isPremium,
      price: r.price,
      likesCount: r._count.likes,
      upvotesCount: r._count.upvotes,
      commentsCount: r._count.comments,
      isLiked: r.likes.length > 0,
      isUpvoted: r.upvotes.length > 0,
    };
  });

  return <ReelsView initialData={formattedReels} currentUserId={userId} currentUserBalance={currentUserBalance} />;
}