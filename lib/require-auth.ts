"use client";

import { useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { useAuthPrompt } from "@/lib/auth-prompt-context";

export function useRequireAuth() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { openAuthPrompt } = useAuthPrompt();

  return useCallback(
    (pathname?: string) => {
      if (!user) {
        const path = pathname || (typeof window !== "undefined" ? window.location.pathname : "/");
        openAuthPrompt({
          returnTo: path,
          title: "Save to Watchlist",
          message:
            "Create an account to save this title to your watchlist and access it anytime.",
        });
        return false;
      }

      // If user signed up via email/password but is not yet verified:
      const isGoogle = user.providerData?.some((p) => p.providerId === "google.com");
      if (!isGoogle && !user.emailVerified) {
        showToast({
          title: "Email Verification Required",
          description: "Please verify your email address before using this feature.",
          action: { label: "View Profile", href: "/profile" },
        });
        return false;
      }

      return true;
    },
    [user, showToast, openAuthPrompt]
  );
}
