import { MetadataRoute } from "next";
import { executeSql } from "@/lib/db/directDb";
import { DISTRICT_3192_CLUBS } from "@/lib/data/districtClubsData";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Revalidate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://events.rotaract3192.org";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/clubs`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/gallery`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tickets`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/district`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/help`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy-center`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/cancellation-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/disputes`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/accessibility`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Dynamic Event Routes
  let eventRoutes: MetadataRoute.Sitemap = [];
  try {
    const { data: events } = await executeSql<{
      slug: string;
      updated_at?: string;
      created_at?: string;
      start_date?: string;
    }>(`
      SELECT slug, updated_at, created_at, start_date 
      FROM saas_events 
      WHERE status = 'PUBLISHED' AND deleted_at IS NULL
      ORDER BY created_at DESC 
      LIMIT 1000;
    `);

    if (events && events.length > 0) {
      eventRoutes = events.map((e) => {
        const isUpcoming = e.start_date ? new Date(e.start_date).getTime() > Date.now() : true;
        const lastMod = e.updated_at || e.created_at || new Date().toISOString();
        return {
          url: `${baseUrl}/events/${e.slug}`,
          lastModified: new Date(lastMod),
          changeFrequency: isUpcoming ? ("daily" as const) : ("weekly" as const),
          priority: isUpcoming ? 0.9 : 0.7,
        };
      });
    }
  } catch (err) {
    console.error("Failed to fetch dynamic event routes for sitemap:", err);
  }

  // Dynamic Organization / Club Routes
  let clubRoutes: MetadataRoute.Sitemap = [];
  try {
    const { data: orgs } = await executeSql<{ slug: string; updated_at?: string }>(`
      SELECT slug, updated_at FROM organizations WHERE status = 'ACTIVE' LIMIT 200;
    `);

    if (orgs && orgs.length > 0) {
      clubRoutes = orgs.map((o) => ({
        url: `${baseUrl}/clubs?club_slug=${o.slug}`,
        lastModified: o.updated_at ? new Date(o.updated_at) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    }
  } catch {
    // Fallback using authentic district clubs list
    clubRoutes = DISTRICT_3192_CLUBS.slice(0, 50).map((c) => ({
      url: `${baseUrl}/clubs?club=${encodeURIComponent(c.name)}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  }

  return [...staticRoutes, ...eventRoutes, ...clubRoutes];
}
