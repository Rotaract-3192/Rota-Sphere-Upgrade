/**
 * JSON-LD Structured Data Schema for Search Engines (Google, Bing)
 * Adds Organization and WebSite schemas for rich snippets and site search box eligibility.
 */

export function RootJsonLd() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rotaract3192.org";

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Rotaract District 3192",
    alternateName: "RotaSphere",
    url: baseUrl,
    logo: `${baseUrl}/icon.png`,
    description:
      "Official event ticketing, registration, and club discovery platform for Rotaract District 3192.",
    sameAs: [
      "https://instagram.com/rotaractdistrict3192",
      "https://facebook.com/rotaract3192",
      "https://linkedin.com/company/rotaract-district-3192",
    ],
    areaServed: {
      "@type": "AdministrativeArea",
      name: "District 3192 (Karnataka, India)",
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "RotaSphere District 3192",
    url: baseUrl,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}

export function EventJsonLd({ event }: { event: any }) {
  if (!event) return null;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rotaract3192.org";

  const eventSchema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.summary || event.description,
    startDate: event.start_date,
    endDate: event.end_date || event.start_date,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: event.is_virtual
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.venue_name || "District 3192 Venue",
      address: {
        "@type": "PostalAddress",
        streetAddress: event.address || "",
        addressLocality: event.city || "Bengaluru",
        addressRegion: "Karnataka",
        postalCode: event.pincode || "560001",
        addressCountry: "IN",
      },
    },
    image: [event.cover_image_url || `${baseUrl}/icon.png`],
    organizer: {
      "@type": "Organization",
      name: event.organization_name || "Rotaract District 3192",
      url: `${baseUrl}/clubs`,
    },
    offers: {
      "@type": "Offer",
      url: `${baseUrl}/events/${event.slug}`,
      price: event.minPrice ?? 0,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      validFrom: new Date().toISOString(),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }}
    />
  );
}
