import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trace3 Analytics Dashboard",
  description: "Real-time game day analytics dashboard for attendance, concessions, and parking metrics at Ford Field.",
  keywords: "Trace3, Analytics, NFL, Detroit Lions, Ford Field, Stadium Operations",
  authors: [{ name: "Trace3" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#1E1B4B", // Deep indigo color matching our dashboard theme
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Analytics />
        {children}
      </body>
    </html>
  );
}
