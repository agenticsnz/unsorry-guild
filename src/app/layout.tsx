import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/providers/theme-provider";
import { NotificationProvider } from "@/providers/notification-provider";
import { PendingActionProvider } from "@/providers/pending-action-provider";
import { DynamicFavicon } from "@/components/dynamic-favicon";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://swarm.unsorry.agentics.org.nz';
const description = 'Engagement layer for the unsorry theorem-proving swarm — live leaderboards, goals, and badges.';

// The social preview image is generated from the live proofs-over-time graph via
// the file-based `opengraph-image`/`twitter-image` conventions (ADR-026, #13), so
// no explicit `images` are set here — that would override the generated ones.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "unsorry swarm",
    template: "%s",
  },
  description,
  openGraph: {
    type: 'website',
    siteName: 'unsorry swarm',
    title: 'unsorry swarm',
    description,
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'unsorry swarm',
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <DynamicFavicon />
        <ThemeProvider defaultTheme="dark">
          <QueryProvider>
            <AuthProvider>
              <PendingActionProvider>
                <NotificationProvider>{children}</NotificationProvider>
              </PendingActionProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
