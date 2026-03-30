import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AMORIO - Connect Through Shared Moments",
  description:
    "Random video calls that turn into real friendships. No usernames, no spam — just authentic connections through shared moments.",
  keywords: [
    "video chat",
    "random calls",
    "make friends",
    "social app",
    "video matching",
  ],
  authors: [{ name: "AMORIO" }],
  openGraph: {
    title: "AMORIO - Connect Through Shared Moments",
    description:
      "Random video calls that turn into real friendships. No usernames, no spam — just authentic connections.",
    type: "website",
    locale: "en_US",
    siteName: "AMORIO",
  },
  twitter: {
    card: "summary_large_image",
    title: "AMORIO - Connect Through Shared Moments",
    description:
      "Random video calls that turn into real friendships. No usernames, no spam.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
