import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Oswald, Source_Sans_3 } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { SESSION_COOKIE_NAME } from "@/lib/auth-session";
import { APP_BASE_URL, APP_NAME } from "@/lib/app-config";
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
  metadataBase: new URL(APP_BASE_URL),
  title: APP_NAME,
  description: "A bold portfolio directory interface for discovering student talent.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialKnownSession = Boolean(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  return (
    <html
      lang="en"
      className={`${headingFont.variable} ${bodyFont.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AppShell initialKnownSession={initialKnownSession}>{children}</AppShell>
      </body>
    </html>
  );
}
