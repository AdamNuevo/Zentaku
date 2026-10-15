import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

/** Pin tracing to this app so Next doesn’t pick a parent folder lockfile (e.g. `C:\\Users\\…\\package-lock.json`). */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  devIndicators: {
    position: "bottom-right",
  },
  async headers() {
    if (process.env.NODE_ENV === "production") return [];
    return [
      {
        source: "/Images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
  images: {
    localPatterns: [
      {
        pathname: "/api/anime-image",
        // Omit search so ?title=... fallbacks from Hero/MediaCard are allowed.
      },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "myanimelist.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.myanimelist.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api-cdn.myanimelist.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "uploads.mangadex.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "s4.anilist.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media.kitsu.app",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media.kitsu.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.anipixcdn.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.ibb.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.backblazeb2.com",
        pathname: "/**",
      },
    ],
    dangerouslyAllowSVG: true,
  },
  serverExternalPackages: ["@consumet/extensions", "got-scraping"],
};

export default nextConfig;
