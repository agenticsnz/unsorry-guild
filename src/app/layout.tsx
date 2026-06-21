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
const ogImageUrl = `${siteUrl}/og-image.jpg`;
const description = 'Engagement layer for the unsorry theorem-proving swarm — prizes, leaderboards, and badges.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "unsorry-guild",
    template: "%s",
  },
  description,
  openGraph: {
    type: 'website',
    siteName: 'unsorry-guild',
    title: 'unsorry-guild',
    description,
    url: siteUrl,
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: 'unsorry-guild',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'unsorry-guild',
    description,
    images: [ogImageUrl],
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
