import Link from "next/link";
import type { AnimeKaiListItem } from "@/lib/animekai";
import type { JikanMangaListEntry } from "@/lib/types";
import { animeDetailHref } from "@/lib/anime-path";

type Props = {
  anime: AnimeKaiListItem[];
  manga: JikanMangaListEntry[];
};

export function TrendingPanels({ anime, manga }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <Panel
        title="Top Airing Anime"
        href="/browse?type=anime&sort=popular"
        items={anime.slice(0, 5).map((a, i) => ({
          rank: i + 1,
          title: a.title,
          subtitle: "Anime Series",
          href: animeDetailHref(a.id),
        }))}
      />
      <Panel
        title="Popular Manga"
        href="/browse?type=manga&sort=popular"
        items={manga.slice(0, 5).map((m, i) => ({
          rank: i + 1,
          title: m.title_english || m.title,
          subtitle: m.genres?.[0]?.name ?? "Manga",
          href: `/manga/${m.mal_id}`,
        }))}
      />
    </div>
  );
}

function Panel({
  title,
  href,
  items,
}: {
  title: string;
  href: string;
  items: { rank: number; title: string; subtitle?: string; href: string }[];
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-surface p-4">
      <div className="mb-3 flex items-center justify-between border-b border-white/[0.06] pb-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
          {title}
        </h3>
        <Link
          href={href}
          className="text-[11px] font-medium text-muted/80 transition-colors hover:text-foreground"
        >
          View all
        </Link>
      </div>

      <ol className="divide-y divide-white/[0.04]">
        {items.map((item) => (
          <li key={`${item.rank}-${item.href}`}>
            <Link
              href={item.href}
              className="group flex items-center gap-3.5 py-2.5 transition-colors"
            >
              <span className={`w-5 text-center font-mono text-xs font-semibold tabular-nums ${
                item.rank === 1 ? "text-accent" : "text-muted"
              }`}>
                {String(item.rank).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-xs font-medium text-foreground transition-colors group-hover:text-white">
                  {item.title}
                </p>
                {item.subtitle && (
                  <p className="text-[10px] text-muted/70">{item.subtitle}</p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
