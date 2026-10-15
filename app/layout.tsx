import type { Metadata, Viewport } from "next";
import { Outfit, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/lib/toast-context";
import { Toast } from "@/components/Toast";
import { AuthPromptProvider } from "@/lib/auth-prompt-context";
import { AuthPromptModal } from "@/components/AuthPromptModal";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const notoJp = Noto_Sans_JP({
  variable: "--font-noto-jp",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Zentaku — Anime & Manga Platform",
    template: "%s | Zentaku",
  },
  description: "A calm, editorial anime discovery platform and manga reader.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0d0f12",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${outfit.variable} ${notoJp.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col bg-background text-foreground overflow-x-hidden selection:bg-accent/20 selection:text-white"
        suppressHydrationWarning
      >
        <AuthProvider>
          <AuthPromptProvider>
            <ToastProvider>
              <Navbar />
              <div className="flex flex-1 flex-col overflow-x-hidden pb-16 md:pb-0">{children}</div>
              <BottomNav />
              <Toast />
              <AuthPromptModal />
            </ToastProvider>
          </AuthPromptProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
