"use server";

import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";

export interface StoryMediaInput {
  url: string;       // base64 data URL
  type: "image" | "video";
  duration: number;  // 10 for image, up to 30 for video
}

/** Create or update a story by adding media items (CREATOR ONLY) */
export async function createStory(userId: string, mediaItems: StoryMediaInput[]) {
  try {
    if (!mediaItems.length) return { success: false, error: "No media provided" };

    // 1. Find the most recent story record for this user
    let story = await prisma.story.findFirst({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' }
    });

    // If no story exists, create one
    if (!story) {
      story = await prisma.story.create({
        data: { authorId: userId }
      });
    }

    // 2. Add the new media items with individual expiration
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h from now

    // We use a simple loop or createMany to ensure each item has the correct fields
    await prisma.storyMedia.createMany({
      data: mediaItems.map((m, idx) => ({
        storyId: story!.id,
        url: m.url,
        type: m.type,
        duration: m.type === "image" ? Math.min(m.duration, 10) : Math.min(m.duration, 30),
        order: idx, 
        expiresAt: expiresAt
      }))
    });

    revalidatePath("/feed");
    return { success: true };
  } catch (e: any) {
    console.error("[createStory]", e);
    return { success: false, error: e.message };
  }
}

/** Fetch stories (from followed creators and current user) visible in feed */
export async function getStoriesForFeed(userId: string) {
  try {
    const now = new Date();

    // 1. Get the IDs of authors we care about (self + followed)
    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followedIds = follows.map(f => f.followingId);
    const authorIds = [...new Set([userId, ...followedIds])];

    // 2. Simple fetch to avoid the (not available) column error in complex joins
    // We fetch all stories for these authors, then filter media in memory
    const stories = await prisma.story.findMany({
      where: {
        authorId: { in: authorIds }
        // We removed the nested author role filter and media 'some' filter to be safe
      },
      include: {
        author: {
          select: { id: true, username: true, name: true, image: true, role: true },
        },
        media: {
          orderBy: { createdAt: "asc" },
          include: {
            views: {
              where: { userId },
              select: { id: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    // 3. Filter in memory for active media and valid stories
    const activeStories = stories.map(s => {
      // Only keep media that hasn't expired yet
      const unexpiredMedia = s.media.filter(m => new Date(m.expiresAt) > now);
      if (unexpiredMedia.length === 0) return null;

      return {
        ...s,
        media: unexpiredMedia,
        // Story is viewed ONLY if EVERY unexpired item has been viewed
        isViewed: unexpiredMedia.every(m => m.views.length > 0)
      };
    }).filter((s): s is NonNullable<typeof s> => s !== null);

    return { success: true, stories: activeStories };
  } catch (e: any) {
    console.error("[getStoriesForFeed]", e);
    return { success: false, stories: [], error: e.message };
  }
}

/** Mark a specific media item as viewed by the current user */
export async function markMediaViewed(userId: string, mediaId: string) {
  try {
    await prisma.storyMediaView.upsert({
      where: { storyMediaId_userId: { storyMediaId: mediaId, userId } },
      update: {},
      create: { storyMediaId: mediaId, userId },
    });
    return { success: true };
  } catch (e: any) {
    console.error("[markMediaViewed]", e);
    return { success: false };
  }
}

/** Delete a specific media item from a story */
export async function deleteStoryMedia(userId: string, mediaId: string) {
  try {
    // Check ownership
    const media = await prisma.storyMedia.findUnique({
      where: { id: mediaId },
      include: { story: true }
    });

    if (!media || media.story.authorId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.storyMedia.delete({
      where: { id: mediaId }
    });

    revalidatePath("/feed");
    return { success: true };
  } catch (e: any) {
    console.error("[deleteStoryMedia]", e);
    return { success: false, error: e.message };
  }
}
