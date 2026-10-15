import React from "react";

type StreamingEpisode = {
  title?: string;
  site?: string;
  url?: string;
};

type ExternalLink = {
  site?: string;
  url?: string;
};

export async function OfficialStreams({ alId }: { alId: number }) {
  const query = `
    query ($id: Int) {
      Media (id: $id, type: ANIME) {
        streamingEpisodes {
          title
          site
          url
        }
        externalLinks {
          site
          url
        }
      }
    }
  `;

  try {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query,
        variables: { id: alId },
      }),
      next: { revalidate: 3600 },
    });
    const json = await res.json();
    const streamingEpisodes: StreamingEpisode[] = json?.data?.Media?.streamingEpisodes || [];
    const externalLinks: ExternalLink[] = json?.data?.Media?.externalLinks || [];

    // Deduplicate sites
    const sites = new Map<string, string>();
    streamingEpisodes.forEach((ep) => {
      if (ep.site && ep.url && !sites.has(ep.site)) {
        sites.set(ep.site, ep.url);
      }
    });
    externalLinks.forEach((link) => {
      const validSites = ["Crunchyroll", "Hulu", "Netflix", "Amazon", "Funimation", "Tubi TV"];
      if (link.site && link.url && validSites.includes(link.site) && !sites.has(link.site)) {
        sites.set(link.site, link.url);
      }
    });

    if (sites.size === 0) return null;

    return (
      <div className="mt-4 rounded-xl border border-white/[0.08] bg-surface p-4">
        <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">
          Official Platforms
        </h3>
        <p className="mb-3 text-xs text-muted/70">
          Support the original creators and studio via licensed streaming providers:
        </p>
        <div className="flex flex-wrap gap-2">
          {Array.from(sites.entries()).map(([site, url]) => (
            <a
              key={site}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-surface-2 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-white/[0.2] hover:text-white"
            >
              <span>{site}</span>
              <span className="text-muted/60 text-[10px]">↗</span>
            </a>
          ))}
        </div>
      </div>
    );
  } catch {
    return null;
  }
}
