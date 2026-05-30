import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CreditReason } from "@/generated/prisma/client";
import { WHATSAPP_URL } from "@/lib/contact";

export const metadata = { title: "Credits — Synerix Studio" };

const REASON_LABEL: Record<CreditReason, string> = {
  MANUAL_GRANT: "Credits granted",
  SIGNUP_GRANT: "Signup bonus",
  GENERATION: "Generation",
  REGEN_INSTRUCTION: "Regenerate",
  ENHANCE_PROMPT: "Prompt enhance",
  REFUND: "Refund",
};

const REASON_VARIANT: Record<CreditReason, "default" | "secondary" | "outline"> = {
  MANUAL_GRANT: "secondary",
  SIGNUP_GRANT: "secondary",
  GENERATION: "default",
  REGEN_INSTRUCTION: "default",
  ENHANCE_PROMPT: "default",
  REFUND: "outline",
};

function formatDate(d: Date) {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
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
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Current balance" value={balance} />
          <StatCard label="Used all-time" value={usedAllTime} />
          <StatCard label="Granted all-time" value={grantedAllTime} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">How credits work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <span className="font-medium text-foreground">2 credits = 1 finished creative.</span> A
                standard run designs 4 creatives, so it costs 8 credits.
              </li>
              <li>
                Scene regenerate, baked-text edits and language switches on baked creatives cost 2 credits
                each — a fresh image is generated.
              </li>
              <li>Failed creatives are refunded automatically.</li>
              <li>
                Free: text edits on overlay creatives, logo and motto changes, and all downloads.
              </li>
            </ul>
            <p>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">History</CardTitle>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No credit activity yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">Date</th>
                      <th className="py-2 pr-4 font-medium">Activity</th>
                      <th className="py-2 pr-4 font-medium">Note</th>
                      <th className="py-2 pr-4 text-right font-medium">Credits</th>
                      <th className="py-2 text-right font-medium">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((e) => (
                      <tr key={e.id} className="border-b last:border-0">
                        <td className="whitespace-nowrap py-2.5 pr-4 text-muted-foreground">
                          {formatDate(e.createdAt)}
                        </td>
                        <td className="py-2.5 pr-4">
                          <Badge variant={REASON_VARIANT[e.reason]}>{REASON_LABEL[e.reason]}</Badge>
                        </td>
                        <td className="max-w-[280px] truncate py-2.5 pr-4 text-muted-foreground">
                          {e.note ?? "—"}
                        </td>
                        <td
                          className={
                            e.delta > 0
                              ? "whitespace-nowrap py-2.5 pr-4 text-right font-medium text-emerald-600 dark:text-emerald-500"
                              : "whitespace-nowrap py-2.5 pr-4 text-right font-medium text-destructive"
                          }
                        >
                          {e.delta > 0 ? `+${e.delta}` : `−${Math.abs(e.delta)}`}
                        </td>
                        <td className="whitespace-nowrap py-2.5 text-right text-muted-foreground">
                          {e.balanceAfter}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1.5 text-3xl font-semibold tracking-tight">{value.toLocaleString("en-IN")}</p>
      </CardContent>
    </Card>
  );
}
