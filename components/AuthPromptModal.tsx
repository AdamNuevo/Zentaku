"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAuthPrompt } from "@/lib/auth-prompt-context";

export function AuthPromptModal() {
  const { isOpen, options, closeAuthPrompt } = useAuthPrompt();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) closeAuthPrompt();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeAuthPrompt]);

  if (!isOpen) return null;

  const returnTo = options.returnTo ? encodeURIComponent(options.returnTo) : "";
  const signupHref = returnTo ? `/signup?returnTo=${returnTo}` : "/signup";
  const loginHref = returnTo ? `/login?returnTo=${returnTo}` : "/login";

  const title = options.title || "Account Required";
  const message =
    options.message ||
    "Create an account to save this title to your watchlist and access it anytime.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={closeAuthPrompt}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-prompt-title"
        className="relative w-full max-w-sm rounded-xl border border-white/[0.1] bg-[#111418] p-6 shadow-2xl overflow-hidden"
      >
        {/* Subtle accent glow */}
        <div className="pointer-events-none absolute -top-12 -left-12 h-32 w-32 rounded-full bg-accent/20 blur-2xl" />

        {/* Header with Bookmark Icon */}
        <div className="relative mb-5 flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-accent shadow-inner">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </div>

          <button
            type="button"
            onClick={closeAuthPrompt}
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-white/[0.06] hover:text-foreground"
            aria-label="Close dialog"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="relative mb-6">
          <h2
            id="auth-prompt-title"
            className="text-lg font-bold tracking-tight text-foreground"
          >
            {title}
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {message}
          </p>
        </div>

        {/* Actions: Sign Up, Log In, Cancel */}
        <div className="relative flex flex-col gap-2.5">
          <Link
            href={signupHref}
            onClick={closeAuthPrompt}
            className="flex w-full items-center justify-center rounded-md bg-accent py-2.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover shadow-sm"
          >
            Sign Up
          </Link>

          <Link
            href={loginHref}
            onClick={closeAuthPrompt}
            className="flex w-full items-center justify-center rounded-md border border-white/[0.12] bg-surface-2 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            Log In
          </Link>

          <button
            type="button"
            onClick={closeAuthPrompt}
            className="w-full py-2 text-center text-xs font-medium text-muted transition-colors hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
