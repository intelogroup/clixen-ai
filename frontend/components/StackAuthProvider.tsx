"use client";

import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "@/stack";

export function StackAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <StackProvider app={stackServerApp}>
      <StackTheme>
        {children}
      </StackTheme>
    </StackProvider>
  );
}
