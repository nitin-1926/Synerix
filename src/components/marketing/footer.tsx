import Image from "next/image";
import Link from "next/link";
import { WHATSAPP_URL } from "@/lib/contact";

export function MarketingFooter() {
  return (
    <footer className="relative overflow-hidden bg-mk-ink text-mk-mist mk-grain">
      <div className="mx-auto max-w-6xl px-5 pb-10 pt-16 md:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-white p-0.5 ring-1 ring-black/5">
                <Image
                  src="/images/SynergyLogoCropped.png"
                  alt="Synerix"
                  width={36}
                  height={36}
                  unoptimized
                  className="h-full w-auto"
                />
              </span>
              <p className="mk-mono text-sm font-semibold text-white">Synerix</p>
            </div>
            <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-mk-mist/70">
              Synergy for Vertex
            </p>
            <p className="mt-5 max-w-xs text-sm leading-relaxed">
              Business consulting and an AI creative studio, built for Indian small and
              medium businesses.
            </p>
          </div>
          <div>
            <p className="mk-mono text-[11px] text-mk-cyan">Offerings</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/consulting" className="transition-colors hover:text-white">Business consulting</Link></li>
              <li><Link href="/synerix-studio" className="transition-colors hover:text-white">Synerix Studio</Link></li>
              <li><Link href="/tests/business-health" className="transition-colors hover:text-white">Business Health Check</Link></li>
            </ul>
          </div>
          <div>
            <p className="mk-mono text-[11px] text-mk-cyan">Product</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/login" className="transition-colors hover:text-white">Sign in</Link></li>
              <li><Link href="/login" className="transition-colors hover:text-white">Get started</Link></li>
            </ul>
          </div>
          <div>
            <p className="mk-mono text-[11px] text-mk-cyan">Contact</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a href={WHATSAPP_URL} className="transition-colors hover:text-white">
                  WhatsApp us
                </a>
              </li>
              <li>
                <a href="mailto:consulting.synerix@gmail.com" className="transition-colors hover:text-white">
                  consulting.synerix@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-mk-line-dark pt-6 text-xs text-mk-mist/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Synerix. All rights reserved.</p>
          <p className="mk-mono text-[10px]">Made in India</p>
        </div>
      </div>
    </footer>
  );
}
