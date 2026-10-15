"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "./firebase";
import { initFirestoreSync, setCustomAvatar, clearUserData } from "./storage";

export function getFriendlyAuthErrorMessage(err: unknown, fallback: string = "An authentication error occurred."): string {
  if (!err) return fallback;
  const msg = err instanceof Error ? err.message : String(err);
  
  if (msg.includes("email-already-in-use")) {
    return "An account with this email address already exists. Please log in instead.";
  }
  if (msg.includes("invalid-email")) {
    return "Please provide a valid email address (e.g. name@example.com).";
  }
  if (msg.includes("weak-password")) {
    return "Password is too weak. Please choose a password with at least 6 characters.";
  }
  if (msg.includes("user-not-found")) {
    return "No account found with this email address. Please check your spelling or create an account.";
  }
  if (msg.includes("wrong-password") || msg.includes("invalid-credential")) {
    return "Invalid email or password. Please check your credentials and try again.";
  }
  if (msg.includes("too-many-requests")) {
    return "Too many unsuccessful attempts. Access has been temporarily disabled. Please wait a moment and try again.";
  }
  if (msg.includes("account-exists-with-different-credential")) {
    return "An account already exists with this email using a different sign-in method. Please sign in with your original method.";
  }
  if (msg.includes("popup-closed-by-user")) {
    return "Sign in with Google was cancelled.";
  }
  if (msg.includes("network-request-failed")) {
    return "Network error. Please check your internet connection and try again.";
  }
  return msg || fallback;
}

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<User>;
  signUpWithEmail: (email: string, pass: string, displayName?: string) => Promise<{ user: User; email: string }>;
  resendVerificationEmail: (targetUser?: User | null, email?: string, pass?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  updateUserAvatar: (photoURL: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isConfigured: false,
  signInWithEmail: async () => { throw new Error("Unimplemented"); },
  signUpWithEmail: async () => { throw new Error("Unimplemented"); },
  resendVerificationEmail: async () => {},
  signInWithGoogle: async () => {},
  signOutUser: async () => {},
  updateUserAvatar: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isFirebaseConfigured();

  useEffect(() => {
    if (!configured || !auth) {
      clearUserData();
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        // Ensure guest session never has leftover authenticated watchlist
        clearUserData();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [configured]);

  useEffect(() => {
    const unsubSync = initFirestoreSync(user);
    return () => {
      if (unsubSync) unsubSync();
    };
  }, [user]);

  const signInWithEmail = async (email: string, pass: string): Promise<User> => {
    if (!configured || !auth) {
      throw new Error("Firebase is not configured. Please add your credentials to .env.local.");
    }
    const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return res.user;
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    displayName?: string
  ): Promise<{ user: User; email: string }> => {
    if (!configured || !auth) {
      throw new Error("Firebase is not configured. Please add your credentials to .env.local.");
    }
    const cleanEmail = email.trim();
    const res = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    
    if (displayName?.trim() && res.user) {
      await updateProfile(res.user, { displayName: displayName.trim() });
    }

    // Send verification email to the user
    try {
      await sendEmailVerification(res.user);
    } catch (verErr) {
      console.warn("sendEmailVerification warning:", verErr);
    }

    // Sign out immediately so account is not treated as verified active session
    await signOut(auth);
    clearUserData();
    setUser(null);

    return { user: res.user, email: cleanEmail };
  };

  const resendVerificationEmail = async (
    targetUser?: User | null,
    email?: string,
    pass?: string
  ): Promise<void> => {
    if (!configured || !auth) {
      throw new Error("Firebase is not configured.");
    }

    if (targetUser) {
      await sendEmailVerification(targetUser);
      return;
    }

    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
      return;
    }

    if (email && pass) {
      const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
      await sendEmailVerification(res.user);
      await signOut(auth);
      clearUserData();
      setUser(null);
      return;
    }

    throw new Error("Unable to resend verification without an active user or credentials.");
  };

  const signInWithGoogle = async () => {
    if (!configured || !auth || !googleProvider) {
      throw new Error("Firebase is not configured. Please add your credentials to .env.local.");
    }
    await signInWithPopup(auth, googleProvider);
  };

  const signOutUser = async () => {
    if (configured && auth) {
      await signOut(auth);
    }
    clearUserData();
    setUser(null);
  };

  const updateUserAvatar = async (photoURL: string) => {
    setCustomAvatar(photoURL);
    if (auth?.currentUser) {
      await updateProfile(auth.currentUser, { photoURL });
      setUser({ ...auth.currentUser, photoURL } as User);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isConfigured: configured,
        signInWithEmail,
        signUpWithEmail,
        resendVerificationEmail,
        signInWithGoogle,
        signOutUser,
        updateUserAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
