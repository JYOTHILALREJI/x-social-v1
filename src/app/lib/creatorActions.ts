"use server";

import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function submitCreatorApplication(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("auth_session")?.value;

  if (!sessionToken) {
    return { error: "Authentication required." };
  }

  // 1. Identify User via session
  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: { user: true },
  });

  if (!session) return { error: "User session not found." };

  // 2. Extract Data from FormData
  const categories = formData.getAll("categories") as string[];
  const idFile = formData.get("idFile") as File;
  const selfieFile = formData.get("selfieFile") as File;

  if (!idFile || !selfieFile || categories.length === 0) {
    return { error: "Please provide all required files and categories." };
  }

  try {
    // 3. Mock File Upload (In production, use S3/Cloudinary here)
    const idProofUrl = `/uploads/verification/${Date.now()}_id.jpg`;
    const selfieUrl = `/uploads/verification/${Date.now()}_selfie.jpg`;

    // 4. Update Database in a Transaction
    await prisma.$transaction([
      // Create detailed profile record
      prisma.creatorProfile.create({
        data: {
          userId: session.userId,
          categories: categories,
          idProofUrl: idProofUrl,
          selfieUrl: selfieUrl,
          status: "PENDING",
        },
      }),
      // Update User status for immediate UI state changes
      prisma.user.update({
        where: { id: session.userId },
        data: { creatorStatus: "PENDING" },
      }),
    ]);

    // 5. Revalidate to show "Pending" state on Profile page immediately
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Application submission error:", error);
    return { error: "Failed to submit application. Please try again." };
  }
}