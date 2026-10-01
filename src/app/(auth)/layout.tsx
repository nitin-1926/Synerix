import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Shared shell for the sign-in surfaces: an ink-navy brand panel (marketing
 * mk-* palette) beside the form on desktop, the form alone on mobile.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh bg-background lg:grid-cols-2">
      <aside className="mk-hero-bg mk-grain relative hidden flex-col justify-between overflow-hidden bg-mk-ink p-12 text-white lg:flex xl:p-16">
        <p className="mk-mono text-xs text-mk-cyan">Synerix</p>
        <div className="max-w-md">
          <p className="font-display text-5xl leading-[1.08] text-balance">
            Ad creatives for your business, from your real products
          </p>
          <div className="mt-8 h-px w-16 bg-mk-cyan" aria-hidden />
        </div>
        <p className="text-sm text-mk-mist">Synerix Studio</p>
      </aside>
      <section className="relative flex items-center justify-center px-6 py-16 sm:px-10">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm">{children}</div>
      </section>
    </main>
  );
}
