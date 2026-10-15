"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useToast } from "@/lib/toast-context";

export function Toast() {
  const { toast, dismissToast } = useToast();

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(dismissToast, 6000);
    return () => window.clearTimeout(timer);
  }, [toast, dismissToast]);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-4 right-4 z-[100] mx-auto max-w-md animate-[slide-up_0.25s_ease-out] md:bottom-6 md:left-auto md:right-6"
    >
      <div className="flex items-start gap-3 rounded-lg border border-white/[0.12] bg-surface-2 p-4 shadow-xl">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{toast.title}</p>
          {toast.description && (
            <p className="mt-1 text-xs leading-relaxed text-muted">{toast.description}</p>
          )}
          {toast.action && (
            <Link
              href={toast.action.href}
              onClick={dismissToast}
              className="mt-3 inline-flex items-center rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              {toast.action.label}
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={dismissToast}
          className="shrink-0 rounded-md p-1 text-muted transition-colors hover:bg-white/[0.06] hover:text-foreground"
          aria-label="Dismiss notification"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
