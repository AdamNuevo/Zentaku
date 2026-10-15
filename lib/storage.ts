import { useSyncExternalStore } from "react";
import { auth, db } from "./firebase";
import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  getDocs,
  type Unsubscribe,
} from "firebase/firestore";
import type { User } from "firebase/auth";

export type WatchHistoryItem = {
  animeId: string;
  title: string;
  poster: string;
  episodeNumber: number;
  totalEpisodes?: number;
  updatedAt: number;
};

export type WatchlistItem = {
  id: string;
  type: "anime" | "manga";
  title: string;
  poster: string;
  genre?: string;
  addedAt: number;
};

const HISTORY_KEY = "zentaku_continue_watching";
const WATCHLIST_KEY = "zentaku_watchlist";

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("zentaku_storage_update"));
  } catch {
    // ignore storage quota errors
  }
}

export function getWatchHistory(): WatchHistoryItem[] {
  return safeGet<WatchHistoryItem[]>(HISTORY_KEY, []);
}

export function recordWatchProgress(item: Omit<WatchHistoryItem, "updatedAt">): void {
  const current = getWatchHistory();
  const filtered = current.filter((h) => h.animeId !== item.animeId);
  const updated: WatchHistoryItem = {
    ...item,
    updatedAt: Date.now(),
  };
  const list = [updated, ...filtered].slice(0, 15);
  safeSet(HISTORY_KEY, list);

  // Sync to Firestore if authenticated
  if (auth?.currentUser && db) {
    const userRef = doc(db, "users", auth.currentUser.uid, "history", item.animeId);
    setDoc(userRef, updated, { merge: true }).catch(() => {});
  }
}

export function removeWatchHistory(animeId: string): void {
  const current = getWatchHistory();
  const list = current.filter((h) => h.animeId !== animeId);
  safeSet(HISTORY_KEY, list);

  // Sync delete to Firestore if authenticated
  if (auth?.currentUser && db) {
    const userRef = doc(db, "users", auth.currentUser.uid, "history", animeId);
    deleteDoc(userRef).catch(() => {});
  }
}

export function getWatchlist(): WatchlistItem[] {
  if (!auth?.currentUser) return [];
  return safeGet<WatchlistItem[]>(WATCHLIST_KEY, []);
}

export function isInWatchlist(id: string): boolean {
  if (!auth?.currentUser) return false;
  const current = getWatchlist();
  return current.some((w) => w.id === id);
}

export function toggleWatchlist(item: Omit<WatchlistItem, "addedAt">): boolean {
  if (!auth?.currentUser) {
    return false;
  }
  const current = getWatchlist();
  const exists = current.some((w) => w.id === item.id);
  let updated: WatchlistItem[];
  if (exists) {
    updated = current.filter((w) => w.id !== item.id);
    if (db) {
      const docRef = doc(db, "users", auth.currentUser.uid, "watchlist", String(item.id));
      deleteDoc(docRef).catch(() => {});
    }
  } else {
    const newItem: WatchlistItem = { ...item, addedAt: Date.now() };
    updated = [newItem, ...current];
    if (db) {
      const docRef = doc(db, "users", auth.currentUser.uid, "watchlist", String(item.id));
      setDoc(docRef, newItem, { merge: true }).catch(() => {});
    }
  }
  safeSet(WATCHLIST_KEY, updated);
  return !exists;
}

/**
 * Initializes synchronization from Firestore when a user signs in.
 */
export function initFirestoreSync(user: User | null): () => void {
  if (!user || !db) return () => {};

  const firestore = db;
  const unsubs: Unsubscribe[] = [];

  try {
    const uid = user.uid;

    // 1. Sync Watchlist Collection from Cloud only
    const watchlistCol = collection(firestore, "users", uid, "watchlist");

    // Subscribe to cloud changes
    const unsubWatchlist = onSnapshot(watchlistCol, (snapshot) => {
      const items: WatchlistItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as WatchlistItem;
        if (data && data.id) items.push(data);
      });
      items.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
      safeSet(WATCHLIST_KEY, items);
    }, () => {});
    unsubs.push(unsubWatchlist);

    // 2. Sync History Collection
    const historyCol = collection(firestore, "users", uid, "history");
    const unsubHistory = onSnapshot(historyCol, (snapshot) => {
      const items: WatchHistoryItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as WatchHistoryItem;
        if (data && data.animeId) items.push(data);
      });
      items.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      safeSet(HISTORY_KEY, items.slice(0, 15));
    }, () => {});
    unsubs.push(unsubHistory);

  } catch (err) {
    console.error("Firestore sync init error:", err);
  }

  return () => {
    unsubs.forEach((unsub) => unsub());
  };
}

