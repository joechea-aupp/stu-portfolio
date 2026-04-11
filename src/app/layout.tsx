import type { Metadata } from "next";
import { Oswald, Source_Sans_3 } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

const headingFont = Oswald({
  variable: "--font-heading",
  subsets: ["latin"],
});

const bodyFont = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Student Portfolio Directory",
  description: "A bold portfolio directory interface for discovering student talent.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${headingFont.variable} ${bodyFont.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
