import Link from "next/link";
import { ArrowRight, CalendarDays, Languages, Package, PenTool, ShieldCheck, Sparkles } from "lucide-react";

export const metadata = {
  title: "Synerix Studio: AI ad creatives for Indian businesses",
  description:
    "Add your brand and products, and generate ad creatives for the Indian market. Built from your real product photos, with crisp brand typography and copy in four languages.",
};

const STEPS = [
  {
    n: "01",
    title: "Teach it your brand",
    text: "Paste your website or set it up by hand. Studio extracts your brand basics: colours, voice, logo, audience. It also researches how your category is advertised in India.",
  },
  {
    n: "02",
    title: "Add your products",
    text: "Phone photos are enough. Studio studies each product: the pack, the colours, how it is actually used. Pack-accurate renders are machine-checked against those photos.",
  },
  {
    n: "03",
    title: "Pick the occasion",
    text: "A built-in calendar of 45 Indian occasions, Diwali to Baisakhi. Or any custom brief: a sale, a launch, a Sunday special.",
  },
  {
    n: "04",
    title: "Get campaign-ready creatives",
    text: "Up to four distinct concepts per run: your product staged in a real Indian scene, your headline and logo set crisply on top, ready to post.",
  },
];

export default function StudioProductPage() {
  return (
    <main>
      {/* ====== Hero ====== */}
      <section className="mk-hero-bg mk-grain relative overflow-hidden bg-mk-ink pb-24 pt-40 text-white md:pb-28 md:pt-48">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <p className="mk-mono mk-reveal text-[11px] text-mk-cyan" style={{ animationDelay: "0ms" }}>
            AI creative studio for Indian brands
          </p>
          <h1
            className="mk-display mk-reveal mt-6 max-w-4xl text-balance text-[2.5rem] font-medium leading-[1.05] md:text-6xl"
            style={{ animationDelay: "90ms" }}
          >
            Ad creatives for your business, made by the same people{" "}
            <em className="text-mk-cyan-bright">who fix businesses.</em>
          </h1>
          <p
            className="mk-reveal mt-7 max-w-xl text-pretty text-base leading-relaxed text-mk-mist md:text-lg"
            style={{ animationDelay: "180ms" }}
          >
            Studio turns your real product photos and brand into Indian-market ad
            creatives: scene, headline, logo, four languages, minutes.
          </p>
          <div className="mk-reveal mt-10 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "270ms" }}>
            <a
              href="mailto:consulting.synerix@gmail.com?subject=Synerix%20Studio%20access"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-mk-cyan px-6 py-3.5 text-sm font-semibold text-mk-ink transition hover:bg-mk-cyan-bright"
            >
              Request access
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-mk-line-dark px-6 py-3.5 text-sm font-medium text-white transition hover:border-mk-cyan hover:text-mk-cyan-bright"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ====== How it works ====== */}
      <section className="bg-mk-paper py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <h2 className="mk-display max-w-lg text-balance text-3xl font-medium leading-tight text-mk-ink md:text-5xl">
            From website to campaign in four steps.
          </h2>

          <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {STEPS.map((s) => (
              <div key={s.n} className="border-t-2 border-mk-ink pt-5">
                <span className="mk-mono text-[11px] text-mk-cyan-deep">{s.n}</span>
                <h3 className="mk-display mt-3 text-xl font-medium text-mk-ink">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-mk-slate">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== Features (bento: 6 items, 6 cells, varied surfaces) ====== */}
      <section className="border-y border-mk-line bg-mk-paper-dim py-24 md:py-28">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <h2 className="mk-display max-w-lg text-balance text-3xl font-medium leading-tight text-mk-ink md:text-4xl">
            What makes it different.
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-6">
            {/* Typography: the signature capability, on an ink cell */}
            <div className="mk-grain relative overflow-hidden rounded-2xl bg-mk-ink p-7 text-white md:col-span-4 md:p-9">
              <PenTool className="size-5 text-mk-cyan" />
              <h3 className="mk-display mt-4 text-xl font-medium md:text-2xl">Typography that never misspells</h3>
              <p className="mt-2.5 max-w-md text-sm leading-relaxed text-mk-mist">
                Headlines, CTAs and your logo are set as crisp text layers over the scene, so
                spelling is always right, including Devanagari and Gurmukhi. Edit the text or
                switch language in seconds, at no extra cost.
              </p>
              <p className="mk-mono mt-6 text-[11px] text-mk-cyan">English · हिन्दी · Hinglish · ਪੰਜਾਬੀ</p>
            </div>
            <div className="rounded-2xl border border-mk-line bg-white p-7 md:col-span-2">
              <Package className="size-5 text-mk-cyan-deep" />
              <h3 className="mk-display mt-4 text-lg font-medium text-mk-ink">Your real product</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-mk-slate">
                Multi-angle reference photos anchor every scene, and pack renders are
                machine-checked against the photos you uploaded. What&rsquo;s in the ad is your product.
              </p>
            </div>
            <div className="rounded-2xl border border-mk-line bg-white p-7 md:col-span-2">
              <Languages className="size-5 text-mk-cyan-deep" />
              <h3 className="mk-display mt-4 text-lg font-medium text-mk-ink">Four languages, one tap</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-mk-slate">
                Every creative carries idiomatic copy in English, Hindi, Hinglish and Punjabi,
                written for Indian social ads, not translated word for word.
              </p>
            </div>
            <div className="rounded-2xl bg-[#e7f6f6] p-7 md:col-span-2">
              <CalendarDays className="size-5 text-mk-cyan-deep" />
              <h3 className="mk-display mt-4 text-lg font-medium text-mk-ink">45 Indian occasions</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-mk-slate">
                A built-in calendar with dates, motifs and moods loaded. Open it, pick the
                occasion, generate.
              </p>
            </div>
            <div className="rounded-2xl border border-mk-line bg-white p-7 md:col-span-2">
              <Sparkles className="size-5 text-mk-cyan-deep" />
              <h3 className="mk-display mt-4 text-lg font-medium text-mk-ink">Concepts to choose from</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-mk-slate">
                A run gives you up to four distinct concepts, each grounded in research on your
                category. Any that fail to render are refunded.
              </p>
            </div>
            <div className="rounded-2xl border border-mk-line bg-white p-7 md:col-span-2">
              <ShieldCheck className="size-5 text-mk-cyan-deep" />
              <h3 className="mk-display mt-4 text-lg font-medium text-mk-ink">Brand, applied consistently</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-mk-slate">
                Logo, tagline and brand colours on every creative. Edit text, reposition the
                logo, switch language, all without redoing the design.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ====== Credits / access ====== */}
      <section className="bg-mk-paper py-24 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-2 md:items-center md:px-8">
          <div>
            <h2 className="mk-display max-w-md text-balance text-3xl font-medium leading-tight text-mk-ink md:text-4xl">
              Pay for creatives, <em className="text-mk-cyan-deep">not seats.</em>
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-mk-slate">
              Two credits make one finished creative. A standard run gives you up to four
              distinct concepts to choose from. Failed generations are refunded
              automatically, so you only ever pay for what you can use.
            </p>
          </div>
          <div className="rounded-2xl bg-mk-navy p-8 text-white md:p-10">
            <p className="mk-mono text-[11px] text-mk-cyan">Getting started</p>
            <ul className="mt-6 space-y-4 text-sm leading-relaxed text-mk-mist">
              <li className="flex gap-3">
                <span className="mk-mono mt-0.5 text-[11px] text-mk-cyan">a.</span>
                Tell us what you sell. Studio is invite-only, and every account starts with a
                real conversation.
              </li>
              <li className="flex gap-3">
                <span className="mk-mono mt-0.5 text-[11px] text-mk-cyan">b.</span>
                We set up your workspace for your kind of business and send your invite.
              </li>
              <li className="flex gap-3">
                <span className="mk-mono mt-0.5 text-[11px] text-mk-cyan">c.</span>
                Sign in with Google, add your products, and generate.
              </li>
            </ul>
            <a
              href="mailto:consulting.synerix@gmail.com?subject=Synerix%20Studio%20access"
              className="group mt-8 inline-flex items-center gap-2 rounded-full bg-mk-cyan px-6 py-3 text-sm font-semibold text-mk-ink transition hover:bg-mk-cyan-bright"
            >
              Request access
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </section>

      {/* ====== Part of Synerix ====== */}
      <section className="border-t border-mk-line bg-mk-paper-dim py-16 md:py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <h2 className="mk-display text-xl font-medium text-mk-ink">Part of Synerix.</h2>
            <p className="mt-3 max-w-xl text-pretty text-[15px] leading-relaxed text-mk-slate">
              Studio is built and run by Synerix, the MSME consulting practice. The same
              people who work on pricing, cash flow and operations with Indian businesses.
              When a plan calls for marketing output, this is the tool we use.
            </p>
          </div>
          <Link
            href="/consulting"
            className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-mk-line px-6 py-3.5 text-sm font-medium text-mk-ink transition hover:border-mk-cyan-deep hover:text-mk-cyan-deep"
          >
            Explore Synerix Consulting
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* ====== Closing band ====== */}
      <section className="mk-grain relative overflow-hidden bg-mk-ink py-20 text-white md:py-24">
        <div className="mx-auto max-w-3xl px-5 text-center md:px-8">
          <h2 className="mk-display text-balance text-3xl font-medium leading-tight md:text-4xl">
            Try it on your own product.
          </h2>
          <p className="mt-4 text-[15px] text-mk-mist">
            The first conversation is free, same as consulting. Tell us what you sell, and
            we&rsquo;ll set you up.
          </p>
          <a
            href="mailto:consulting.synerix@gmail.com?subject=Synerix%20Studio%20access"
            className="group mt-8 inline-flex items-center gap-2 rounded-full bg-mk-cyan px-7 py-4 text-sm font-semibold text-mk-ink transition hover:bg-mk-cyan-bright"
          >
            Request access
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      </section>
    </main>
  );
}
