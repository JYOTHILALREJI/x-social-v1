import { prisma } from "@/app/lib/prisma";
import PendingCreatorsClient from "./PendingCreatorsClient";

export default async function PendingCreatorsPage() {
  // Fetch from database
  const pendingApplications = await prisma.creatorProfile.findMany({
    where: { status: "PENDING" },
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-10 w-full">
      <header>
        <h1 className="text-5xl font-black italic uppercase tracking-tighter">
          Verification <span className="text-purple-500">Queue</span>
        </h1>
        <p className="text-zinc-500 font-medium mt-2 uppercase tracking-widest text-xs">Review pending creator applications</p>
      </header>

      {/* Pass the data to the client component we just created */}
      <PendingCreatorsClient initialApplications={pendingApplications} />
    </div>
  );
}