import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { AuthProvider } from "@/lib/auth-context";
import { BusinessUnitProvider } from "@/lib/business-unit";
import { LanguageProvider } from "@/lib/i18n";
import { THEME_INIT_SCRIPT } from "@/lib/theme-script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RVE Finance",
  description: "Sistem akuntansi internal RVE",
  icons: { icon: "/logo-mark.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: THEME_INIT_SCRIPT adds the `dark` class before React
    // hydrates, which would otherwise be reported as a className mismatch.
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full bg-zinc-50 text-zinc-900">
        <LanguageProvider>
          <BusinessUnitProvider>
            <AuthProvider>
              <AppShell>{children}</AppShell>
            </AuthProvider>
          </BusinessUnitProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
