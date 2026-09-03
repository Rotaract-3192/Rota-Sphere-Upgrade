import { NextRequest, NextResponse } from "next/server";
import { executeSql } from "@/lib/db/directDb";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return new NextResponse("Missing slug", { status: 400 });
    }

    const cleanSlug = slug.trim().toLowerCase().replace(/'/g, "''");

    const { data } = await executeSql(`
      SELECT title, cover_image_url, logo_url
      FROM saas_events
      WHERE LOWER(slug) = '${cleanSlug}'
        AND deleted_at IS NULL
      LIMIT 1;
    `);

    const event = data?.[0];
    const coverImageUrl = event?.cover_image_url || event?.logo_url;

    if (!coverImageUrl) {
      // Redirect to the default brand logo if no image exists
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://events.rotaract3192.org";
      return NextResponse.redirect(new URL("/brand-logo.png", baseUrl), 307);
    }

    // 1. If it's a base64 Data URL (uploaded directly via the event wizard)
    if (coverImageUrl.startsWith("data:")) {
      const match = coverImageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1] || "image/jpeg";
        const base64Data = match[2];
        const imageBuffer = Buffer.from(base64Data, "base64");

        return new NextResponse(imageBuffer, {
          status: 200,
          headers: {
            "Content-Type": mimeType,
            "Content-Length": imageBuffer.length.toString(),
            // Cache in CDN and browser for 24h, stale-while-revalidate 7 days
            "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
          },
        });
      }
    }

    // 2. If it's an external HTTP/HTTPS URL (e.g. Unsplash, Cloudinary, AWS S3)
    if (coverImageUrl.startsWith("http://") || coverImageUrl.startsWith("https://")) {
      return NextResponse.redirect(coverImageUrl, 307);
    }

    // 3. Fallback to default brand logo
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://events.rotaract3192.org";
    return NextResponse.redirect(new URL("/brand-logo.png", baseUrl), 307);
  } catch (error) {
    console.error("[EventImageRoute Error]:", error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://events.rotaract3192.org";
    return NextResponse.redirect(new URL("/brand-logo.png", baseUrl), 307);
  }
}
