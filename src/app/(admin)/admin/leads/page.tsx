import { ChevronDown } from "lucide-react";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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
  if (score >= 40) return <Badge>{score}</Badge>;
  return <Badge variant="destructive">{score}</Badge>;
}

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function AdminLeadsPage() {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [leads, totals, monthCount] = await Promise.all([
    prisma.testResult.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.testResult.aggregate({ _count: true, _avg: { testScore: true } }),
    prisma.testResult.count({ where: { createdAt: { gte: monthStart } } }),
  ]);

  const stats = [
    { label: "Total leads", value: String(totals._count) },
    { label: "Avg score", value: (totals._avg.testScore ?? 0).toFixed(0) },
    { label: "Leads this month", value: String(monthCount) },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="gap-1 py-4">
            <CardContent className="px-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {s.label}
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <ul className="mt-6 divide-y divide-border rounded-lg border border-border">
        {leads.map((lead) => {
          const categories = (lead.categoryAnalysis as CategoryEntry[] | null) ?? [];
          const recommendations = (lead.recommendations as Recommendation[] | null) ?? [];
          return (
            <li key={lead.id}>
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 hover:bg-muted/50 [&::-webkit-details-marker]:hidden">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {lead.name}
                      <span className="ml-1.5 font-normal text-muted-foreground">
                        · {lead.businessName}
                      </span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {lead.email} · {lead.phoneNumber}
                    </p>
                  </div>
                  {scoreBadge(lead.testScore)}
                  <span className="hidden text-xs text-muted-foreground sm:block">
                    {dateFmt.format(lead.createdAt)}
                  </span>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <div className="space-y-4 border-t border-border bg-muted/30 px-4 py-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Business
                    </p>
                    <p className="mt-1 text-sm">{lead.businessDescription}</p>
                  </div>
                  {categories.length > 0 && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
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

      {leads.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">No leads yet.</p>
      )}
    </div>
  );
}
