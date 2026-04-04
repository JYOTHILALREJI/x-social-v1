import React from 'react';
import { prisma } from "@/app/lib/prisma"; 
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SettingsClientContainer from './SettingsClientContainer';

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('auth_session')?.value;

  if (!sessionToken) {
    redirect("/auth");
  }

  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          dob: true,
          bio: true,
          image: true,
          role: true,
          isGhost: true,
          creatorStatus: true,
          twoFactorQuestion: true,
          loginAlerts: true,
          isPrivateAccount: true,
          isActivityStatusEnabled: true,
          autoplayVideos: true,
          mutedWords: true,
          creatorProfile: {
            select: {
              tier1Price: true,
              tier1Duration: true,
              tier2Price: true,
              tier2Duration: true,
              tier3Price: true,
              tier3Duration: true
            }
          }
        }
      }
    }
  });

  if (!session?.user) {
    redirect("/auth");
  }

  // All authenticated users can access settings

  return <SettingsClientContainer user={session.user} />;
}