import Link from "next/link";
import { ReceiptText } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CreditReason } from "@/generated/prisma/client";
import { WHATSAPP_URL } from "@/lib/contact";

export const metadata = { title: "Credits | Synerix Studio" };

const REASON_LABEL: Record<CreditReason, string> = {
  MANUAL_GRANT: "Credits granted",
  SIGNUP_GRANT: "Signup bonus",
  GENERATION: "Generation",
  REGEN_INSTRUCTION: "Regenerate",
  ENHANCE_PROMPT: "Prompt enhance",
  BRAND_INTEL: "Brand research",
  REFUND: "Refund",
};

const REASON_VARIANT: Record<CreditReason, "default" | "secondary" | "outline"> = {
  MANUAL_GRANT: "secondary",
  SIGNUP_GRANT: "secondary",
  GENERATION: "default",
  REGEN_INSTRUCTION: "default",
  ENHANCE_PROMPT: "default",
  BRAND_INTEL: "default",
  REFUND: "outline",
};

// Server renders in UTC; pin IST so late-night activity lands on the right day.
function formatDate(d: Date) {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
}

// Credits come in 0.25 steps, so allow two decimals.
function fmt(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

// Sign as text (not colour alone); U+2212 minus lines up with "+" in tabular figures.
function Delta({ value }: { value: number }) {
  const positive = value > 0;
  return (
    <span
      className={`font-medium tabular-nums ${positive ? "text-emerald-700 dark:text-emerald-500" : "text-destructive"}`}
    >
      {positive ? "+" : "\u2212"}
      {fmt(Math.abs(value))}
    </span>
  );
}

// MANUAL_GRANT also carries admin deductions (negative delta); don't call
// those "Credits granted".
function activityLabel(reason: CreditReason, delta: number) {
  if (reason === "MANUAL_GRANT" && delta < 0) return "Credits removed";
  return REASON_LABEL[reason];
}

export default async function CreditsPage() {
  const ctx = await requireAuth();

  const [credits, used, granted, entries] = await Promise.all([
    prisma.workspaceCredits.findUnique({ where: { workspaceId: ctx.workspaceId } }),
    prisma.creditLedger.aggregate({
      where: { workspaceId: ctx.workspaceId, delta: { lt: 0 } },
      _sum: { delta: true },
    }),
    prisma.creditLedger.aggregate({
      where: { workspaceId: ctx.workspaceId, delta: { gt: 0 } },
      _sum: { delta: true },
    }),
    prisma.creditLedger.findMany({
      where: { workspaceId: ctx.workspaceId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const balance = Number(credits?.balance ?? 0);
  const usedAllTime = -Number(used._sum.delta ?? 0);
  const grantedAllTime = Number(granted._sum.delta ?? 0);
  // Decimal → plain numbers for rendering/math (credits support 0.25 charges).
  const rows = entries.map((e) => ({ ...e, delta: Number(e.delta), balanceAfter: Number(e.balanceAfter) }));

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Workspace</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">Credits</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your balance, how credits are spent, and every transaction.
      </p>

      <div className="mt-8 space-y-6">
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current balance</p>
              <p className="mt-1 flex items-baseline gap-2">
                <span className="text-5xl font-semibold tracking-tight tabular-nums md:text-6xl">{fmt(balance)}</span>
                <span className="text-sm text-muted-foreground">{balance === 1 ? "credit" : "credits"}</span>
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-6 border-t pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
              <div>
                <dt className="text-xs text-muted-foreground">Used all-time</dt>
                <dd className="mt-0.5 text-lg font-semibold tabular-nums">{fmt(usedAllTime)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Granted all-time</dt>
                <dd className="mt-0.5 text-lg font-semibold tabular-nums">{fmt(grantedAllTime)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <section className="rounded-2xl bg-muted/60 px-5 py-4 text-sm text-muted-foreground">
          <h2 className="font-medium text-foreground">How credits work</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              <span className="font-medium text-foreground">2 credits = 1 finished creative.</span> A
              standard run designs 4 creatives, so it costs 8 credits.
            </li>
            <li>
              Scene regenerate, baked-text edits and language switches on baked creatives cost 2 credits
              each: a fresh image is generated.
            </li>
            <li>Failed creatives are refunded automatically.</li>
            <li>
              Free: text edits on overlay creatives, logo and motto changes, and all downloads.
            </li>
          </ul>
          <p className="mt-3">
            Need more credits? Email{" "}
            <a href="mailto:consulting.synerix@gmail.com" className="font-medium text-primary underline-offset-2 hover:underline">
              consulting.synerix@gmail.com
            </a>{" "}
            or message us on{" "}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              WhatsApp
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">History</h2>
          {rows.length === 0 ? (
            <div className="mt-3 flex flex-col items-center rounded-2xl border border-dashed px-6 py-12 text-center">
              <ReceiptText className="size-6 text-muted-foreground" aria-hidden />
              <p className="mt-3 text-sm font-medium">No credit activity yet</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Every charge, refund and grant will be listed here.
              </p>
              <Link href="/studio" className={buttonVariants({ className: "mt-5" })}>
                Create a creative
              </Link>
            </div>
          ) : (
            <>
              {/* Mobile: stacked rows. Five columns don't fit 390px. */}
              <ul className="mt-3 divide-y rounded-2xl border md:hidden">
                {rows.map((e) => (
                  <li key={e.id} className="flex items-start gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <Badge variant={REASON_VARIANT[e.reason]}>{activityLabel(e.reason, e.delta)}</Badge>
                      {e.note && <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{e.note}</p>}
                      <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                        {formatDate(e.createdAt)}, {formatTime(e.createdAt)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <Delta value={e.delta} />
                      <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">Bal {fmt(e.balanceAfter)}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-3 hidden overflow-x-auto rounded-2xl border md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                      <th className="px-4 py-2.5 font-medium">Date</th>
                      <th className="py-2.5 pr-4 font-medium">Activity</th>
                      <th className="py-2.5 pr-4 font-medium">Note</th>
                      <th className="py-2.5 pr-4 text-right font-medium">Credits</th>
                      <th className="py-2.5 pr-4 text-right font-medium">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((e) => (
                      <tr key={e.id} className="border-b last:border-0">
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                          {formatDate(e.createdAt)}
                          <span className="block text-xs text-muted-foreground">{formatTime(e.createdAt)}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={REASON_VARIANT[e.reason]}>{activityLabel(e.reason, e.delta)}</Badge>
                        </td>
                        <td className="max-w-[320px] truncate py-3 pr-4 text-muted-foreground" title={e.note ?? undefined}>
                          {e.note ?? "—"}
                        </td>
                        <td className="whitespace-nowrap py-3 pr-4 text-right">
                          <Delta value={e.delta} />
                        </td>
                        <td className="whitespace-nowrap py-3 pr-4 text-right text-muted-foreground tabular-nums">
                          {fmt(e.balanceAfter)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length === 50 && (
                <p className="mt-2 text-xs text-muted-foreground">Showing the latest 50 transactions.</p>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
