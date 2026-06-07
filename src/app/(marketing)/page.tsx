import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Synerix: Practical business consulting for Indian MSMEs",
};

const STATS = [
  { value: "20 questions", label: "the free Business Health Check, across 5 areas" },
  { value: "6 service areas", label: "from cash flow to supply chain" },
  { value: "25+ years", label: "of operator experience in MSME consulting" },
];

const SERVICES = [
  {
    n: "01",
    title: "Business Planning & Strategy",
    text: "A plan you run the business on: where the next crore comes from, and what you'll stop doing to fund it.",
  },
  {
    n: "02",
    title: "Financial Management",
    text: "Pricing discipline, tighter receivables, and a cash-flow rhythm so you know every Monday how much runway you have.",
  },
  {
    n: "03",
    title: "Operations & Process Improvement",
    text: "SOPs written on the shop floor and wasteful steps killed, so the business runs when you take a week off.",
  },
  {
    n: "04",
    title: "Marketing & Branding",
    text: "Positioning a customer can repeat, and a digital presence that earns enquiries instead of just existing.",
  },
  {
    n: "05",
    title: "Tech & Digital Transformation",
    text: "Right-sized tools for billing, inventory and CRM, adopted so your team actually uses them.",
  },
  {
    n: "06",
    title: "Supply Chain Optimization",
    text: "Inventory that stops eating your cash, and logistics costs you can see per order.",
  },
];

const PILLARS = [
  {
    title: "Experience",
    text: "25+ years of diversified industrial experience in MSME consulting. Advice from people who have run real businesses.",
  },
  {
    title: "Hands-on & holistic",
    text: "We don't leave a report and go. Finance, operations, people and marketing are worked together, with your team.",
  },
  {
    title: "Results-driven",
    text: "We agree the two or three numbers that matter upfront, then review every quarter against them.",
  },
  {
    title: "Long-term partnership",
    text: "Engagements settle into a quarterly cadence: a partner who already knows the business when the next decision lands.",
  },
];

const METHOD = [
  {
    n: "01",
    title: "Diagnose",
    text: "Start with the free Business Health Check: twenty sharp questions across finance, people, operations, market and strategy. You get a scored report in your inbox.",
  },
  {
    n: "02",
    title: "Advise",
    text: "We work the findings with you: pricing, processes, compliance, growth bets. Practical counsel from people who have run and rescued real Indian businesses.",
  },
  {
    n: "03",
    title: "Amplify",
    text: "Synerix Studio produces the ad creatives your plan calls for. Your product, your brand, ready for the occasions your market cares about.",
  },
];

