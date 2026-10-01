import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireSuperAdmin } from "@/lib/auth";
import { EmptyState, StatGrid, fmtInt } from "../admin-ui";

export const metadata = { title: "Leads | Synerix Admin" };

interface CategoryEntry {
  category: string;
  percentage: number;
}

interface Recommendation {
  title: string;
}

function scoreBadge(score: number) {
  if (score >= 70) {
    return (
      <Badge
        variant="secondary"
        className="bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
      >
        {score}
      </Badge>
    );
  }
  if (score >= 40) {
    return (
      <Badge
        variant="secondary"
        className="bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
      >
        {score}
      </Badge>
    );
  }
  return <Badge variant="destructive">{score}</Badge>;
}

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function AdminLeadsPage() {
  // requireSuperAdmin() is the auth boundary — see its docstring.
  await requireSuperAdmin();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [leads, totals, monthCount] = await Promise.all([
    prisma.testResult.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.testResult.aggregate({ _count: true, _avg: { testScore: true } }),
    prisma.testResult.count({ where: { createdAt: { gte: monthStart } } }),
  ]);

  const stats = [
    { label: "Total leads", value: fmtInt(totals._count) },
    { label: "Avg score", value: fmtInt(totals._avg.testScore ?? 0) },
    { label: "Leads this month", value: fmtInt(monthCount) },
  ];

  return (
    <div>
      <StatGrid stats={stats} />

      {leads.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No leads yet"
            body="Leads land here when someone completes the business health test on the marketing site."
            action={
              <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/tests/business-health" />}>
                View the test
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border rounded-lg border border-border">
          {leads.map((lead) => {
            const categories = (lead.categoryAnalysis as CategoryEntry[] | null) ?? [];
            const recommendations = (lead.recommendations as Recommendation[] | null) ?? [];
            return (
              <li key={lead.id}>
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {lead.name}
                        <span className="ml-1.5 font-normal text-muted-foreground">
                          · {lead.businessName}
                        </span>
                      </p>
                      <p className="truncate text-xs text-muted-foreground tabular-nums">
                        {lead.email} · {lead.phoneNumber}
                      </p>
                    </div>
                    {scoreBadge(lead.testScore)}
                    <span className="hidden text-xs text-muted-foreground tabular-nums sm:block">
                      {dateFmt.format(lead.createdAt)}
                    </span>
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none" />
                  </summary>
                  <div className="space-y-4 border-t border-border bg-muted/30 px-4 py-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Business
                      </p>
                      <p className="mt-1 text-sm">{lead.businessDescription}</p>
                    </div>
                    {categories.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Category breakdown
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {categories.map((c) => (
                            <Badge key={c.category} variant="outline">
                              {c.category}: {c.percentage}%
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {recommendations.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Recommendations
                        </p>
                        <ul className="mt-1 list-inside list-disc text-sm text-muted-foreground">
                          {recommendations.map((r) => (
                            <li key={r.title}>{r.title}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
