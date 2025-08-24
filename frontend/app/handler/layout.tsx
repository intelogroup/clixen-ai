"use client";

import { StackAuthProvider } from "@/components/StackAuthProvider";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StackAuthProvider>
      {children}
    </StackAuthProvider>
  );
}
