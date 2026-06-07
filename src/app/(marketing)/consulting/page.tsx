import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { EnquiryForm } from "@/components/marketing/enquiry-form";
import { WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/contact";

export const metadata = { title: "Consulting" };

const SERVICES = [
  {
    n: "01",
    title: "Business planning & strategy",
    text: "A plan you actually run the business on: where the next crore of revenue comes from, which bets are sized to your balance sheet (not a pitch deck), and what you'll stop doing to fund them. Reviewed every quarter, revised when the market moves.",
  },
  {
    n: "02",
    title: "Financial health & cash flow",
    text: "In our experience, most MSMEs don't have a revenue problem. They have a margin and collections problem. We rebuild pricing discipline, tighten receivables, and put a simple cash-flow rhythm in place so you know, every Monday, exactly how much runway you have.",
  },
  {
    n: "03",
    title: "People & compliance",
    text: "GST filings, labour registers, contracts that actually protect you: the unglamorous hygiene that decides whether a bank, buyer or investor takes you seriously. Plus the harder part: hiring your first real managers and letting them manage.",
  },
  {
    n: "04",
    title: "Operations & process improvement",
    text: "If the business stops when you take a week off, the business is the bottleneck. We write the SOPs with your team on the shop floor, kill the steps nobody can justify, and set up the three or four numbers worth reviewing every week.",
  },
  {
    n: "05",
    title: "Marketing & branding",
    text: "Positioning a customer can repeat after one visit, distribution that goes beyond the founder's phonebook, and a digital presence that earns enquiries instead of just existing. When the plan calls for creatives, Synerix Studio makes them from your own products.",
  },
  {
    n: "06",
    title: "Tech, digital & supply chain",
    text: "Right-sized tools for billing, inventory and a CRM your team actually opens, adopted until they stick. And a supply chain that stops eating your cash: supplier terms renegotiated with data in hand, logistics costs you can see per order.",
  },
];

const ENGAGEMENT = [
  {
    n: "01",
    title: "Health Check",
    text: "Twenty questions across finance, people, operations, market and strategy. Free, five minutes, a scored report in your inbox. This is where every engagement starts.",
  },
  {
    n: "02",
    title: "Working diagnosis",
    text: "We sit with your numbers and your people, not a questionnaire, and agree on the two or three problems that are actually costing you money this quarter.",
  },
  {
    n: "03",
    title: "Hands-on fixes",
    text: "Working sessions, not workshops. We change the price list, draft the SOP, sit in on the hiring call. You see the fix running before we call it done.",
  },
  {
    n: "04",
    title: "Quarterly cadence",
    text: "A standing review of the numbers that matter, course corrections while they're cheap, and a partner who already knows the business when the next decision lands.",
  },
];

export default function ConsultingPage() {
  return (
    <main>
      {/* ====== Hero (paper) ====== */}
      <section className="bg-mk-paper pb-20 pt-36 md:pb-28 md:pt-44">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <p className="mk-mono mk-reveal text-[11px] text-mk-cyan-deep" style={{ animationDelay: "0ms" }}>
            Synerix Consulting
          </p>
          <h1
            className="mk-display mk-reveal mt-6 max-w-4xl text-balance text-[2.6rem] font-medium leading-[1.04] text-mk-ink md:text-7xl"
            style={{ animationDelay: "90ms" }}
          >
            Senior counsel for businesses that{" "}
            <em className="text-mk-cyan-deep">do the work themselves.</em>
          </h1>
          <p
            className="mk-reveal mt-7 max-w-xl text-pretty text-base leading-relaxed text-mk-slate md:text-lg"
            style={{ animationDelay: "180ms" }}
          >
            Hands-on consulting from people who have run, grown and rescued real Indian
            businesses. We diagnose, then fix things with you.
          </p>
          <div className="mk-reveal mt-10 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "270ms" }}>
            <a
              href="#enquiry"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-mk-ink px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-mk-navy"
            >
              Book a conversation
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <Link
              href="/tests/business-health"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-mk-line px-6 py-3.5 text-sm font-medium text-mk-ink transition hover:border-mk-cyan-deep hover:text-mk-cyan-deep"
            >
              Take the free Health Check
            </Link>
          </div>
        </div>
      </section>

      {/* ====== Services ====== */}
      <section className="bg-mk-paper pb-24 md:pb-32">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="border-t border-mk-line pt-10">
            <h2 className="mk-display max-w-md text-balance text-3xl font-medium leading-tight text-mk-ink md:text-5xl">
              Six places a business quietly leaks money.
            </h2>
          </div>

          <div className="mt-14 grid gap-12 md:grid-cols-2 md:gap-x-10 md:gap-y-16">
            {SERVICES.map((s) => (
              <div key={s.n} className="border-t-2 border-mk-ink pt-5">
                <span className="mk-mono text-[11px] text-mk-cyan-deep">{s.n}</span>
                <h3 className="mk-display mt-3 text-2xl font-medium text-mk-ink md:text-3xl">
                  {s.title}
                </h3>
                <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-mk-slate">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== How an engagement runs (ink band) ====== */}
      <section className="mk-grain relative overflow-hidden bg-mk-ink py-24 text-white md:py-28">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <h2 className="mk-display max-w-lg text-balance text-3xl font-medium leading-tight md:text-5xl">
            How an engagement <em className="text-mk-cyan-bright">runs.</em>
          </h2>

          <div className="mt-14 grid gap-12 sm:grid-cols-2 md:gap-8 lg:grid-cols-4">
            {ENGAGEMENT.map((step) => (
              <div key={step.n} className="border-t border-mk-line-dark pt-5">
                <span className="mk-mono text-[11px] text-mk-cyan">{step.n}</span>
                <h3 className="mk-display mt-3 text-xl font-medium md:text-2xl">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-mk-mist">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== Who you'll work with ====== */}
      <section className="bg-mk-paper py-24 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <h2 className="mk-display max-w-md text-balance text-3xl font-medium leading-tight text-mk-ink md:text-5xl">
              Operators, <em className="text-mk-cyan-deep">not observers.</em>
            </h2>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-mk-slate">
              Synerix is led by people with 25+ years of diversified industrial experience in
              MSME consulting. We have run, grown and rescued real businesses, so the advice
              comes from the shop floor, not a slide library. You work directly with the
              senior people who did the diagnosis, from the first conversation to the
              quarterly review. No fifty-slide decks, no junior analysts learning on your dime.
            </p>
          </div>
          {/* Testimonial slot: add only real, verified client quotes here. */}
        </div>
      </section>

      {/* ====== Health check CTA band ====== */}
      <section className="border-y border-mk-line bg-mk-paper-dim py-20 md:py-24">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-5 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <p className="mk-mono text-[11px] text-mk-slate">Free · 5 minutes</p>
            <h2 className="mk-display mt-4 max-w-xl text-balance text-3xl font-medium leading-tight text-mk-ink md:text-4xl">
              Not ready to talk? Start with the{" "}
              <em className="text-mk-cyan-deep">numbers.</em>
            </h2>
          </div>
          <Link
            href="/tests/business-health"
            className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-mk-ink px-7 py-4 text-sm font-semibold text-white transition hover:bg-mk-navy"
          >
            Take the free Health Check
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* ====== Enquiry ====== */}
      <section id="enquiry" className="bg-mk-paper py-24 md:py-32">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <h2 className="mk-display max-w-md text-balance text-3xl font-medium leading-tight text-mk-ink md:text-5xl">
              Tell us where it <em className="text-mk-cyan-deep">hurts.</em>
            </h2>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-mk-slate">
              Cash that arrives late, a team that can&rsquo;t run without you, growth that
              stalled at the same number two years running. Whatever it is, the first
              conversation is free and stays between us. No retainer pitch, no obligation.
            </p>
            <div className="mt-10 space-y-4 border-t border-mk-line pt-7">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 text-sm font-medium text-mk-ink transition hover:text-mk-cyan-deep"
              >
                <span className="mk-mono w-24 shrink-0 text-[11px] text-mk-slate">WhatsApp</span>
                {WHATSAPP_DISPLAY}
                <ArrowUpRight className="size-4 text-mk-slate transition-all group-hover:translate-x-0.5 group-hover:text-mk-cyan-deep" />
              </a>
              <a
                href="mailto:consulting.synerix@gmail.com"
                className="group flex items-center gap-3 text-sm font-medium text-mk-ink transition hover:text-mk-cyan-deep"
              >
                <span className="mk-mono w-24 shrink-0 text-[11px] text-mk-slate">Email</span>
                consulting.synerix@gmail.com
                <ArrowUpRight className="size-4 text-mk-slate transition-all group-hover:translate-x-0.5 group-hover:text-mk-cyan-deep" />
              </a>
            </div>
          </div>
          <EnquiryForm />
        </div>
      </section>
    </main>
  );
}
