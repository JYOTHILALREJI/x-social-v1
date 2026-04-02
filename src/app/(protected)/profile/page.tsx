import { prisma } from "@/app/lib/prisma"; 
import { cookies } from "next/headers";
import ProfileClient from "./ProfileClient";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('auth_session')?.value;

  if (!sessionToken) {
    redirect("/auth");
  }

  // 1. Find the user based on the session token
  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          creatorStatus: true,
          image: true,
          bio: true,
          name: true,
          dob: true,
          isGhost: true,
          walletBalance: true,
          followersCount: true,
          subscribersCount: true,
          // Fetch actual posts for the creator dashboard
          posts: {
            take: 20,
            select: { id: true, caption: true, createdAt: true, isPremium: true, isPrivate: true, price: true },
            orderBy: {
              createdAt: 'desc'
            }
          },
          // Fetch actual reels for the creator dashboard
          reels: {
            take: 20,
            select: { id: true, caption: true, createdAt: true, isPremium: true, isPrivate: true, price: true },
            orderBy: {
              createdAt: 'desc'
            }
          },
          creatorProfile: {
            select: {
              tier1Price: true,
              tier2Price: true,
              tier3Price: true
            }
          },
          revenues: {
             take: 20,
             orderBy: {
               createdAt: 'desc'
             }
          },
          // Maintain counts for the header stats
          _count: {
            select: { posts: true, reels: true, followers: true, follows: true }
          }
        }
      }
    }
  });

  if (!session?.user) {
    redirect("/auth");
  }

  // 3. Fetch system settings for platform fee
  let settings = await prisma.systemSettings.findUnique({
    where: { id: "default" }
  });

  if (!settings) {
    settings = await prisma.systemSettings.create({
      data: { id: "default", platformFee: 20 }
    });
  }

  // 4. Calculate wallet balance: walletBalance(DB) - (20% of regular Revenue)
  // This ensures we keep the initial state and any adjustments, but apply the fee to earnings.
  const earningsSum = await prisma.revenue.aggregate({
    where: {
      creatorId: session.user.id,
      type: { in: ["SUBSCRIPTION", "POST_PURCHASE", "REEL_PURCHASE"] }
    },
    _sum: { amount: true }
  });

  const fee = settings?.platformFee ?? 20;
  const grossEarnings = earningsSum._sum.amount || 0;
  const taxAmount = Math.floor(grossEarnings * (fee / 100));
  
  const displayBalance = Math.max(0, session.user.walletBalance - taxAmount);

  // 2. Pass the user data (now including posts and reels) to the client component
  return <ProfileClient 
    user={{
      ...session.user,
      walletBalance: displayBalance
    }} 
    platformFee={settings?.platformFee ?? 20} 
  />;

}