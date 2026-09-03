/**
 * JSON-LD Structured Data Schema for Google Search Console & Search Engines
 * Complies with Schema.org & Google Event / Organization / Breadcrumb specifications.
 * Protects against script tag injection / XSS by escaping '<' as '\u003c'.
 */

import React from "react";

function safeJsonLd(obj: any): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

export function RootJsonLd() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://events.rotaract3192.org";

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: "Rotaract District 3192",
    alternateName: ["RotaSphere", "Rotaract D3192", "Rotaract District 3192 Council"],
    url: baseUrl,
    logo: {
      "@type": "ImageObject",
      url: `${baseUrl}/icon.png`,
      width: 512,
      height: 512,
    },
    image: `${baseUrl}/brand-logo.png`,
    description:
      "Official event ticketing, registration, and club discovery platform for Rotaract District 3192. Discover verified conferences, sports fests, cultural nights, and community initiatives.",
    sameAs: [
      "https://instagram.com/rotaractdistrict3192",
      "https://facebook.com/rotaract3192",
      "https://linkedin.com/company/rotaract-district-3192",
      "https://rotaract3192.org",
    ],
    areaServed: {
      "@type": "AdministrativeArea",
      name: "District 3192 (Bengaluru, Karnataka, India)",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@rotaract3192.org",
      availableLanguage: ["en", "kn", "hi"],
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    name: "RotaSphere District 3192",
    alternateName: "RotaSphere SaaS Event Platform",
    url: baseUrl,
    publisher: {
      "@id": `${baseUrl}/#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/events?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(websiteSchema) }}
      />
    </>
  );
}

export interface EventJsonLdProps {
  event: {
    id: string;
    slug: string;
    title: string;
    summary?: string | null;
    description?: string | null;
    start_date: string;
    end_date?: string | null;
    event_type?: string;
    venue_name?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    cover_image_url?: string | null;
    google_maps_url?: string | null;
    status?: string;
    org_name?: string | null;
    organization_name?: string | null;
    contact_email?: string | null;
  };
  tiers?: Array<{
    id?: string;
    name: string;
    price: number | string;
    description?: string | null;
    total_capacity?: number;
    sold_count?: number;
  }>;
  speakers?: Array<{
    name: string;
    role_title?: string | null;
    organization?: string | null;
    avatar_url?: string | null;
  }>;
  orgName?: string;
}

export function EventJsonLd({ event, tiers = [], speakers = [], orgName }: EventJsonLdProps) {
  if (!event) return null;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://events.rotaract3192.org";
  const eventUrl = `${baseUrl}/events/${event.slug}`;
  const hostingOrgName = orgName || event.org_name || event.organization_name || "Rotaract District 3192";

  // Compute price ranges for AggregateOffer
  const prices = tiers.map((t) => Number(t.price)).filter((p) => !isNaN(p));
  const lowPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const highPrice = prices.length > 0 ? Math.max(...prices) : 0;

  // Build Offer items
  const offersList =
    tiers.length > 0
      ? tiers.map((tier) => ({
          "@type": "Offer",
          name: tier.name,
          description: tier.description || undefined,
          price: Number(tier.price) || 0,
          priceCurrency: "INR",
          availability:
            (tier.total_capacity || 0) > (tier.sold_count || 0)
              ? "https://schema.org/InStock"
              : "https://schema.org/SoldOut",
          url: eventUrl,
          validFrom: new Date().toISOString(),
        }))
      : [
          {
            "@type": "Offer",
            name: "General Delegate Pass",
            price: lowPrice,
            priceCurrency: "INR",
            availability: "https://schema.org/InStock",
            url: eventUrl,
            validFrom: new Date().toISOString(),
          },
        ];

  // Build Performer items
  const performerList =
    speakers.length > 0
      ? speakers.map((spk) => ({
          "@type": "Person",
          name: spk.name,
          jobTitle: spk.role_title || undefined,
          worksFor: spk.organization
            ? {
                "@type": "Organization",
                name: spk.organization,
              }
            : undefined,
          image: spk.avatar_url || undefined,
        }))
      : undefined;

  const eventSchema = {
    "@context": "https://schema.org",
    "@type": "Event",
    "@id": `${eventUrl}#event`,
    name: event.title,
    description: event.summary || event.description?.slice(0, 300) || event.title,
    startDate: event.start_date,
    endDate: event.end_date || event.start_date,
    eventStatus:
      event.status === "CANCELLED"
        ? "https://schema.org/EventCancelled"
        : event.status === "COMPLETED"
        ? "https://schema.org/EventCompleted"
        : "https://schema.org/EventScheduled",
    eventAttendanceMode:
      event.event_type === "ONLINE"
        ? "https://schema.org/OnlineEventAttendanceMode"
        : event.event_type === "HYBRID"
        ? "https://schema.org/MixedEventAttendanceMode"
        : "https://schema.org/OfflineEventAttendanceMode",
    location:
      event.event_type === "ONLINE"
        ? {
            "@type": "VirtualLocation",
            url: eventUrl,
          }
        : {
            "@type": "Place",
            name: event.venue_name || "District 3192 Venue",
            hasMap: event.google_maps_url || undefined,
            address: {
              "@type": "PostalAddress",
              streetAddress: event.address || event.venue_name || "",
              addressLocality: event.city || "Bengaluru",
              addressRegion: event.state || "Karnataka",
              postalCode: event.pincode || "560001",
              addressCountry: "IN",
            },
          },
    image: [
      event.cover_image_url?.startsWith("http")
        ? event.cover_image_url
        : event.cover_image_url?.startsWith("data:")
        ? `${baseUrl}/api/events/${event.slug}/image`
        : `${baseUrl}/brand-logo.png`,
    ],
    organizer: {
      "@type": "Organization",
      name: hostingOrgName,
      url: `${baseUrl}/clubs`,
      email: event.contact_email || undefined,
    },
    performer: performerList,
    offers:
      tiers.length > 1
        ? {
            "@type": "AggregateOffer",
            lowPrice: lowPrice,
            highPrice: highPrice,
            priceCurrency: "INR",
            offerCount: tiers.length,
            offers: offersList,
            url: eventUrl,
          }
        : offersList[0],
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": eventUrl,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(eventSchema) }}
    />
  );
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: Array<{ name: string; url: string }>;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://events.rotaract3192.org";

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${baseUrl}${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbSchema) }}
    />
  );
}
