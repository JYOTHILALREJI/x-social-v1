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
          // Fetch actual posts for the creator dashboard
          posts: {
            take: 20,
            select: { id: true, caption: true, createdAt: true, isPremium: true, price: true },
            orderBy: {
              createdAt: 'desc'
            }
          },
          // Fetch actual reels for the creator dashboard
          reels: {
            take: 20,
            select: { id: true, caption: true, createdAt: true, isPremium: true, price: true },
            orderBy: {
              createdAt: 'desc'
            }
          },
          creatorProfile: {
            select: {
              subscriptionPrice: true
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
            select: { posts: true, reels: true, followers: true }
          }
        }
      }
    }
  });

  if (!session?.user) {
    redirect("/auth");
  }

  // 2. Pass the user data (now including posts and reels) to the client component
  return <ProfileClient user={session.user} />;
}