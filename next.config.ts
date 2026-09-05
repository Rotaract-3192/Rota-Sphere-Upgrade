import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: "/api/events/:slug/image.jpg",
        destination: "/api/events/:slug/image",
      },
      {
        source: "/events/:slug/opengraph-image",
        destination: "/api/events/:slug/image",
      },
      {
        source: "/events/:slug/opengraph-image-:hash",
        destination: "/api/events/:slug/image",
      },
    ];
  },
};

export default nextConfig;
