import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://events.rotaract3192.org";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/dashboard/", "/api/"],
      },
      {
        userAgent: ["ChatGPT-User", "GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"],
        allow: ["/", "/events/", "/clubs/", "/gallery/", "/about", "/district"],
        disallow: ["/admin/", "/dashboard/", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
