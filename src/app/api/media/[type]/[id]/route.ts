import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import https from "https";
import http from "http";

function fetchImageProxy(urlStr: string): Promise<{ buffer: Buffer, contentType: string, status: number, statusText: string }> {
  return new Promise((resolve, reject) => {
    const isHttps = urlStr.startsWith('https');
    const client = isHttps ? https : http;
    
    const req = client.get(urlStr, { 
      family: 4,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Referer": "http://localhost:3000/",
      }
    }, (res) => {
      const statusCode = res.statusCode || 200;
      const statusMessage = res.statusMessage || "OK";
      const contentType = res.headers['content-type'] || 'application/octet-stream';

      if (statusCode && statusCode >= 300 && statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          const urlObj = new URL(urlStr);
          redirectUrl = urlObj.protocol + '//' + urlObj.host + redirectUrl;
        }
        resolve(fetchImageProxy(redirectUrl));
        return;
      }

      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          buffer: Buffer.concat(chunks),
          contentType,
          status: statusCode,
          statusText: statusMessage
        });
      });
    });

    req.on('error', (err) => reject(err));
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("Timeout getting proxy image"));
    });
  });
}

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
            select: { subscriptionTier: true },
          });

          if ((follow?.subscriptionTier || 0) > 0) {
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
      try {
        console.log(`[MEDIA PROXY] Fetching URL: ${data}`);
        
        const proxyRes = await fetchImageProxy(data);
        
        if (proxyRes.status >= 400) {
          console.error(`[MEDIA PROXY] Failed to fetch source: ${proxyRes.status} ${proxyRes.statusText} for URL: ${data}`);
          return new NextResponse(`Failed to fetch source: ${proxyRes.status}`, { status: 502 });
        }
      
        return new NextResponse(new Uint8Array(proxyRes.buffer), {
          headers: {
            "Content-Type": proxyRes.contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
            "Content-Disposition": "inline",
          },
        });
      } catch (error) {
        console.error(`[MEDIA PROXY] ERROR fetching URL ${data}:`, error);
        return new NextResponse(`Proxy error: ${error instanceof Error ? error.message : "Internal Error"}`, { status: 502 });
      }
    }

    return new NextResponse("Invalid Data Source", { status: 400 });
  } catch (error) {
    console.error("Critical Error serving media:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
