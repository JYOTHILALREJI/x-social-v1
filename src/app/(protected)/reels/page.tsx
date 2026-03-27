import { prisma } from "@/app/lib/prisma";
import ReelsView from "@/components/ReelsView";
import { VideoOff } from 'lucide-react';
import { cookies } from "next/headers";

export default async function ReelsPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("auth_session")?.value;
  let userId = "";

  if (sessionToken) {
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      select: { user: { select: { id: true } } }
    });
    userId = session?.user?.id || "";
  }

  // 1. Fetch real reels from the database
  const dbReels = await prisma.reel.findMany({
    take: 10,
    include: {
      author: {
        select: { 
            id: true,
            username: true,
            follows: { where: { followerId: userId } }
         }
      },
      purchases: { where: { userId } }
    },
    orderBy: { createdAt: 'desc' }
  });

  // 2. Display blank screen with message if no data exists
  if (dbReels.length === 0) {
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

  // 3. Transform database data into the format expected by the frontend
  const formattedReels = dbReels.map(r => {
    // Current user's relationship to author
    const isOwner = userId === r.authorId;
    const follow = r.author.follows[0];
    const isSubscribed = !!follow && (follow.subscriptionTier || 0) > 0;
    const isPurchased = r.purchases.length > 0;
    const isUnlocked = !r.isPremium || isOwner || isSubscribed || isPurchased;

    return {
      id: r.id,
      url: r.videoUrl,
      user: `@${r.author.username}`,
      isUnlocked
    };
  });

  return <ReelsView initialData={formattedReels} />;
}