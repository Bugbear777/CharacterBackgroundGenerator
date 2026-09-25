"use client";

import { FormEvent, useState } from "react";
import { ScrollText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AuthMode = "login" | "register";

type AuthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: AuthMode;
};

export function AuthDialog({
  open,
  onOpenChange,
  initialMode = "login",
}: AuthDialogProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLogin = mode === "login";

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(undefined);
    setPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(undefined);

    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }

    if (!password) {
      setError("Enter your password.");
      return;
    }

    if (!isLogin) {
      if (!displayName.trim()) {
        setError("Enter a display name.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    try {
      setIsSubmitting(true);

      if (isLogin) {
        // TODO: Connect to POST /api/auth/login
        console.log("Login", {
          email,
          password,
        });
      } else {
        // TODO: Connect to POST /api/auth/register
        console.log("Register", {
          displayName,
          email,
          password,
        });
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-2 flex items-center gap-2 text-primary">
            <ScrollText className="h-5 w-5" />
            <span className="text-sm font-semibold">Lorebound</span>
          </div>

          <DialogTitle>
            {isLogin ? "Welcome Back" : "Create Account"}
          </DialogTitle>

          <DialogDescription>
            {isLogin
              ? "Log in to continue building your settings and characters."
              : "Create your Lorebound account to begin building worlds and characters."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="displayName">
                Display Name
              </Label>

              <Input
                id="displayName"
                value={displayName}
                onChange={(event) =>
                  setDisplayName(event.target.value)
                }
                autoComplete="name"
                placeholder="Your name"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">
              Email
            </Label>

            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Password
            </Label>

            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              autoComplete={
                isLogin
                  ? "current-password"
                  : "new-password"
              }
            />
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirm Password
              </Label>

              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                autoComplete="new-password"
              />
            </div>
          )}

          {error && (
            <div className="border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Please Wait..."
              : isLogin
                ? "Log In"
                : "Create Account"}
          </Button>
        </form>

        <div className="border-t border-border pt-4 text-center text-sm text-muted-foreground">
          {isLogin ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("register")}
                className="font-medium text-primary hover:underline"
              >
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="font-medium text-primary hover:underline"
              >
                Log in
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}