"use client";

import Link from "next/link";
import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, getFriendlyAuthErrorMessage } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/";
  const { signUpWithEmail, signInWithGoogle, isConfigured, resendVerificationEmail } = useAuth();
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verification state after successful account creation
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = displayName.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setError("Please enter your name or username.");
      return;
    }
    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError("Please enter a valid email address (e.g. name@example.com).");
      return;
    }
    if (!password) {
      setError("Please enter a password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify your password confirmation.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await signUpWithEmail(cleanEmail, password, cleanName);
      setRegisteredEmail(res.email);
      showToast({
        title: "Account created!",
        description: "We've sent a verification email to your email address.",
      });
    } catch (err: unknown) {
      setError(getFriendlyAuthErrorMessage(err, "Failed to create your account. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!registeredEmail || resendCooldown > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      await resendVerificationEmail(null, registeredEmail, password);
      setResendCooldown(60);
      showToast({
        title: "Verification email resent!",
        description: `A new link has been dispatched to ${registeredEmail}.`,
      });
    } catch (err) {
      setError(getFriendlyAuthErrorMessage(err, "Could not resend email right now. Please try again shortly."));
    } finally {
      setResending(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push(returnTo);
    } catch (err: unknown) {
      setError(getFriendlyAuthErrorMessage(err, "Google sign-in was not completed."));
    } finally {
      setLoading(false);
    }
  };

  // If account was created, show the dedicated verification step
  if (registeredEmail) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-col px-4 py-16 sm:py-24">
        <div className="rounded-xl border border-white/[0.08] bg-surface p-6 sm:p-8 shadow-sm">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Verify Your Email
          </h1>

          <div className="mt-3 rounded-lg border border-accent/20 bg-accent/5 p-3.5 text-xs text-foreground/90">
            <p className="font-semibold text-accent">Account created successfully</p>
            <p className="mt-1 leading-relaxed text-muted">
              Your account has been created. Please check your email and verify your account before continuing.
            </p>
            <p className="mt-2 text-[11px] font-mono text-muted/80 break-all">
              Verification sent to: <strong className="text-foreground">{registeredEmail}</strong>
            </p>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
              {error}
            </div>
          )}

          <div className="mt-6 space-y-3">
            <Link
              href={`/login?returnTo=${encodeURIComponent(returnTo)}`}
              className="flex w-full items-center justify-center rounded-md bg-accent py-2.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover shadow-sm"
            >
              Proceed to Sign In
            </Link>

            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || resending}
              className="w-full rounded-md border border-white/[0.1] bg-surface-2 py-2 text-xs font-medium text-foreground transition-colors hover:bg-white/[0.05] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending
                ? "Sending link..."
                : resendCooldown > 0
                ? `Resend available in ${resendCooldown}s`
                : "Resend Verification Email"}
            </button>
          </div>

          <p className="mt-4 text-center text-[11px] text-muted">
            Didn&apos;t see the email? Remember to check your spam or junk folder.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-col px-4 py-16 sm:py-24">
      <div className="rounded-xl border border-white/[0.08] bg-surface p-6 sm:p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-xl font-bold tracking-tight text-foreground">Create Account</h1>
          <p className="mt-1 text-xs text-muted">Join Zentaku to track your watchlist and sync your library across devices.</p>
        </div>

        {!isConfigured && (
          <div className="mb-5 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
            <p className="font-medium">Firebase credentials needed</p>
            <p className="mt-0.5 text-[11px] text-amber-200/80">
              Add your <code className="rounded bg-amber-500/20 px-1 py-0.5 text-amber-300">NEXT_PUBLIC_FIREBASE_*</code> keys to <code className="rounded bg-amber-500/20 px-1 py-0.5 text-amber-300">.env.local</code> to activate cloud accounts.
            </p>
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
          onClick={handleGoogleSignup}
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
          <span className="text-[11px] text-muted">or sign up with email</span>
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>

        {/* Option 2: Sign up with Email */}
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Username or Display Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. AnimeEnthusiast"
              required
              className="w-full rounded-md border border-white/[0.08] bg-surface-2 px-3 py-2 text-xs text-foreground placeholder:text-muted/50 outline-none focus:border-white/[0.2]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Email address <span className="text-rose-400">*</span>
            </label>
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
            <label className="mb-1 block text-xs font-medium text-muted">
              Password <span className="text-rose-400">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              className="w-full rounded-md border border-white/[0.08] bg-surface-2 px-3 py-2 text-xs text-foreground placeholder:text-muted/50 outline-none focus:border-white/[0.2]"
            />
            <p className="mt-1 text-[10px] text-muted/70">
              Must be at least 6 characters.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Confirm Password <span className="text-rose-400">*</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
              minLength={6}
              className="w-full rounded-md border border-white/[0.08] bg-surface-2 px-3 py-2 text-xs text-foreground placeholder:text-muted/50 outline-none focus:border-white/[0.2]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-accent py-2.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign up with Email"}
          </button>
        </form>

        <div className="mt-6 border-t border-white/[0.06] pt-4 text-center text-xs text-muted">
          Already have an account?{" "}
          <Link
            href={`/login?returnTo=${encodeURIComponent(returnTo)}`}
            className="font-medium text-foreground hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
