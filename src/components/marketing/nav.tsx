"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "/consulting", label: "Consulting" },
  { href: "/synerix-studio", label: "Synerix Studio" },
  { href: "/tests/business-health", label: "Health Check" },
];

// Studio is invite-only: the primary CTA is the same access request the Studio
// page uses, not /login (a new visitor there signs in only to be told to ask).
const ACCESS_HREF = "mailto:consulting.synerix@gmail.com?subject=Synerix%20Studio%20access";

export function MarketingNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // A sentinel pinned to the document top flips `scrolled` once it leaves the
  // viewport: no per-frame scroll listener.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  // Dark-hero pages get a transparent-over-ink nav; paper pages a paper nav.
  const darkHero = pathname === "/" || pathname === "/synerix-studio";
  const onInk = darkHero && !scrolled && !open;

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-2" />
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          onInk
            ? "bg-transparent"
            : "border-b border-mk-line bg-mk-paper/90 backdrop-blur-md"
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Synerix">
            <span className="flex size-9 items-center justify-center rounded-lg bg-white p-0.5 ring-1 ring-black/5">
              <Image
                src="/images/SynergyLogoCropped.png"
                alt="Synerix"
                width={36}
                height={36}
                priority
                unoptimized
                className="h-full w-auto"
              />
            </span>
            <span
              className={`mk-mono text-sm font-semibold ${onInk ? "text-white" : "text-mk-ink"}`}
            >
              Synerix
            </span>
            <span className={`hidden text-[10px] tracking-[0.2em] uppercase lg:inline ${onInk ? "text-mk-mist" : "text-mk-slate"}`}>
              Synergy for Vertex
            </span>
          </Link>

          <div className="hidden items-center gap-5 whitespace-nowrap md:flex lg:gap-7">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={pathname?.startsWith(l.href) ? "page" : undefined}
                className={`text-[13px] font-medium transition-colors ${
                  pathname?.startsWith(l.href)
                    ? onInk ? "text-mk-cyan-bright" : "text-mk-cyan-deep"
                    : onInk ? "text-mk-mist hover:text-white" : "text-mk-slate hover:text-mk-ink"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <span className={`h-4 w-px ${onInk ? "bg-mk-line-dark" : "bg-mk-line"}`} />
            <Link
              href="/login"
              className={`text-[13px] font-medium transition-colors ${onInk ? "text-mk-mist hover:text-white" : "text-mk-slate hover:text-mk-ink"}`}
            >
              Sign in
            </Link>
            <a
              href={ACCESS_HREF}
              className="rounded-full bg-mk-cyan px-4.5 py-2 text-[13px] font-semibold text-mk-ink transition hover:bg-mk-cyan-bright active:scale-[0.98]"
            >
              Request access
            </a>
          </div>

          <button
            type="button"
            className={`-mr-2 flex size-10 items-center justify-center md:hidden ${onInk ? "text-white" : "text-mk-ink"}`}
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </nav>

        {open && (
          <div className="border-b border-mk-line bg-mk-paper px-5 pb-6 pt-2 md:hidden">
            <div className="flex flex-col gap-1">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={pathname?.startsWith(l.href) ? "page" : undefined}
                  className="py-2.5 text-sm font-medium text-mk-ink"
                >
                  {l.label}
                </Link>
              ))}
              <div className="mt-3 flex items-center gap-3">
                <Link
                  href="/login"
                  className="flex-1 rounded-full border border-mk-line px-4 py-2.5 text-center text-sm font-medium text-mk-ink active:scale-[0.98]"
                >
                  Sign in
                </Link>
                <a
                  href={ACCESS_HREF}
                  className="flex-1 rounded-full bg-mk-cyan px-4 py-2.5 text-center text-sm font-semibold text-mk-ink active:scale-[0.98]"
                >
                  Request access
                </a>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
