"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ToastAction = {
  label: string;
  href: string;
};

export type ToastMessage = {
  id: number;
  title: string;
  description?: string;
  action?: ToastAction;
};

type ToastContextType = {
  toast: ToastMessage | null;
  showToast: (toast: Omit<ToastMessage, "id">) => void;
  dismissToast: () => void;
};

const ToastContext = createContext<ToastContextType>({
  toast: null,
  showToast: () => {},
  dismissToast: () => {},
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((next: Omit<ToastMessage, "id">) => {
    setToast({ ...next, id: Date.now() });
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  const value = useMemo(
    () => ({ toast, showToast, dismissToast }),
    [toast, showToast, dismissToast]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  return useContext(ToastContext);
}
