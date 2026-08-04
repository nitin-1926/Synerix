"use client";

import { useEffect } from "react";

// Root error boundary: catches render crashes that escape every route-level
// boundary and must render its own <html>/<body>.
//
// No error-reporting SDK is wired in. Sentry was removed while still inert — no
// DSN had ever been set, so it reported nothing while costing 90 MB — and
// PostHog is the intended replacement. Until then the digest below is the link
// to the full server-side stack in the Vercel runtime logs.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error.digest ?? "", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 font-sans">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <button
          onClick={reset}
          className="rounded-full border px-5 py-2 text-sm font-medium hover:bg-neutral-100"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
