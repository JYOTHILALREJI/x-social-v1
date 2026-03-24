import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// A small transparent pixel placeholder for locked content
const BLURRED_PLACEHOLDER_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ type: string; id: string }> }
): Promise<NextResponse> {
  const { type, id } = await context.params;

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("auth_session")?.value;

  try {
    let data: string | null = null;
    let mimeType = "application/octet-stream";
    let isPremium = false;
    let authorId = "";

    if (type === "post") {
      const post = await prisma.post.findUnique({
        where: { id },
        select: { imageUrl: true, isPremium: true, authorId: true },
      });
      data = post?.imageUrl ?? null;
      isPremium = post?.isPremium ?? false;
      authorId = post?.authorId ?? "";
    } else if (type === "reel") {
      const reel = await prisma.reel.findUnique({
        where: { id },
        select: { videoUrl: true, isPremium: true, authorId: true },
      });
      data = reel?.videoUrl ?? null;
      isPremium = reel?.isPremium ?? false;
      authorId = reel?.authorId ?? "";
    }

    if (!data) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // ---------- ACCESS CONTROL ----------
    let isAuthorized = !isPremium; // free content is always authorized

    if (isPremium && sessionToken) {
      const session = await prisma.session.findUnique({
        where: { sessionToken },
        select: { user: { select: { id: true } } },
      });

      if (session?.user) {
        const userId = session.user.id;

        // Author always has access
        if (userId === authorId) {
          isAuthorized = true;
        } else {
          // Check subscription
          const follow = await prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: userId,
                followingId: authorId,
              },
            },
            select: { isSubscribed: true },
          });

          if (follow?.isSubscribed) {
            isAuthorized = true;
          } else {
            // Check specific purchase
            let purchase = null;
            if (type === "post") {
              purchase = await prisma.purchase.findUnique({
                where: { userId_postId: { userId, postId: id } },
              });
            } else if (type === "reel") {
              purchase = await prisma.purchase.findUnique({
                where: { userId_reelId: { userId, reelId: id } },
              });
            }
            if (purchase) isAuthorized = true;
          }
        }
      }
    }

    // Return blurred placeholder for unauthorized premium content
    if (!isAuthorized) {
      const buffer = Buffer.from(BLURRED_PLACEHOLDER_B64, "base64");
      return new NextResponse(buffer, {
        headers: { "Content-Type": "image/png" },
      });
    }

    // ---------- SERVE ORIGINAL DATA ----------
    if (data.startsWith("data:")) {
      const match = data.match(/^data:(.*);base64,(.*)$/);
      if (match) {
        mimeType = match[1];
        const buffer = Buffer.from(match[2], "base64");
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": mimeType,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    }

    if (data.startsWith("http")) {
      return NextResponse.redirect(data);
    }

    return new NextResponse("Invalid Data", { status: 400 });
  } catch (error) {
    console.error("Error serving media:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
