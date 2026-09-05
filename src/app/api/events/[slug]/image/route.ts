import { NextRequest, NextResponse } from "next/server";
import { executeSql } from "@/lib/db/directDb";
import sharp from "sharp";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Helper to serve an optimized brand fallback image if event has no banner
async function getFallbackImageBuffer(): Promise<Buffer | null> {
  try {
    const candidates = [
      path.join(process.cwd(), "public", "brand-logo.png"),
      path.join(process.cwd(), "public", "logo.png"),
      path.join(process.cwd(), "public", "icon.png"),
    ];

    for (const filePath of candidates) {
      if (fs.existsSync(filePath)) {
        const rawBuffer = await fs.promises.readFile(filePath);
        const processed = await sharp(rawBuffer)
          .resize(1200, 630, {
            fit: "contain",
            background: { r: 7, g: 12, b: 24, alpha: 1 }, // Brand dark background #070c18
          })
          .jpeg({ quality: 82, mozjpeg: true })
          .toBuffer();
        return processed;
      }
    }
  } catch (err) {
    console.error("[FallbackImage Error]:", err);
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      const fallback = await getFallbackImageBuffer();
      if (fallback) {
        return new NextResponse(new Uint8Array(fallback), {
          status: 200,
          headers: {
            "Content-Type": "image/jpeg",
            "Content-Length": fallback.length.toString(),
            "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
          },
        });
      }
      return new NextResponse("Missing slug", { status: 400 });
    }

    // Strip extension (.jpg, .jpeg, .png, .webp) if provided in the URL
    const cleanSlug = slug
      .trim()
      .toLowerCase()
      .replace(/\.(jpg|jpeg|png|webp)$/i, "")
      .replace(/'/g, "''");

    const { data } = await executeSql(`
      SELECT title, cover_image_url, logo_url
      FROM saas_events
      WHERE LOWER(slug) = '${cleanSlug}'
        AND deleted_at IS NULL
      LIMIT 1;
    `);

    const event = data?.[0];
    const coverImageUrl = event?.cover_image_url || event?.logo_url;

    // 1. If it's a base64 Data URL (uploaded directly via the event wizard)
    if (coverImageUrl && coverImageUrl.startsWith("data:")) {
      const match = coverImageUrl.match(/^data:[^;]+;base64,(.+)$/);
      if (match && match[1]) {
        try {
          const rawBuffer = Buffer.from(match[1], "base64");
          // Resize & compress to standard 1200x630 (1.91:1) OpenGraph dimensions (< 150 KB)
          const optimizedBuffer = await sharp(rawBuffer)
            .resize(1200, 630, {
              fit: "cover",
              position: "center",
            })
            .jpeg({ quality: 82, mozjpeg: true })
            .toBuffer();

          return new NextResponse(new Uint8Array(optimizedBuffer), {
            status: 200,
            headers: {
              "Content-Type": "image/jpeg",
              "Content-Length": optimizedBuffer.length.toString(),
              "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
            },
          });
        } catch (sharpErr) {
          console.error("[Sharp Base64 Processing Error]:", sharpErr);
          // Fallback to raw buffer if sharp fails
          const rawBuffer = Buffer.from(match[1], "base64");
          return new NextResponse(new Uint8Array(rawBuffer), {
            status: 200,
            headers: {
              "Content-Type": "image/jpeg",
              "Content-Length": rawBuffer.length.toString(),
              "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
            },
          });
        }
      }
    }

    // 2. If it's an external HTTP/HTTPS URL (e.g. Unsplash, S3, Cloudinary)
    if (coverImageUrl && (coverImageUrl.startsWith("http://") || coverImageUrl.startsWith("https://"))) {
      try {
        const externalRes = await fetch(coverImageUrl, {
          signal: AbortSignal.timeout(4000),
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; RotaSphereBot/1.0; +https://rotaract3192.org)",
          },
        });

        if (externalRes.ok) {
          const arrayBuffer = await externalRes.arrayBuffer();
          const optimizedBuffer = await sharp(Buffer.from(arrayBuffer))
            .resize(1200, 630, {
              fit: "cover",
              position: "center",
            })
            .jpeg({ quality: 82, mozjpeg: true })
            .toBuffer();

          return new NextResponse(new Uint8Array(optimizedBuffer), {
            status: 200,
            headers: {
              "Content-Type": "image/jpeg",
              "Content-Length": optimizedBuffer.length.toString(),
              "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
            },
          });
        }
      } catch (fetchErr) {
        console.warn("[External Image Fetch Warning]:", fetchErr);
        // If fetch times out or fails, redirect crawler directly to the external URL
        return NextResponse.redirect(coverImageUrl, 307);
      }
      return NextResponse.redirect(coverImageUrl, 307);
    }

    // 3. Fallback: serve optimized brand banner
    const fallbackBuffer = await getFallbackImageBuffer();
    if (fallbackBuffer) {
      return new NextResponse(new Uint8Array(fallbackBuffer), {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
          "Content-Length": fallbackBuffer.length.toString(),
          "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        },
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://events.rotaract3192.org";
    return NextResponse.redirect(new URL("/brand-logo.png", baseUrl), 307);
  } catch (error) {
    console.error("[EventImageRoute Fatal Error]:", error);
    const fallbackBuffer = await getFallbackImageBuffer();
    if (fallbackBuffer) {
      return new NextResponse(new Uint8Array(fallbackBuffer), {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
          "Content-Length": fallbackBuffer.length.toString(),
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://events.rotaract3192.org";
    return NextResponse.redirect(new URL("/brand-logo.png", baseUrl), 307);
  }
}
