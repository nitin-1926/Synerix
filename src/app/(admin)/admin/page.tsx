import { prisma } from "@/lib/db";
import { getSignedThumbUrls } from "@/lib/storage";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, StatGrid, fmtCredits, fmtInt, fmtUSD, plural } from "./admin-ui";
import { EnterWorkspaceButton, GrantCreditsDialog, RenameWorkspaceDialog } from "./workspace-actions";
import { NewWorkspaceDialog } from "./new-workspace-dialog";
import { requireSuperAdmin } from "@/lib/auth";

export const metadata = { title: "Workspaces | Synerix Admin" };

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function AdminWorkspacesPage() {
  // requireSuperAdmin() is the auth boundary — see its docstring.
  await requireSuperAdmin();
  const [workspaces, runs, granted, spent] = await Promise.all([
    prisma.workspace.findMany({
      include: {
        owner: { select: { email: true } },
        credits: { select: { balance: true } },
        brands: {
          select: {
            name: true,
            assets: { where: { isPrimaryLogo: true }, select: { storageKey: true }, take: 1 },
          },
          take: 2,
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { memberships: true, brands: true, generationRuns: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.generationRun.findMany({
      select: { workspaceId: true, pipeline: true, _count: { select: { creatives: true } } },
    }),
    prisma.creditLedger.groupBy({
      by: ["workspaceId"],
      where: { delta: { gt: 0 } },
      _sum: { delta: true },
    }),
    prisma.creditLedger.groupBy({
      by: ["workspaceId"],
      where: { delta: { lt: 0 } },
      _sum: { delta: true },
    }),
  ]);

  const costByWs = new Map<string, number>();
  const creativesByWs = new Map<string, number>();
  for (const run of runs) {
    const cost = (run.pipeline as { cost?: { totalUSD?: number } } | null)?.cost?.totalUSD ?? 0;
    costByWs.set(run.workspaceId, (costByWs.get(run.workspaceId) ?? 0) + cost);
    creativesByWs.set(run.workspaceId, (creativesByWs.get(run.workspaceId) ?? 0) + run._count.creatives);
  }
  const grantedByWs = new Map(granted.map((g) => [g.workspaceId, Number(g._sum.delta ?? 0)]));
  const spentByWs = new Map(spent.map((s) => [s.workspaceId, Math.abs(Number(s._sum.delta ?? 0))]));

  // Signed logo thumbnails for the customer cards.
  const logoKeys = workspaces
    .map((ws) => ws.brands[0]?.assets[0]?.storageKey)
    .filter((k): k is string => Boolean(k));
  const logoThumbs = await getSignedThumbUrls(logoKeys, 160);

  const totalCreatives = [...creativesByWs.values()].reduce((a, b) => a + b, 0);
  const creditsOutstanding = workspaces.reduce((sum, ws) => sum + Number(ws.credits?.balance ?? 0), 0);
  const totalCost = [...costByWs.values()].reduce((a, b) => a + b, 0);

  const stats = [
    { label: "Workspaces", value: fmtInt(workspaces.length) },
    { label: "Creatives", value: fmtInt(totalCreatives) },
    { label: "Credits outstanding", value: fmtCredits(creditsOutstanding) },
    { label: "Total API cost", value: fmtUSD(totalCost) },
  ];

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Workspaces</h2>
          <p className="text-sm text-muted-foreground">Every customer you manage. Click a card to work inside their brand.</p>
        </div>
        <NewWorkspaceDialog />
      </div>
      <StatGrid stats={stats} className="grid-cols-2 lg:grid-cols-4" />

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {workspaces.map((ws) => {
          const balance = Number(ws.credits?.balance ?? 0);
          const cost = costByWs.get(ws.id) ?? 0;
          const primaryBrand = ws.brands[0];
          // Only the first two brands are fetched; count the rest.
          const extraBrands = ws._count.brands - ws.brands.length;
          const brandLabel =
            ws.brands.map((b) => b.name).join(", ") + (extraBrands > 0 ? ` +${extraBrands}` : "");
          const logoUrl = primaryBrand?.assets[0]?.storageKey
            ? logoThumbs[primaryBrand.assets[0].storageKey]
            : null;
          const health = balance <= 0 ? "empty" : balance < 10 ? "low" : "healthy";
          const healthClass =
            health === "empty"
              ? "bg-destructive/15 text-destructive"
              : health === "low"
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
          return (
            // The Enter button's ::after stretches over the whole card, so the
            // card is the click target; other controls sit above it (z-10).
            <Card
              key={ws.id}
              className="relative flex flex-col transition-[box-shadow,transform] duration-150 hover:shadow-sm hover:ring-foreground/25 motion-safe:has-[[data-enter]:active]:scale-[0.99]"
            >
              <CardHeader className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt={primaryBrand?.name ?? ws.name} className="size-full object-contain p-1" />
                  ) : (
                    <span className="text-base font-semibold text-muted-foreground">
                      {ws.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="truncate text-base font-semibold">{ws.name}</CardTitle>
                  <p className="truncate text-xs text-muted-foreground">
                    {brandLabel || "No brand yet"}
                    {" · "}
                    {ws.owner.email}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${healthClass}`}>
                    {fmtCredits(balance)} cr
                  </span>
                  <RenameWorkspaceDialog workspaceId={ws.id} workspaceName={ws.name} />
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-1 text-xs tabular-nums">
                <p>
                  {plural(ws._count.memberships, "member")} · {plural(ws._count.brands, "brand")} ·{" "}
                  {plural(creativesByWs.get(ws.id) ?? 0, "creative")} · {plural(ws._count.generationRuns, "run")}
                </p>
                <p className="text-muted-foreground">
                  +{fmtCredits(grantedByWs.get(ws.id) ?? 0)} / −{fmtCredits(spentByWs.get(ws.id) ?? 0)} credits
                  lifetime · API ≈ {fmtUSD(cost)} · since {dateFmt.format(ws.createdAt)}
                </p>
              </CardContent>
              <CardFooter className="justify-between gap-2">
                <GrantCreditsDialog workspaceId={ws.id} workspaceName={ws.name} balance={balance} />
                <EnterWorkspaceButton workspaceId={ws.id} />
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {workspaces.length === 0 && (
        <div className="mt-6">
          <EmptyState
            title="No workspaces yet"
            body="Create a customer workspace to set up their brand and start generating."
            action={<NewWorkspaceDialog />}
          />
        </div>
      )}
    </div>
  );
}
