"use server";

import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createPost(
  authorId: string, 
  imageUrl: string, 
  caption: string, 
  isPremium: boolean, 
  price: number | null
) {
  try {
    const post = await prisma.post.create({
      data: {
        authorId,
        imageUrl,
        caption,
        isPremium,
        price
      }
    });

    // Revalidate paths to update UI
    revalidatePath("/profile");
    revalidatePath(`/profile/${authorId}`);

    return { success: true, post };
  } catch (error) {
    console.error("Error creating post:", error);
    return { success: false, error: "Failed to create post" };
  }
}

export async function createReel(
  authorId: string,
  videoUrl: string,
  caption: string,
  isPremium: boolean,
  price: number | null
) {
  try {
    const reel = await prisma.reel.create({
      data: {
        authorId,
        videoUrl,
        caption,
        isPremium,
        price
      }
    });

    // Revalidate paths to update UI
    revalidatePath("/profile");
    revalidatePath(`/profile/${authorId}`);

    return { success: true, reel };
  } catch (error) {
    console.error("Error creating reel:", error);
    return { success: false, error: "Failed to create reel" };
  }
}
