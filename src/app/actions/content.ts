"use server";

import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createPost(formData: FormData) {
  try {
    const authorId = formData.get("authorId") as string;
    const imageUrl = formData.get("imageUrl") as string;
    const caption = formData.get("caption") as string;
    const isPremium = formData.get("isPremium") === "true";
    const price = formData.get("price") ? parseInt(formData.get("price") as string, 10) : null;

    if (!authorId || !imageUrl) {
      return { success: false, error: "Missing required fields" };
    }

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
    revalidatePath("/feed");

    return { success: true, post };
  } catch (error) {
    console.error("Error creating post:", error);
    return { success: false, error: "Failed to create post" };
  }
}

export async function createReel(formData: FormData) {
  try {
    const authorId = formData.get("authorId") as string;
    const videoUrl = formData.get("videoUrl") as string;
    const caption = formData.get("caption") as string;
    const isPremium = formData.get("isPremium") === "true";
    const price = formData.get("price") ? parseInt(formData.get("price") as string, 10) : null;

    if (!authorId || !videoUrl) {
      return { success: false, error: "Missing required fields" };
    }

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
    revalidatePath("/reels");

    return { success: true, reel };
  } catch (error) {
    console.error("Error creating reel:", error);
    return { success: false, error: "Failed to create reel" };
  }
}
export async function updatePost(postId: string, caption: string) {
  try {
    const post = await prisma.post.update({
      where: { id: postId },
      data: { caption }
    });

    revalidatePath("/profile");
    revalidatePath("/feed");

    return { success: true, post };
  } catch (error) {
    console.error("Error updating post:", error);
    return { success: false, error: "Failed to update post" };
  }
}

export async function deletePost(postId: string) {
  try {
    await prisma.post.delete({
      where: { id: postId }
    });

    revalidatePath("/profile");
    revalidatePath("/feed");

    return { success: true };
  } catch (error) {
    console.error("Error deleting post:", error);
    return { success: false, error: "Failed to delete post" };
  }
}

export async function updateReel(reelId: string, caption: string) {
  try {
    const reel = await prisma.reel.update({
      where: { id: reelId },
      data: { caption }
    });

    revalidatePath("/profile");
    revalidatePath("/reels");

    return { success: true, reel };
  } catch (error) {
    console.error("Error updating reel:", error);
    return { success: false, error: "Failed to update reel" };
  }
}

export async function deleteReel(reelId: string) {
  try {
    await prisma.reel.delete({
      where: { id: reelId }
    });

    revalidatePath("/profile");
    revalidatePath("/reels");

    return { success: true };
  } catch (error) {
    console.error("Error deleting reel:", error);
    return { success: false, error: "Failed to delete reel" };
  }
}
