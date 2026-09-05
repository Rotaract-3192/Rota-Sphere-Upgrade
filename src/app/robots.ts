import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://events.rotaract3192.org";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/events", "/events/*", "/clubs", "/gallery", "/about", "/contact", "/district", "/help", "/tickets"],
        disallow: [
          "/admin",
          "/admin/*",
          "/dashboard",
          "/dashboard/*",
          "/api/*",
          "/check-in",
          "/check-in/*",
          "/checkout/*",
          "/sign-in/*",
          "/sign-up/*",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin/", "/dashboard/", "/api/", "/check-in/", "/check-in"],
      },
      {
        userAgent: ["ChatGPT-User", "GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "Applebot"],
        allow: ["/", "/events/", "/clubs/", "/gallery/", "/about", "/district"],
        disallow: ["/admin/", "/dashboard/", "/api/", "/check-in/", "/check-in"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
