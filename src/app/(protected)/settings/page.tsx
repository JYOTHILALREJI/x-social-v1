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
          creatorStatus: true,
          creatorProfile: {
            select: {
              tier1Price: true,
              tier2Price: true,
              tier3Price: true
            }
          }
        }
      }
    }
  });

  if (!session?.user) {
    redirect("/auth");
  }

  // If they are not a verified creator, redirect them to profile because their settings are embedded there
  if (session.user.creatorStatus !== 'APPROVED') {
    redirect("/profile");
  }

  return <SettingsClientContainer user={session.user} />;
}