// React 19 idiomatic hooks using useSyncExternalStore with static server snapshots
function subscribeStorage(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("zentaku_storage_update", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("zentaku_storage_update", callback);
    window.removeEventListener("storage", callback);
  };
}

let cachedWatchlist: WatchlistItem[] = [];
let cachedWatchlistRaw = "";
const EMPTY_WATCHLIST: WatchlistItem[] = [];
const getServerWatchlistSnapshot = () => EMPTY_WATCHLIST;

function getWatchlistSnapshot(): WatchlistItem[] {
  if (typeof window === "undefined") return EMPTY_WATCHLIST;
  const raw = localStorage.getItem(WATCHLIST_KEY) ?? "";
  if (raw !== cachedWatchlistRaw) {
    cachedWatchlistRaw = raw;
    cachedWatchlist = safeGet<WatchlistItem[]>(WATCHLIST_KEY, []);
  }
  return cachedWatchlist;
}

export function useWatchlist(): WatchlistItem[] {
  return useSyncExternalStore(
    subscribeStorage,
    getWatchlistSnapshot,
    getServerWatchlistSnapshot
  );
}

let cachedHistory: WatchHistoryItem[] = [];
let cachedHistoryRaw = "";
const EMPTY_HISTORY: WatchHistoryItem[] = [];
const getServerHistorySnapshot = () => EMPTY_HISTORY;

function getHistorySnapshot(): WatchHistoryItem[] {
  if (typeof window === "undefined") return EMPTY_HISTORY;
  const raw = localStorage.getItem(HISTORY_KEY) ?? "";
  if (raw !== cachedHistoryRaw) {
    cachedHistoryRaw = raw;
    cachedHistory = safeGet<WatchHistoryItem[]>(HISTORY_KEY, []);
  }
  return cachedHistory;
}

export function useWatchHistory(): WatchHistoryItem[] {
  return useSyncExternalStore(
    subscribeStorage,
    getHistorySnapshot,
    getServerHistorySnapshot
  );
}

const AVATAR_KEY = "zentaku_custom_avatar";

export function getCustomAvatar(): string | null {
  return safeGet<string | null>(AVATAR_KEY, null);
}

export function setCustomAvatar(url: string | null): void {
  safeSet(AVATAR_KEY, url);
  if (auth?.currentUser && db && url) {
    const userDoc = doc(db, "users", auth.currentUser.uid);
    setDoc(userDoc, { photoURL: url }, { merge: true }).catch(() => {});
  }
}

let cachedAvatar: string | null = null;
let cachedAvatarRaw = "";
const getServerAvatarSnapshot = () => null;

function getAvatarSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(AVATAR_KEY) ?? "";
  if (raw !== cachedAvatarRaw) {
    cachedAvatarRaw = raw;
    cachedAvatar = safeGet<string | null>(AVATAR_KEY, null);
  }
  return cachedAvatar;
}

export function useCustomAvatar(): string | null {
  return useSyncExternalStore(
    subscribeStorage,
    getAvatarSnapshot,
    getServerAvatarSnapshot
  );
}

/**
 * Completely clears local storage data when user signs out,
 * ensuring no private watchlist or history leaks into guest session.
 */
export function clearUserData(): void {
  safeSet(WATCHLIST_KEY, []);
  safeSet(HISTORY_KEY, []);
  safeSet(AVATAR_KEY, null);
  cachedWatchlist = [];
  cachedWatchlistRaw = "";
  cachedHistory = [];
  cachedHistoryRaw = "";
  cachedAvatar = null;
  cachedAvatarRaw = "";
}


