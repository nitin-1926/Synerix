"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { signInWithGoogle } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const params = useSearchParams();
  const next = params?.get("next") ?? "/dashboard";
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleGoogle() {
    setError(null);
    startTransition(async () => {
      try {
        await signInWithGoogle(next);
      } catch (e) {
        // next-auth redirects throw internally; real failures land here.
        if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) throw e;
        setError("Sign-in failed. Please try again.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={handleGoogle}
        disabled={pending}
        variant="outline"
        className="w-full"
        size="lg"
      >
        <svg viewBox="0 0 24 24" className="mr-2 size-4" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
          <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.1V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.16-3.16A11 11 0 0 0 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38Z" />
        </svg>
        {pending ? "Redirecting…" : "Continue with Google"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Synerix Studio is invite-only. Sign in with the email your invite was sent to.
      </p>
      {error && <p className="text-center text-sm text-destructive">{error}</p>}
    </div>
  );
}
