"use client";

import { useState } from "react";
import { SignIn, SignUp } from "@stackframe/stack";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "signin" | "signup";
}

export function AuthModal({ isOpen, onClose, defaultMode = "signin" }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">(defaultMode);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "signin" ? "Sign In" : "Sign Up"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {mode === "signin" ? (
            <SignIn />
          ) : (
            <SignUp />
          )}
          <div className="text-center">
            <Button 
              variant="ghost" 
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-sm"
            >
              {mode === "signin" 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
