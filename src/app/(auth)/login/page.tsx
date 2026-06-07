import { Suspense } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in — Synerix Studio" };

// TEMP dev-only bypass entry point. Only renders when the same conditions that
// activate the server-side DEV_AUTH_BYPASS (src/lib/auth.ts) are met, so it can
// never appear in production. Remove once Google auth is set up.
const SHOW_DEV_BYPASS =
  process.env.NODE_ENV !== "production" && process.env.DEV_AUTH_BYPASS === "1";

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">Synerix</p>
          <h1 className="mt-1 font-display text-4xl">Studio</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Ad creatives for your business, from your real products
          </p>
        </div>
        <Card>
          <CardContent className="py-2">
            <Suspense>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>
        {SHOW_DEV_BYPASS && (
          <div className="mt-4 rounded-md border border-dashed border-muted-foreground/40 p-3 text-center">
            <Link
              href="/dashboard"
              className={buttonVariants({ variant: "secondary", size: "lg", className: "w-full" })}
            >
              Skip sign-in (dev) →
            </Link>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Temporary auth bypass — enters the seeded dev workspace. Not shown in production.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
