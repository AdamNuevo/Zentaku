import { NextRequest, NextResponse } from "next/server";
import { resolveKitsuMedia } from "@/lib/kitsu";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get("title") || "").trim();

  if (title) {
    try {
      const media = await resolveKitsuMedia(title);
      if (media.poster) {
        return NextResponse.redirect(media.poster, {
          status: 307,
          headers: {
            "Cache-Control": "public, max-age=86400, s-maxage=86400",
          },
        });
      }
    } catch {
      // Fall through to SVG fallback
    }
  }

  // Elegant fallback SVG placeholder if no poster artwork exists anywhere
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450" fill="none">
    <rect width="300" height="450" fill="#14171d"/>
    <circle cx="150" cy="180" r="48" fill="#1e232b"/>
    <path d="M142 162v36l30-18-30-18z" fill="#e50914"/>
    <text x="150" y="270" fill="#6b7280" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" text-anchor="middle">ZENTAKU</text>
    <text x="150" y="295" fill="#4b5563" font-family="system-ui, -apple-system, sans-serif" font-size="11" text-anchor="middle">${escapeXml(title ? title.slice(0, 28) : "Anime")}</text>
  </svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

function escapeXml(unsafe: string) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
