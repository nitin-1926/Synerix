import { Suspense } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in | Synerix Studio" };

// TEMP dev-only bypass entry point. Only renders when the same conditions that
// activate the server-side DEV_AUTH_BYPASS (src/lib/auth.ts) are met, so it can
// never appear in production. Remove once Google auth is set up.
const SHOW_DEV_BYPASS =
  process.env.NODE_ENV !== "production" && process.env.DEV_AUTH_BYPASS === "1";

export default function LoginPage() {
  return (
    <>
      <div className="mb-10">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">Synerix</p>
        <h1 className="mt-2 font-display text-4xl">Sign in to Studio</h1>
        {/* The desktop brand panel carries the tagline; mobile has no panel. */}
        <p className="mt-3 text-sm text-muted-foreground lg:hidden">
          Ad creatives for your business, from your real products
        </p>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
      {SHOW_DEV_BYPASS && (
        <div className="mt-10 rounded-2xl border border-dashed border-muted-foreground/40 p-3 text-center">
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "secondary", size: "lg", className: "w-full" })}
          >
            Skip sign-in (dev) →
          </Link>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Temporary auth bypass. Enters the seeded dev workspace. Not shown in production.
          </p>
        </div>
      )}
    </>
  );
}
