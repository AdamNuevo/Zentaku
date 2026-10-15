"use client";

import Link from "next/link";
import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, getFriendlyAuthErrorMessage } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/";
  const { signInWithEmail, signInWithGoogle, isConfigured, resendVerificationEmail, signOutUser } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Unverified state
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError(null);
    setUnverifiedEmail(null);
    setLoading(true);

    try {
      const loggedUser = await signInWithEmail(email, password);

      // Check if email is verified
      if (!loggedUser.emailVerified) {
        setUnverifiedEmail(loggedUser.email || email.trim());
        // Sign out to prevent unverified active session
        await signOutUser();
        return;
      }

      router.push(returnTo);
    } catch (err: unknown) {
      setError(getFriendlyAuthErrorMessage(err, "Failed to sign in. Please verify your email and password."));
    } finally {
      setLoading(false);
    }
  };

  const handleResendFromLogin = async () => {
    if (!unverifiedEmail || resendCooldown > 0 || resending) return;
    setResending(true);
    setError(null);

    try {
      await resendVerificationEmail(null, unverifiedEmail, password);
      setResendCooldown(60);
      showToast({
        title: "Verification email resent!",
        description: `A new link has been dispatched to ${unverifiedEmail}.`,
      });
    } catch (err) {
      setError(getFriendlyAuthErrorMessage(err, "Failed to resend verification email. Please try again shortly."));
    } finally {
      setResending(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setUnverifiedEmail(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push(returnTo);
    } catch (err: unknown) {
      setError(getFriendlyAuthErrorMessage(err, "Google sign-in could not be completed."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-sm flex-col px-4 py-16 sm:py-24">
      <div className="rounded-xl border border-white/[0.08] bg-surface p-6 sm:p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-xl font-bold tracking-tight text-foreground">Sign In</h1>
          <p className="mt-1 text-xs text-muted">Access your personalized library and synced watch history.</p>
        </div>

        {!isConfigured && (
          <div className="mb-5 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
            <p className="font-medium">Firebase credentials needed</p>
            <p className="mt-0.5 text-[11px] text-amber-200/80">
              Add your <code className="rounded bg-amber-500/20 px-1 py-0.5 text-amber-300">NEXT_PUBLIC_FIREBASE_*</code> keys to <code className="rounded bg-amber-500/20 px-1 py-0.5 text-amber-300">.env.local</code> to activate cloud authentication.
            </p>
          </div>
        )}

        {/* Unverified Email Warning Notice */}
        {unverifiedEmail && (
          <div className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200">
            <div className="flex items-center gap-2 font-semibold text-amber-300">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Email verification required</span>
            </div>
            <p className="mt-1.5 leading-relaxed text-amber-200/90 text-[11px]">
              Please verify your email address before using this feature. Check your inbox for the link sent to <strong className="text-white">{unverifiedEmail}</strong>.
            </p>
            <button
              type="button"
              onClick={handleResendFromLogin}
              disabled={resendCooldown > 0 || resending}
              className="mt-3 inline-flex items-center rounded-md bg-amber-500/20 px-3 py-1.5 text-[11px] font-semibold text-amber-200 border border-amber-500/30 hover:bg-amber-500/30 transition-colors disabled:opacity-50"
            >
              {resending
                ? "Sending link..."
                : resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : "Resend Verification Email"}
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
            {error}
          </div>
        )}

        {/* Option 1: Continue with Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-white/[0.1] bg-surface-2 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-white/[0.05] disabled:opacity-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/[0.06]" />
          <span className="text-[11px] text-muted">or sign in with email</span>
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>

        {/* Option 2: Sign in with Email */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="w-full rounded-md border border-white/[0.08] bg-surface-2 px-3 py-2 text-xs text-foreground placeholder:text-muted/50 outline-none focus:border-white/[0.2]"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs font-medium text-muted">Password</label>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-md border border-white/[0.08] bg-surface-2 px-3 py-2 text-xs text-foreground placeholder:text-muted/50 outline-none focus:border-white/[0.2]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-accent py-2.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in to account"}
          </button>
        </form>

        <div className="mt-6 border-t border-white/[0.06] pt-4 text-center text-xs text-muted">
          Don&apos;t have an account?{" "}
          <Link
            href={`/signup?returnTo=${encodeURIComponent(returnTo)}`}
            className="font-medium text-foreground hover:underline"
          >
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