export default function LandingPage() {
  return (
    <main>
      {/* ====== Hero ====== */}
      <section className="mk-hero-bg mk-grain relative overflow-hidden bg-mk-ink pb-20 pt-40 text-white md:pb-24 md:pt-48">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <p className="mk-mono mk-reveal text-[11px] text-mk-cyan" style={{ animationDelay: "0ms" }}>
            MSME consulting · India
          </p>
          <h1
            className="mk-display mk-reveal mt-6 max-w-4xl text-balance text-[2.6rem] font-medium leading-[1.04] md:text-7xl"
            style={{ animationDelay: "90ms" }}
          >
            Your business, run like{" "}
            <em className="text-mk-cyan-bright">the big ones.</em>
          </h1>
          <p
            className="mk-reveal mt-7 max-w-xl text-pretty text-base leading-relaxed text-mk-mist md:text-lg"
            style={{ animationDelay: "180ms" }}
          >
            A hands-on consulting practice for Indian MSMEs: we diagnose what&rsquo;s actually
            costing you money, then fix it with you.
          </p>
          <div className="mk-reveal mt-10 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "270ms" }}>
            <Link
              href="/tests/business-health"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-mk-cyan px-6 py-3.5 text-sm font-semibold text-mk-ink transition hover:bg-mk-cyan-bright"
            >
              Take the free Health Check
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="mailto:consulting.synerix@gmail.com"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-mk-line-dark px-6 py-3.5 text-sm font-medium text-white transition hover:border-mk-cyan hover:text-mk-cyan-bright"
            >
              Book a conversation
            </a>
          </div>
        </div>
      </section>

      {/* ====== Numbers band (under the hero, not inside it) ====== */}
      <section className="bg-mk-ink pb-16 text-white">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="grid gap-6 border-t border-mk-line-dark pt-8 sm:grid-cols-3">
            {STATS.map((s) => (
              <div key={s.value}>
                <p className="mk-display text-2xl text-white md:text-3xl">{s.value}</p>
                <p className="mt-1 text-[13px] text-mk-mist">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== Services ====== */}
      <section className="bg-mk-paper py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <h2 className="mk-display max-w-md text-balance text-3xl font-medium leading-tight text-mk-ink md:text-5xl">
            Six places we go to work on a business.
          </h2>

          <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {SERVICES.map((s) => (
              <div key={s.n} className="border-t-2 border-mk-ink pt-5">
                <span className="mk-mono text-[11px] text-mk-cyan-deep">{s.n}</span>
                <h3 className="mk-display mt-3 text-xl font-medium text-mk-ink md:text-2xl">
                  {s.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-mk-slate">{s.text}</p>
              </div>
            ))}
          </div>

          <Link
            href="/consulting"
            className="group mt-14 inline-flex items-center gap-2 rounded-full bg-mk-ink px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-mk-navy"
          >
            See how an engagement runs
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* ====== Why Synerix ====== */}
      <section className="bg-mk-navy py-24 text-white md:py-28">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <h2 className="mk-display max-w-md text-balance text-3xl font-medium leading-tight md:text-5xl">
            Why businesses stay with <em className="text-mk-cyan-bright">Synerix.</em>
          </h2>

          <div className="mt-14 grid gap-10 sm:grid-cols-2 md:gap-8 lg:grid-cols-4">
            {PILLARS.map((p) => (
              <div key={p.title} className="border-t border-mk-line-dark pt-5">
                <h3 className="mk-display text-xl font-medium">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-mk-mist">{p.text}</p>
              </div>
            ))}
          </div>

          {/* Testimonial slot: add only real, verified client quotes here. */}
        </div>
      </section>

      {/* ====== Method ====== */}
      <section className="border-y border-mk-line bg-mk-paper-dim py-24 md:py-28">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <h2 className="mk-display max-w-md text-balance text-3xl font-medium leading-tight text-mk-ink md:text-4xl">
            How we work.
          </h2>
          <div className="mt-12 grid gap-12 md:grid-cols-3 md:gap-8">
            {METHOD.map((m) => (
              <div key={m.n} className="border-t-2 border-mk-ink pt-5">
                <span className="mk-mono text-[11px] text-mk-cyan-deep">{m.n}</span>
                <h3 className="mk-display mt-3 text-2xl font-medium text-mk-ink">{m.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-mk-slate">{m.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== Studio band ====== */}
      <section className="mk-grain relative overflow-hidden bg-mk-ink py-20 text-white md:py-24">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-5 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <h2 className="mk-display max-w-xl text-balance text-3xl font-medium leading-tight md:text-4xl">
              Marketing output, <em className="text-mk-cyan-bright">without hiring a team.</em>
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-mk-mist">
              Synerix Studio turns your product photos into campaign-ready ad creatives.
            </p>
            <p className="mk-mono mt-5 text-xs text-mk-mist">
              English · हिन्दी · Hinglish · ਪੰਜਾਬੀ
            </p>
          </div>
          <Link
            href="/synerix-studio"
            className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-mk-cyan px-6 py-3.5 text-sm font-semibold text-mk-ink transition hover:bg-mk-cyan-bright"
          >
            See how it works
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* ====== Health check CTA ====== */}
      <section className="bg-mk-paper py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-5 text-center md:px-8">
          <span className="mk-mono text-[11px] text-mk-slate">Free · 5 minutes</span>
          <h2 className="mk-display mt-5 text-balance text-3xl font-medium leading-tight text-mk-ink md:text-5xl">
            How healthy is your business, <em className="text-mk-cyan-deep">really?</em>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-mk-slate">
            Answer twenty questions across finance, people, operations, market and strategy.
            A scored, personalised report with concrete recommendations lands in your inbox, free.
          </p>
          <Link
            href="/tests/business-health"
            className="group mt-9 inline-flex items-center gap-2 rounded-full bg-mk-ink px-7 py-4 text-sm font-semibold text-white transition hover:bg-mk-navy"
          >
            Take the free Health Check
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
