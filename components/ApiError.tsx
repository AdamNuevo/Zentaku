"use client";

import Link from "next/link";

export function ApiError({
  title = "Unable to load content",
  message,
  status,
}: {
  title?: string;
  message?: string;
  status?: number;
}) {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-white/[0.08] bg-surface p-6 text-center shadow-sm">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {status != null && <p className="mt-0.5 text-[11px] text-muted">Status code: {status}</p>}
      <p className="mt-2 text-xs leading-relaxed text-muted">
        {message || "The requested media is temporarily unavailable. Please try again or return home."}
      </p>

      <div className="mt-5 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") window.location.reload();
          }}
          className="rounded-md bg-white/[0.07] px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-white/[0.12]"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-md border border-white/[0.1] px-3.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-white/[0.2] hover:text-foreground"
        >
          Return home
        </Link>
      </div>
    </div>
  );
}
