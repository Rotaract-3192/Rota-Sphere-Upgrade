import { ImageResponse } from "next/og";
import { executeSql } from "@/lib/db/directDb";

export const runtime = "nodejs";
export const alt = "Event Delegate Pass & Registration | RotaSphere District 3192";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function EventOpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data } = await executeSql(`
    SELECT e.title, e.summary, cat.name as category, e.venue_name, e.city, e.start_date, e.cover_image_url, o.name as org_name
    FROM saas_events e
    LEFT JOIN organizations o ON e.organization_id = o.id
    LEFT JOIN event_categories cat ON e.category_id = cat.id
    WHERE e.slug = '${slug.replace(/'/g, "''")}' AND e.status = 'PUBLISHED' AND e.deleted_at IS NULL
    LIMIT 1;
  `);

  const event = data?.[0];
  const title = event?.title || "Rotaract District 3192 Flagship Event";
  const orgName = event?.org_name || "Rotaract District 3192";
  const category = (event?.category || "CONFERENCE").toUpperCase();
  const city = event?.city || event?.venue_name || "District 3192, Bengaluru";
  
  let formattedDate = "Upcoming 2026";
  if (event?.start_date) {
    try {
      formattedDate = new Date(event.start_date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      });
    } catch {
      formattedDate = String(event.start_date);
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#070c18",
          padding: "60px 70px",
          color: "white",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Glow blur in background */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            backgroundColor: "rgba(7, 88, 252, 0.25)",
            filter: "blur(120px)",
          }}
        />

        {/* Top Bar: Brand & Category Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                backgroundColor: "#0758fc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                fontWeight: "900",
                color: "#ffffff",
                boxShadow: "0 6px 20px rgba(7, 88, 252, 0.4)",
              }}
            >
              R
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "24px", fontWeight: "900", letterSpacing: "-0.5px" }}>
                RotaSphere
              </span>
              <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "700" }}>
                {orgName}
              </span>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "rgba(7, 88, 252, 0.2)",
              border: "1px solid rgba(7, 88, 252, 0.4)",
              color: "#60a5fa",
              padding: "6px 16px",
              borderRadius: "999px",
              fontSize: "13px",
              fontWeight: "900",
              letterSpacing: "0.5px",
            }}
          >
            {category}
          </div>
        </div>

        {/* Center: Event Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            maxWidth: "1000px",
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontSize: title.length > 40 ? "46px" : "56px",
              fontWeight: "900",
              lineHeight: 1.15,
              letterSpacing: "-1px",
              color: "#ffffff",
            }}
          >
            {title}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              fontSize: "18px",
              color: "#cbd5e1",
              fontWeight: "700",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>📅</span>
              <span>{formattedDate}</span>
            </div>
            <span>·</span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>📍</span>
              <span>{city}</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Action Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            borderTop: "1px solid rgba(255, 255, 255, 0.12)",
            paddingTop: "24px",
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontSize: "14px",
              color: "#94a3b8",
              fontWeight: "600",
            }}
          >
            Official District 3192 Pass Registration
          </div>

          <div
            style={{
              backgroundColor: "#0758fc",
              color: "#ffffff",
              padding: "10px 24px",
              borderRadius: "12px",
              fontSize: "15px",
              fontWeight: "900",
              boxShadow: "0 4px 14px rgba(7, 88, 252, 0.35)",
            }}
          >
            Book Passes on RotaSphere 🎟️
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
