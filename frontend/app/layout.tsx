import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clixen AI - Automated B2B Lead Generation",
  description: "AI-powered platform for automated B2B lead generation and customer acquisition",
};

// Lazy load Stack Auth components to avoid SSR issues
import dynamic from 'next/dynamic';

const StackProvider = dynamic(
  () => import("@stackframe/stack").then(mod => ({ default: mod.StackProvider })),
  { ssr: false }
);

const StackTheme = dynamic(
  () => import("@stackframe/stack").then(mod => ({ default: mod.StackTheme })),
  { ssr: false }
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <StackProvider app={undefined}>
          <StackTheme>
            {children}
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  );
}
