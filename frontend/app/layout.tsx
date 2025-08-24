import type { Metadata } from "next";
import "./globals.css";
import { StackAuthProvider } from "@/components/StackAuthProvider";

export const metadata: Metadata = {
  title: "Clixen AI - Automated B2B Lead Generation",
  description: "AI-powered platform for automated B2B lead generation and customer acquisition",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <StackAuthProvider>
          {children}
        </StackAuthProvider>
      </body>
    </html>
  );
}
