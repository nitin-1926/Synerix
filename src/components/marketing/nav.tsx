"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "/consulting", label: "Consulting" },
  { href: "/synerix-studio", label: "Synerix Studio" },
  { href: "/tests/business-health", label: "Health Check" },
];

export function MarketingNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  // Dark-hero pages get a transparent-over-ink nav; paper pages a paper nav.
  const darkHero = pathname === "/" || pathname === "/synerix-studio";
  const onInk = darkHero && !scrolled && !open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        onInk
          ? "bg-transparent"
          : "border-b border-mk-line bg-mk-paper/90 backdrop-blur-md"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Synerix">
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
          <span className={`hidden text-[10px] tracking-[0.2em] uppercase sm:inline ${onInk ? "text-mk-mist" : "text-mk-slate"}`}>
            Synergy for Vertex
          </span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
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
          <Link
            href="/login"
            className="rounded-full bg-mk-cyan px-4.5 py-2 text-[13px] font-semibold text-mk-ink transition hover:bg-mk-cyan-bright"
          >
            Get started
          </Link>
        </div>

        <button
          className={`md:hidden ${onInk ? "text-white" : "text-mk-ink"}`}
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-b border-mk-line bg-mk-paper px-5 pb-6 pt-2 md:hidden">
          <div className="flex flex-col gap-4">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm font-medium text-mk-ink">
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex items-center gap-3">
              <Link
                href="/login"
                className="flex-1 rounded-full border border-mk-line px-4 py-2.5 text-center text-sm font-medium text-mk-ink"
              >
                Sign in
              </Link>
              <Link
                href="/login"
                className="flex-1 rounded-full bg-mk-cyan px-4 py-2.5 text-center text-sm font-semibold text-mk-ink"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
