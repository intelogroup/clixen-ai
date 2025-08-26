import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "@/stack";

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
  return (
    <html lang="en">
      <body className={inter.className}>
        <StackProvider app={stackServerApp}>
          <StackTheme>
            {children}
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  );
}
