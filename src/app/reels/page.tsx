// import ReelsView from '@/components/ReelsView';
// export default function ReelsPage() { return <ReelsView />; }

import { prisma } from "@/app/lib/prisma";
import ReelsView from "@/components/ReelsView";
import { VideoOff } from 'lucide-react';

export default async function ReelsPage() {
  // 1. Fetch real reels from the database using Prisma 7
  const dbReels = await prisma.reel.findMany({
    include: {
      author: {
        select: { username: true }
      }
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
  const formattedReels = dbReels.map(r => ({
    id: r.id,
    url: r.videoUrl,
    user: `@${r.author.username}`
  }));

  return <ReelsView initialData={formattedReels} />;
}