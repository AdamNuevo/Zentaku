"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useCustomAvatar } from "@/lib/storage";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from "firebase/firestore";

export type CommentRecord = {
  id: string;
  text: string;
  isAnonymous: boolean;
  userId: string | null;
  userName: string;
  userAvatar: string | null;
  createdAt: number;
};

type Props = {
  animeId?: string;
  episodeNumber?: number;
  animeTitle?: string;
};

function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return "Just now";
  const diff = Date.now() - timestamp;
  if (diff < 60000) return "Just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function CommentsSection({ animeId = "global", episodeNumber = 1, animeTitle }: Props) {
  const { user } = useAuth();
  const customAvatar = useCustomAvatar();

  const [draft, setDraft] = useState("");
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const lastSubmittedText = useRef<string>("");
  const storageKey = `zentaku_comments_${animeId}_ep_${episodeNumber}`;

  // Local fallback storage helper
  const getLocalComments = (): CommentRecord[] => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveLocalComments = (items: CommentRecord[]) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // ignore
    }
  };

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Load comments from Firestore (or fallback to local storage)
  useEffect(() => {
    if (!db) {
      setComments(getLocalComments());
      return;
    }

    try {
      const commentsCol = collection(
        db,
        "anime_discussions",
        animeId,
        "episodes",
        String(episodeNumber),
        "comments"
      );
      const q = query(commentsCol, orderBy("createdAt", "desc"), limit(50));

      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const loaded: CommentRecord[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            loaded.push({
              id: docSnap.id,
              text: data.text || "",
              isAnonymous: Boolean(data.isAnonymous),
              userId: data.userId || null,
              userName: data.userName || "Anonymous",
              userAvatar: data.userAvatar || null,
              createdAt: data.createdAt || Date.now(),
            });
          });
          setComments(loaded);
          saveLocalComments(loaded);
        },
        (err) => {
          console.warn("Firestore comments error, using local cache:", err);
          setComments(getLocalComments());
        }
      );

      return () => unsub();
    } catch (err) {
      console.warn("Failed to subscribe to comments:", err);
      setComments(getLocalComments());
    }
  }, [animeId, episodeNumber, storageKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanText = draft.trim();
    if (!cleanText) {
      setError("Please type a comment before posting.");
      return;
    }
    if (cleanText.length < 2) {
      setError("Comment is too short. Please type at least 2 characters.");
      return;
    }
    if (cleanText.length > 500) {
      setError("Comment cannot exceed 500 characters.");
      return;
    }
    if (cooldown > 0) {
      setError(`Please wait ${cooldown} seconds before posting another comment.`);
      return;
    }
    if (cleanText.toLowerCase() === lastSubmittedText.current.toLowerCase()) {
      setError("You just submitted this comment. Duplicate submissions are prevented.");
      return;
    }

    setSubmitting(true);

    const isAnon = !user;
    const resolvedName = user
      ? user.displayName || user.email?.split("@")[0] || "User"
      : "Anonymous";
    const resolvedAvatar = user
      ? customAvatar || user.photoURL || null
      : null;

    const newRecord: CommentRecord = {
      id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      text: cleanText,
      isAnonymous: isAnon,
      userId: isAnon ? null : user.uid,
      userName: resolvedName,
      userAvatar: resolvedAvatar,
      createdAt: Date.now(),
    };

    try {
      if (db) {
        const commentsCol = collection(
          db,
          "anime_discussions",
          animeId,
          "episodes",
          String(episodeNumber),
          "comments"
        );
        await addDoc(commentsCol, {
          text: newRecord.text,
          isAnonymous: newRecord.isAnonymous,
          userId: newRecord.userId,
          userName: newRecord.userName,
          userAvatar: newRecord.userAvatar,
          createdAt: newRecord.createdAt,
        });
      } else {
        // Fallback local update
        const updated = [newRecord, ...comments];
        setComments(updated);
        saveLocalComments(updated);
      }

      lastSubmittedText.current = cleanText;
      setDraft("");
      setCooldown(10); // 10-second spam protection cooldown
    } catch (err: unknown) {
      // Fallback to local storage on error
      const updated = [newRecord, ...comments];
      setComments(updated);
      saveLocalComments(updated);
      lastSubmittedText.current = cleanText;
      setDraft("");
      setCooldown(10);
    } finally {
      setSubmitting(false);
    }
  };

  const displayName = user
    ? user.displayName || user.email?.split("@")[0] || "User"
    : "Anonymous";
  const userPhoto = user?.photoURL || customAvatar;

  return (
    <section className="mt-8 rounded-xl border border-white/[0.08] bg-surface p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-white/[0.06] pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Episode {episodeNumber} Discussion
          </h3>
          {animeTitle && (
            <p className="text-[11px] text-muted truncate max-w-sm">
              {animeTitle}
            </p>
          )}
        </div>
        <span className="text-xs text-muted">
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </span>
      </div>

      {/* User State & Posting Status */}
      <div className="mt-4 flex items-center justify-between rounded-lg border border-white/[0.05] bg-surface-2/40 px-3.5 py-2 text-xs">
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {userPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={userPhoto}
                  alt=""
                  className="h-5 w-5 rounded-full object-cover [image-rendering:pixelated]"
                />
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                  {displayName[0]?.toUpperCase() || "U"}
                </div>
              )}
              <span className="text-muted">Commenting as</span>
              <strong className="text-foreground">{displayName}</strong>
              <span className="rounded bg-accent/20 px-1.5 py-0.2 text-[10px] font-semibold text-accent">
                Member
              </span>
            </>
          ) : (
            <>
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.08] text-muted">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <span className="text-muted">Commenting as</span>
              <strong className="text-foreground">Anonymous</strong>
              <span className="rounded bg-white/[0.08] px-1.5 py-0.2 text-[10px] font-medium text-muted">
                Guest
              </span>
            </>
          )}
        </div>

        {!user && (
          <Link
            href="/login"
            className="text-[11px] font-medium text-accent hover:underline"
          >
            Sign in to show username →
          </Link>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mt-3.5 space-y-2">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (error) setError(null);
            }}
            placeholder={
              user
                ? `Share your thoughts as ${displayName}...`
                : "Share your thoughts on this episode (posting as Anonymous)..."
            }
            maxLength={500}
            className="flex-1 rounded-md border border-white/[0.08] bg-surface-2 px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted/60 outline-none focus:border-white/[0.2]"
          />
          <button
            type="submit"
            disabled={!draft.trim() || submitting || cooldown > 0}
            className="rounded-md bg-accent px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {submitting
              ? "Posting..."
              : cooldown > 0
              ? `Wait (${cooldown}s)`
              : "Post Comment"}
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted">
          <span>
            {error ? (
              <span className="text-rose-400 font-medium">{error}</span>
            ) : (
              <span>No account required to join the conversation.</span>
            )}
          </span>
          <span>{draft.length}/500</span>
        </div>
      </form>

      {/* Comments List */}
      <div className="mt-6 space-y-3">
        {comments.map((comment) => {
          const isGuest = comment.isAnonymous || !comment.userId;

          return (
            <div
              key={comment.id}
              className={`rounded-lg border p-3.5 transition-colors ${
                isGuest
                  ? "border-white/[0.04] bg-surface-2/40"
                  : "border-accent/15 bg-accent/[0.02]"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  {/* User Avatar */}
                  {isGuest ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06] text-muted border border-white/[0.06]">
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                  ) : comment.userAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={comment.userAvatar}
                      alt=""
                      className="h-6 w-6 rounded-full object-cover border border-accent/30 [image-rendering:pixelated]"
                    />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white border border-accent/40">
                      {comment.userName[0]?.toUpperCase() || "U"}
                    </div>
                  )}

                  {/* Display Name */}
                  <span className="text-xs font-semibold text-foreground">
                    {comment.userName}
                  </span>

                  {/* Badge: Guest vs Member */}
                  {isGuest ? (
                    <span className="rounded bg-white/[0.06] px-1.5 py-0.2 text-[10px] font-medium text-muted/80">
                      Anonymous
                    </span>
                  ) : (
                    <span className="rounded bg-accent/20 px-1.5 py-0.2 text-[10px] font-semibold text-accent">
                      Member
                    </span>
                  )}
                </div>

                <span className="text-[10px] text-muted/70">
                  {formatRelativeTime(comment.createdAt)}
                </span>
              </div>

              {/* Text */}
              <p className="text-xs leading-relaxed text-muted/90 pl-8 break-words">
                {comment.text}
              </p>
            </div>
          );
        })}

        {comments.length === 0 && (
          <div className="rounded-lg border border-white/[0.04] bg-surface-2/20 py-8 text-center">
            <p className="text-xs text-muted/70">
              No comments yet on this episode. Be the first to share your thoughts!
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
