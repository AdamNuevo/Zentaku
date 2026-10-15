"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

type PromptOptions = {
  returnTo?: string;
  title?: string;
  message?: string;
};

type AuthPromptContextType = {
  isOpen: boolean;
  options: PromptOptions;
  openAuthPrompt: (opts?: PromptOptions) => void;
  closeAuthPrompt: () => void;
};

const AuthPromptContext = createContext<AuthPromptContextType>({
  isOpen: false,
  options: {},
  openAuthPrompt: () => {},
  closeAuthPrompt: () => {},
});

export function AuthPromptProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<PromptOptions>({});

  const openAuthPrompt = useCallback((opts?: PromptOptions) => {
    setOptions(opts || {});
    setIsOpen(true);
  }, []);

  const closeAuthPrompt = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      options,
      openAuthPrompt,
      closeAuthPrompt,
    }),
    [isOpen, options, openAuthPrompt, closeAuthPrompt]
  );

  return (
    <AuthPromptContext.Provider value={value}>
      {children}
    </AuthPromptContext.Provider>
  );
}

export function useAuthPrompt() {
  return useContext(AuthPromptContext);
}
