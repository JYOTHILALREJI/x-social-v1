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
          twoFactorQuestion: true,
          loginAlerts: true,
          isPrivateAccount: true,
          isActivityStatusEnabled: true,
          autoplayVideos: true,
          mutedWords: true,
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
              tier1Duration: true,
              tier2Price: true,
              tier2Duration: true,
              tier3Price: true,
              tier3Duration: true
            }
          },
          follows: {
            where: {
              subscriptionTier: { gt: 0 },
              expiresAt: { gt: new Date() }
            },
            select: {
              subscriptionTier: true,
              expiresAt: true,
              following: {
                select: {
                  username: true,
                  name: true
                }
              }
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

  // The walletBalance in DB is already net (platform fee is deducted at transaction time
  // in purchaseContent and subscribeToCreator). No further deduction needed here.
  return <ProfileClient 
    user={session.user} 
    platformFee={settings?.platformFee ?? 20} 
  />;

}