// app/lib/admin-actions.ts
"use server";
import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateCreatorStatus(
  profileId: string,
  userId: string,
  newStatus: "APPROVED" | "REJECTED"
) {
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Update the application record
      await tx.creatorProfile.update({
        where: { id: profileId },
        data: { status: newStatus },
      });

      // 2. Update the User's global status and Role
      await tx.user.update({
        where: { id: userId },
        data: { 
          creatorStatus: newStatus,
          role: newStatus === "APPROVED" ? "CREATOR" : "USER" 
        },
      });
    });

    revalidatePath("/admin/creators");
    revalidatePath("/profile"); // Ensures the user's view updates immediately
    return { success: true };
  } catch (error) {
    return { success: false, error: "Sync failed" };
  }
}