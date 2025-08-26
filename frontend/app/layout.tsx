import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { neonAuth } from "@/lib/neon-auth";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Clixen AI - AI-Powered Automation Through Telegram",
  description: "Access powerful automation workflows through our Telegram bot. Get weather updates, scan emails, translate text, and more - all through natural language commands.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  console.log('RootLayout rendering with environment:', {
    NODE_ENV: process.env.NODE_ENV,
    hasStackProjectId: !!process.env.NEXT_PUBLIC_STACK_PROJECT_ID,
    hasStackClientKey: !!process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY
  });

  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <StackProvider app={neonAuth}>
            <StackTheme>
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </StackTheme>
          </StackProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
