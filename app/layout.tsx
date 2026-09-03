import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import localFont from "next/font/local";

import "./globals.css";

const customFont = localFont({
  src: [
    {
      path: "../public/fonts/digital-clock.ttf",
    },
  ],
  variable: "--font-clock",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Study Planner",
  description: "Rencanakan belajar lebih cerdas dengan AI Study Planner.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`scroll-smooth ${geistSans.variable} ${geistMono.variable} ${customFont.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div
            aria-hidden
            className="ambient-orbs pointer-events-none fixed inset-0 z-[-1] bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.18),transparent_42%),radial-gradient(circle_at_80%_0%,hsl(var(--accent)/0.22),transparent_36%),radial-gradient(circle_at_70%_80%,hsl(var(--primary)/0.12),transparent_40%)]"
          />

          <div className="fixed right-5 bottom-5 z-100">
            <ThemeToggle />
          </div>
          {children}
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
