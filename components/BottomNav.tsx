"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { isNavLinkActive } from "@/lib/nav-active";
import { useAuth } from "@/lib/auth-context";
import { useCustomAvatar } from "@/lib/storage";

const items = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/movies", label: "Movies", icon: MovieIcon },
  { href: "/tv", label: "TV", icon: TVIcon },
  { href: "/browse?type=anime", label: "Anime", icon: AnimeIcon },
  { href: "/browse", label: "Search", icon: SearchIcon },
  { href: "/profile", label: "Profile", icon: ProfileIcon, isProfile: true },
];

function BottomNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const customAvatar = useCustomAvatar();
  const avatarUrl = user?.photoURL || customAvatar;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.08] bg-[#0d0f12]/95 backdrop-blur-md md:hidden safe-pb">
      <ul className="mx-auto flex max-w-md items-center justify-around px-1 pt-1.5">
        {items.map(({ href, label, icon: Icon, isProfile }) => {
          const active = isNavLinkActive(pathname, searchParams, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex flex-col items-center justify-center gap-1 py-1 text-[10px] font-medium transition-colors ${
                  active ? "text-white" : "text-muted hover:text-foreground"
                }`}
              >
                <div className="relative">
                  <Icon
                    className="h-5 w-5"
                    active={active}
                    user={isProfile ? user : undefined}
                    avatarUrl={isProfile ? avatarUrl : undefined}
                  />
                  {active && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-accent" />
                  )}
                </div>
                <span className="truncate max-w-[52px]">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function BottomNav() {
  return (
    <Suspense fallback={<div className="fixed bottom-0 left-0 right-0 z-40 h-14 border-t border-white/[0.08] bg-[#0d0f12] md:hidden" />}>
      <BottomNavInner />
    </Suspense>
  );
}

function HomeIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={active ? 2.2 : 1.75}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

function MovieIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={active ? 2.2 : 1.75}
        d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
      />
    </svg>
  );
}

function TVIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={active ? 2.2 : 1.75}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function AnimeIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={active ? 2.2 : 1.75}
        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={active ? 2.2 : 1.75}
        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function SearchIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={active ? 2.2 : 1.75}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function ProfileIcon({
  className,
  active,
  user,
  avatarUrl,
}: {
  className?: string;
  active?: boolean;
  user?: { photoURL?: string | null; displayName?: string | null; email?: string | null } | null;
  avatarUrl?: string | null;
}) {
  const photo = avatarUrl || user?.photoURL;
  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo}
        alt=""
        className={`h-5 w-5 rounded-full object-cover border transition-transform [image-rendering:pixelated] ${
          active ? "border-accent ring-1 ring-accent scale-105" : "border-white/20"
        }`}
      />
    );
  }
  if (user) {
    return (
      <div
        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white transition-transform ${
          active ? "bg-accent ring-1 ring-accent scale-105" : "bg-surface-2 border border-white/20"
        }`}
      >
        {(user.displayName || user.email || "U")[0].toUpperCase()}
      </div>
    );
  }
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={active ? 2.2 : 1.75}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

