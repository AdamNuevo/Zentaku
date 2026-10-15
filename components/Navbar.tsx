"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { isNavLinkActive } from "@/lib/nav-active";
import { useWatchlist, useCustomAvatar } from "@/lib/storage";
import { useAuth } from "@/lib/auth-context";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/browse?type=anime", label: "Anime" },
  { href: "/movies", label: "Movies" },
  { href: "/tv", label: "TV Series" },
  { href: "/browse?type=manga", label: "Manga" },
  { href: "/browse", label: "Catalog" },
];

function NavbarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [q, setQ] = useState("");
  const [searchType, setSearchType] = useState("anime");
  const watchlist = useWatchlist();
  const customAvatar = useCustomAvatar();
  const watchlistCount = watchlist.length;
  const { user, signOutUser } = useAuth();
  const displayPhoto = user?.photoURL || customAvatar;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.07] bg-[#0d0f12]/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

        {/* Left: Brand + Main Nav */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="group flex items-center gap-2 text-decoration-none"
            onClick={() => setOpen(false)}
          >
            <span className="text-lg font-bold tracking-wider text-foreground transition-colors group-hover:text-white">
              ZENTAKU
            </span>
            <span className="hidden text-[10px] tracking-widest text-muted/60 sm:inline-block font-sans">
              全択
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label }) => {
              const active = isNavLinkActive(pathname, searchParams, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${active
                      ? "text-white bg-white/[0.07]"
                      : "text-muted hover:text-foreground hover:bg-white/[0.03]"
                    }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Center/Right: Compact Search Bar */}
        <form
          action="/browse"
          className="hidden max-w-sm flex-1 items-center md:flex"
        >
          <div className="flex w-full items-center rounded-md border border-white/[0.08] bg-surface px-2.5 py-1 text-xs transition-colors focus-within:border-white/[0.2]">
            <select
              name="type"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="bg-transparent pr-2 text-muted font-medium outline-none cursor-pointer border-r border-white/[0.08]"
            >
              <option value="anime" className="bg-[#14171c] text-white">Anime</option>
              <option value="manga" className="bg-[#14171c] text-white">Manga</option>
              <option value="manhwa" className="bg-[#14171c] text-white">Manhwa</option>
              <option value="manhua" className="bg-[#14171c] text-white">Manhua</option>
            </select>
            <input
              name="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Search ${searchType}...`}
              className="w-full bg-transparent px-2 text-xs text-foreground placeholder:text-muted/60 outline-none"
            />
            <button type="submit" aria-label="Submit search" className="text-muted/60 hover:text-foreground">
              <SearchIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>

        {/* Right Actions: Watchlist & Profile/Login */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/watchlist"
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground hover:bg-white/[0.04]"
          >
            <BookmarkIcon className="h-3.5 w-3.5" />
            <span>Watchlist</span>
            {watchlistCount > 0 && (
              <span className="ml-0.5 rounded-full bg-accent/20 px-1.5 py-0.2 text-[10px] font-semibold text-accent">
                {watchlistCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-white/[0.1] bg-surface-2 p-1 pr-2.5 text-xs text-foreground transition-colors hover:border-white/[0.2]"
              >
                {displayPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={displayPhoto}
                    alt=""
                    className="h-6 w-6 rounded-full object-cover [image-rendering:pixelated]"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
                    {(user.displayName || user.email || "U")[0].toUpperCase()}
                  </div>
                )}
                <span className="max-w-[100px] truncate text-[11px] font-medium">
                  {user.displayName || user.email?.split("@")[0]}
                </span>
                <svg className="h-3 w-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-white/[0.08] bg-surface p-1.5 shadow-xl">
                    <div className="border-b border-white/[0.06] px-3 py-2">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {user.displayName || "User"}
                      </p>
                      <p className="truncate text-[10px] text-muted">{user.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center rounded-md px-3 py-2 text-xs text-muted transition-colors hover:bg-white/[0.04] hover:text-foreground"
                    >
                      My Profile
                    </Link>
                    <Link
                      href="/watchlist"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center justify-between rounded-md px-3 py-2 text-xs text-muted transition-colors hover:bg-white/[0.04] hover:text-foreground"
                    >
                      <span>Watchlist</span>
                      {watchlistCount > 0 && (
                        <span className="rounded-full bg-accent/20 px-1.5 py-0.2 text-[10px] font-semibold text-accent">
                          {watchlistCount}
                        </span>
                      )}
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        signOutUser();
                      }}
                      className="w-full text-left rounded-md px-3 py-2 text-xs text-rose-400 transition-colors hover:bg-rose-500/10"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href={`/login?returnTo=${encodeURIComponent(pathname)}`}
              className="rounded-md border border-white/[0.1] px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-white/[0.05] hover:text-white"
            >
              Sign in
            </Link>
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/browse"
            className="rounded-md p-1.5 text-muted hover:text-foreground"
            aria-label="Search"
          >
            <SearchIcon className="h-4 w-4" />
          </Link>
          <button
            type="button"
            className="rounded-md p-1.5 text-muted hover:text-foreground"
            aria-label="Toggle Menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="border-b border-white/[0.08] bg-[#0d0f12] px-4 py-4 md:hidden">
          <form action="/browse" className="mb-4 flex items-center rounded-md border border-white/[0.08] bg-surface px-3 py-2 text-xs">
            <select
              name="type"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="bg-transparent pr-2 text-muted font-medium outline-none cursor-pointer border-r border-white/[0.08]"
            >
              <option value="anime" className="bg-[#14171c] text-white">Anime</option>
              <option value="manga" className="bg-[#14171c] text-white">Manga</option>
              <option value="manhwa" className="bg-[#14171c] text-white">Manhwa</option>
              <option value="manhua" className="bg-[#14171c] text-white">Manhua</option>
            </select>
            <input
              name="q"
              placeholder={`Search ${searchType}...`}
              className="w-full bg-transparent px-2 text-xs text-foreground placeholder:text-muted/60 outline-none"
            />
          </form>

          <nav className="flex flex-col gap-1">
            {navLinks.map(({ href, label }) => {
              const active = isNavLinkActive(pathname, searchParams, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${active ? "bg-white/[0.08] text-white" : "text-muted hover:text-foreground"
                    }`}
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              );
            })}
            <Link
              href="/watchlist"
              className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-muted hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              <span>Watchlist</span>
              {watchlistCount > 0 && (
                <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent">
                  {watchlistCount}
                </span>
              )}
            </Link>
            {user ? (
              <div className="mt-3 border-t border-white/[0.08] pt-3">
                <div className="mb-3 flex items-center gap-2.5 px-3">
                  {displayPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={displayPhoto}
                      alt=""
                      className="h-8 w-8 rounded-full border border-white/20 object-cover [image-rendering:pixelated]"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                      {(user.displayName || user.email || "U")[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {user.displayName || "User"}
                    </p>
                    <p className="truncate text-[10px] text-muted">{user.email}</p>
                  </div>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted hover:text-foreground"
                >
                  My Profile
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    signOutUser();
                  }}
                  className="w-full rounded-md border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-center text-xs font-medium text-rose-300 hover:bg-rose-500/20"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                href={`/login?returnTo=${encodeURIComponent(pathname)}`}
                className="mt-2 rounded-md border border-white/[0.1] px-3 py-2 text-center text-sm font-medium text-foreground hover:bg-white/[0.04]"
                onClick={() => setOpen(false)}
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export function Navbar() {
  return (
    <Suspense fallback={<NavbarFallbackShell />}>
      <NavbarInner />
    </Suspense>
  );
}

function NavbarFallbackShell() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.07] bg-[#0d0f12]">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <span className="text-lg font-bold tracking-wider text-foreground">ZENTAKU</span>
      </div>
    </header>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
