import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "RotaSphere — Rotaract District 3192 Event & Ticketing Portal";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#0b101b",
          backgroundImage: "radial-gradient(circle at 25px 25px, #1e293b 2%, transparent 0%), radial-gradient(circle at 75px 75px, #0758fc15 2%, transparent 0%)",
          backgroundSize: "100px 100px",
          padding: "60px 80px",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top Bar with Brand Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            {/* Logo box */}
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                backgroundColor: "#0758fc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                fontWeight: "900",
                color: "#ffffff",
                boxShadow: "0 8px 24px rgba(7, 88, 252, 0.4)",
              }}
            >
              R
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "28px", fontWeight: "900", letterSpacing: "-0.5px" }}>
                  RotaSphere
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "900",
                    backgroundColor: "rgba(7, 88, 252, 0.2)",
                    color: "#60a5fa",
                    border: "1px solid rgba(7, 88, 252, 0.4)",
                    padding: "2px 8px",
                    borderRadius: "8px",
                  }}
                >
                  3192
                </span>
              </div>
              <span style={{ fontSize: "14px", color: "#94a3b8", fontWeight: "600" }}>
                District 3192 Ticketing &amp; Experience
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              padding: "8px 18px",
              borderRadius: "999px",
              fontSize: "14px",
              fontWeight: "700",
              color: "#e2e8f0",
            }}
          >
            Rotaract District 3192 Official
          </div>
        </div>

        {/* Center Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "20px",
            maxWidth: "960px",
          }}
        >
          <div
            style={{
              fontSize: "58px",
              fontWeight: "900",
              lineHeight: 1.1,
              letterSpacing: "-1.5px",
              backgroundImage: "linear-gradient(to right, #ffffff, #cbd5e1, #60a5fa)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Empowering Youth Events &amp; Instant Ticketing
          </div>
          <div
            style={{
              fontSize: "22px",
              color: "#94a3b8",
              lineHeight: 1.4,
              maxWidth: "800px",
            }}
          >
            Discover conferences, cultural fests, workshops, and sports championships across all 85 chartered Rotaract clubs.
          </div>
        </div>

        {/* Bottom Feature Tags */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            width: "100%",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(7, 88, 252, 0.15)",
              border: "1px solid rgba(7, 88, 252, 0.3)",
              color: "#93c5fd",
              padding: "10px 20px",
              borderRadius: "14px",
              fontSize: "15px",
              fontWeight: "800",
            }}
          >
            🎟️ Instant QR Passes
          </div>
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#e2e8f0",
              padding: "10px 20px",
              borderRadius: "14px",
              fontSize: "15px",
              fontWeight: "800",
            }}
          >
            ⚡ Dynamic UPI &amp; Gate Scanner
          </div>
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#e2e8f0",
              padding: "10px 20px",
              borderRadius: "14px",
              fontSize: "15px",
              fontWeight: "800",
            }}
          >
            👥 85+ Chartered Clubs
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
