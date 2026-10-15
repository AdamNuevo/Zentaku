"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { useWatchlist, useWatchHistory, toggleWatchlist, removeWatchHistory, useCustomAvatar, setCustomAvatar } from "@/lib/storage";
import { MediaCard } from "@/components/MediaCard";
import { animeDetailHref, animeWatchHref } from "@/lib/anime-path";
import { AvatarSelectorModal } from "@/components/AvatarSelectorModal";

type Tab = "overview" | "watchlist" | "history" | "settings";

function ProfileContent() {
  const router = useRouter();
  const { user, signOutUser, updateUserAvatar, resendVerificationEmail, isConfigured } = useAuth();
  const { showToast } = useToast();
  const watchlist = useWatchlist();
  const history = useWatchHistory();
  const customAvatar = useCustomAvatar();
  const [tab, setTab] = useState<Tab>("overview");
  const [signingOut, setSigningOut] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (!user || resendCooldown > 0 || resending) return;
    setResending(true);
    try {
      await resendVerificationEmail(user);
      setResendCooldown(60);
      showToast({
        title: "Verification email sent!",
        description: `A new link was sent to ${user.email}.`,
      });
    } catch {
      showToast({
        title: "Could not send verification email",
        description: "Please wait a moment before trying again.",
      });
    } finally {
      setResending(false);
    }
  };

  const handleRemoveFromWatchlist = (item: { id: string; type: "anime" | "manga"; title: string; poster: string }) => {
    toggleWatchlist({ id: item.id, type: item.type, title: item.title, poster: item.poster });
    showToast({
      title: "Removed from your watchlist.",
      description: `"${item.title}" was removed.`,
    });
  };

  // Redirect guests to login
  if (!user) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-surface-2 border border-white/[0.08]">
          <svg className="h-8 w-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-foreground">Sign in to view your profile</h1>
        <p className="mt-2 text-sm text-muted">Track your watchlist, history, and sync across devices.</p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/login?returnTo=/profile"
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Sign In
          </Link>
          <Link
            href="/signup?returnTo=/profile"
            className="rounded-lg border border-white/[0.1] px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/[0.04]"
          >
            Create Account
          </Link>
        </div>
      </main>
    );
  }

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOutUser();
      router.push("/");
    } catch {
      setSigningOut(false);
    }
  };

  const handleSaveAvatar = async (url: string | null) => {
    setCustomAvatar(url);
    if (updateUserAvatar) {
      await updateUserAvatar(url || "");
    }
  };

  const isGoogle = user.providerData?.some((p) => p.providerId === "google.com");
  const isUnverified = !isGoogle && !user.emailVerified;

  const currentAvatar = user.photoURL || customAvatar;
  const avatarLetter = (user.displayName || user.email || "U")[0].toUpperCase();
  const displayName = user.displayName || user.email?.split("@")[0] || "User";

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "watchlist", label: "Watchlist", count: watchlist.length },
    { id: "history", label: "History", count: history.length },
    { id: "settings", label: "Settings" },
  ];

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Email Verification Banner if applicable */}
      {isUnverified && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-amber-200">Please verify your email address before using this feature.</p>
              <p className="text-[11px] text-amber-200/80 mt-0.5">
                We sent a confirmation link to <strong className="text-white">{user.email}</strong>. Check your inbox to complete verification.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResendEmail}
            disabled={resendCooldown > 0 || resending}
            className="shrink-0 rounded-md border border-amber-500/30 bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/30 transition-colors disabled:opacity-50"
          >
            {resending ? "Sending..." : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Verification Email"}
          </button>
        </div>
      )}

      {/* ── Profile Hero Banner ── */}
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-surface">
        {/* Abstract background */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-surface to-surface-2 pointer-events-none" />
        <div className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 50%, rgba(220,38,38,0.15) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(100,60,200,0.1) 0%, transparent 50%)"
          }}
        />

        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:p-8">
          {/* Avatar with edit overlay */}
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setAvatarModalOpen(true)}
              className="group relative block rounded-full focus:outline-none focus:ring-2 focus:ring-accent"
              title="Change avatar"
            >
              {currentAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentAvatar}
                  alt={displayName}
                  className="h-20 w-20 rounded-full border-2 border-white/[0.15] object-cover shadow-xl sm:h-24 sm:w-24 [image-rendering:pixelated] transition-transform duration-200 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/[0.15] bg-gradient-to-br from-accent/60 to-accent shadow-xl sm:h-24 sm:w-24 transition-transform duration-200 group-hover:scale-105">
                  <span className="text-3xl font-bold text-white sm:text-4xl">{avatarLetter}</span>
                </div>
              )}

              {/* Subtle hover overlay */}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 backdrop-blur-[1px] transition-opacity duration-150 group-hover:opacity-100">
                <svg className="h-6 w-6 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </button>
            {/* Online dot */}
            <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-surface bg-emerald-400 pointer-events-none" />
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white sm:text-2xl truncate">{displayName}</h1>
            <p className="mt-0.5 text-sm text-muted truncate">{user.email}</p>

            {/* Stats row */}
            <div className="mt-4 flex flex-wrap gap-4">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{watchlist.length}</p>
                <p className="text-[11px] text-muted uppercase tracking-wider">Watchlist</p>
              </div>
              <div className="w-px bg-white/[0.08]" />
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{history.length}</p>
                <p className="text-[11px] text-muted uppercase tracking-wider">Watched</p>
              </div>
              <div className="w-px bg-white/[0.08]" />
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">
                  {watchlist.filter((w) => w.type === "anime").length}
                </p>
                <p className="text-[11px] text-muted uppercase tracking-wider">Anime</p>
              </div>
              <div className="w-px bg-white/[0.08]" />
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">
                  {watchlist.filter((w) => w.type === "manga").length}
                </p>
                <p className="text-[11px] text-muted uppercase tracking-wider">Manga</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="self-start sm:self-auto flex flex-wrap items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setAvatarModalOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-white/[0.1] bg-surface-2/70 px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:border-white/[0.2] hover:bg-surface-2"
            >
              <svg className="h-3.5 w-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Change avatar</span>
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-medium text-rose-300 transition-colors hover:bg-rose-500/20 disabled:opacity-50"
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="mb-6 border-b border-white/[0.07]">
        <div className="scrollbar-hide -mx-4 flex overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`relative flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "border-accent text-white"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {t.label}
              {t.count != null && t.count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    tab === t.id ? "bg-accent/20 text-accent" : "bg-white/[0.07] text-muted"
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Panels ── */}

      {/* Overview */}
      {tab === "overview" && (
        <div className="space-y-8 animate-fade-in">
          {/* Continue Watching */}
          {history.length > 0 && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">Continue Watching</h2>
                <button
                  type="button"
                  onClick={() => setTab("history")}
                  className="text-xs text-muted hover:text-foreground"
                >
                  See all →
                </button>
              </div>
              <div className="divide-y divide-white/[0.05] rounded-xl border border-white/[0.08] bg-surface overflow-hidden">
                {history.slice(0, 5).map((item) => (
                  <div key={item.animeId} className="flex items-center gap-4 p-3.5 transition-colors hover:bg-surface-2">
                    {/* Mini poster */}
                    <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-md bg-surface-2">
                      {item.poster && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.poster} alt="" className="h-full w-full object-cover" />
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/[0.15]">
                        <div
                          className="h-full bg-accent"
                          style={{
                            width: item.totalEpisodes
                              ? `${Math.min(100, (item.episodeNumber / item.totalEpisodes) * 100)}%`
                              : "35%",
                          }}
                        />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={animeDetailHref(item.animeId)}
                        className="line-clamp-1 text-xs font-semibold text-foreground hover:text-white"
                      >
                        {item.title}
                      </Link>
                      <p className="text-[11px] text-muted mt-0.5">Episode {item.episodeNumber}</p>
                    </div>
                    <Link
                      href={animeWatchHref(item.animeId, item.episodeNumber)}
                      className="shrink-0 rounded-md bg-accent px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-accent-hover"
                    >
                      Resume
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recent Watchlist additions */}
          {watchlist.length > 0 && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">Recently Saved</h2>
                <button
                  type="button"
                  onClick={() => setTab("watchlist")}
                  className="text-xs text-muted hover:text-foreground"
                >
                  See all →
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                {watchlist.slice(0, 8).map((item) => (
                  <MediaCard
                    key={item.id}
                    href={item.type === "anime" ? animeDetailHref(item.id) : `/manga/${item.id}`}
                    image={item.poster}
                    title={item.title}
                    badge={item.type === "anime" ? "ANIME" : "MANGA"}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {watchlist.length === 0 && history.length === 0 && (
            <div className="rounded-xl border border-white/[0.08] bg-surface p-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-2">
                <svg className="h-7 w-7 text-muted/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-foreground">Nothing here yet</h3>
              <p className="mt-1.5 text-xs text-muted">Start browsing anime and manga to build your library.</p>
              <Link
                href="/browse?type=anime"
                className="mt-5 inline-flex rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
              >
                Explore Anime
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Watchlist */}
      {tab === "watchlist" && (
        <div className="animate-fade-in">
          {watchlist.length === 0 ? (
            <div className="rounded-xl border border-white/[0.08] bg-surface p-12 text-center">
              <p className="text-sm text-muted">Your watchlist is empty.</p>
              <Link href="/browse?type=anime" className="mt-4 inline-flex rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-hover">
                Browse Anime
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {watchlist.map((item) => (
                <div key={item.id} className="relative group">
                  <MediaCard
                    href={item.type === "anime" ? animeDetailHref(item.id) : `/manga/${item.id}`}
                    image={item.poster}
                    title={item.title}
                    badge={item.type === "anime" ? "ANIME" : "MANGA"}
                    subtitle={item.genre}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveFromWatchlist(item)}
                    className="absolute top-2 right-2 rounded bg-black/80 px-2 py-1 text-[10px] text-muted/80 opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History */}
      {tab === "history" && (
        <div className="animate-fade-in">
          {history.length === 0 ? (
            <div className="rounded-xl border border-white/[0.08] bg-surface p-12 text-center">
              <p className="text-sm text-muted">No watch history yet.</p>
              <Link href="/browse?type=anime" className="mt-4 inline-flex rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-hover">
                Start Watching
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05] rounded-xl border border-white/[0.08] bg-surface overflow-hidden">
              {history.map((item) => (
                <div key={item.animeId} className="flex items-center gap-4 p-3.5 transition-colors hover:bg-surface-2">
                  <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-md bg-surface-2">
                    {item.poster && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.poster} alt="" className="h-full w-full object-cover" />
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/[0.15]">
                      <div
                        className="h-full bg-accent"
                        style={{
                          width: item.totalEpisodes
                            ? `${Math.min(100, (item.episodeNumber / item.totalEpisodes) * 100)}%`
                            : "35%",
                        }}
                      />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={animeDetailHref(item.animeId)}
                      className="line-clamp-1 text-sm font-semibold text-foreground hover:text-white"
                    >
                      {item.title}
                    </Link>
                    <p className="mt-0.5 text-[11px] text-muted">
                      Episode {item.episodeNumber}
                      {item.totalEpisodes ? ` / ${item.totalEpisodes}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={animeWatchHref(item.animeId, item.episodeNumber)}
                      className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
                    >
                      Resume
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeWatchHistory(item.animeId)}
                      className="rounded-md p-1.5 text-muted transition-colors hover:text-foreground"
                      title="Remove"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings */}
      {tab === "settings" && (
        <div className="max-w-lg space-y-6 animate-fade-in">
          {/* Profile Picture Card */}
          <div className="rounded-xl border border-white/[0.08] bg-surface p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Profile Picture</h2>
                <p className="text-xs text-muted mt-0.5">Customize your pixel avatar or profile photo</p>
              </div>
              <button
                type="button"
                onClick={() => setAvatarModalOpen(true)}
                className="rounded-md border border-white/[0.12] bg-surface-2 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-white/[0.06] hover:border-white/[0.2] transition-colors"
              >
                Change
              </button>
            </div>

            <div className="flex items-center gap-3.5 rounded-lg border border-white/[0.06] bg-surface-2/40 p-3.5">
              <div className="h-12 w-12 rounded-full border border-white/[0.12] bg-[#0d0f12] overflow-hidden flex-shrink-0 flex items-center justify-center">
                {currentAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentAvatar}
                    alt="Current Avatar"
                    className="h-full w-full object-cover [image-rendering:pixelated]"
                  />
                ) : (
                  <span className="text-lg font-bold text-white">{avatarLetter}</span>
                )}
              </div>
              <div className="min-w-0 flex-1 text-xs">
                <p className="font-medium text-foreground">
                  {currentAvatar ? "Custom avatar active" : "Default letter avatar"}
                </p>
                <p className="text-muted text-[11px] truncate">
                  {currentAvatar ? "Synced with your profile" : "Select an avatar from the gallery"}
                </p>
              </div>
              {currentAvatar && (
                <button
                  type="button"
                  onClick={() => handleSaveAvatar(null)}
                  className="text-xs text-muted hover:text-rose-400 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Account info card */}
          <div className="rounded-xl border border-white/[0.08] bg-surface p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Account Information</h2>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
                <span className="text-muted">Display name</span>
                <span className="font-medium text-foreground">{user.displayName || "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
                <span className="text-muted">Email</span>
                <span className="font-medium text-foreground">{user.email}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
                <span className="text-muted">Provider</span>
                <span className="font-medium text-foreground capitalize">
                  {user.providerData[0]?.providerId?.replace(".com", "") || "email"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted">UID</span>
                <span className="font-mono text-[10px] text-muted/70 truncate max-w-[160px]">{user.uid}</span>
              </div>
            </div>
          </div>

          {/* Firebase status */}
          {!isConfigured && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-200">
              <p className="font-semibold mb-1">Firebase not configured</p>
              <p className="text-amber-200/80">
                Add your <code className="rounded bg-amber-500/20 px-1 py-0.5 text-amber-300">NEXT_PUBLIC_FIREBASE_*</code> keys
                to <code className="rounded bg-amber-500/20 px-1 py-0.5 text-amber-300">.env.local</code> to enable cloud sync.
              </p>
            </div>
          )}

          {/* Danger zone */}
          <div className="rounded-xl border border-rose-500/20 bg-surface p-5 space-y-3">
            <h2 className="text-sm font-semibold text-rose-400">Danger Zone</h2>
            <p className="text-xs text-muted">Signing out will clear your session but your data remains saved.</p>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full rounded-lg border border-rose-500/30 bg-rose-500/10 py-2.5 text-xs font-medium text-rose-300 transition-colors hover:bg-rose-500/20 disabled:opacity-50"
            >
              {signingOut ? "Signing out…" : "Sign out of Zentaku"}
            </button>
          </div>
        </div>
      )}

      {/* Retro Avatar Selector Modal */}
      <AvatarSelectorModal
        isOpen={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        currentAvatar={currentAvatar}
        onSave={handleSaveAvatar}
        userName={displayName}
      />

    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="h-48 rounded-2xl bg-surface animate-pulse" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
