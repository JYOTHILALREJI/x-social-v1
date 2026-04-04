// app/actions/search.ts
"use server"
import { prisma } from "@/app/lib/prisma";

export async function searchUsers(query: string, currentUserId: string) {
  if (!query) return [];

  return await prisma.user.findMany({
    where: {
      AND: [
        { id: { not: currentUserId } }, // Don't show the logged-in user
        { isGhost: false },
        {
          OR: [
            { username: { contains: query, mode: "insensitive" } },
            { id: { contains: query, mode: "insensitive" } },
          ],
        },
        // Exclusion: Filter out users who have blocked current user OR current user has blocked them
        {
          blockedBy: {
            none: { blockerId: currentUserId }
          }
        },
        {
          blocking: {
            none: { blockedId: currentUserId }
          }
        }
      ],
    },
    select: {
      id: true,
      username: true,
      image: true,
      _count: {
        select: { followers: true } // Assuming your schema has a followers relation
      }
    },
    take: 10,
  });
}