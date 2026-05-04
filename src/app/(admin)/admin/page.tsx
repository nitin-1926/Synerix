import { prisma } from "@/lib/db";
import { getSignedThumbUrls } from "@/lib/storage";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EnterWorkspaceButton, GrantCreditsDialog, RenameWorkspaceDialog } from "./workspace-actions";
import { NewWorkspaceDialog } from "./new-workspace-dialog";

function formatUSD(n: number) {
  return `$${n.toFixed(2)}`;
}

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function AdminWorkspacesPage() {
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
    { label: "Workspaces", value: String(workspaces.length) },
    { label: "Creatives", value: String(totalCreatives) },
    { label: "Credits outstanding", value: String(creditsOutstanding) },
    { label: "Total API cost", value: formatUSD(totalCost) },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Workspaces</h2>
          <p className="text-sm text-muted-foreground">Every customer you manage. Click a card to work inside their brand.</p>
        </div>
        <NewWorkspaceDialog />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {workspaces.map((ws) => {
          const balance = Number(ws.credits?.balance ?? 0);
          const cost = costByWs.get(ws.id) ?? 0;
          const primaryBrand = ws.brands[0];
          const brandLabel = ws.brands.map((b) => b.name).join(", ");
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
            <Card key={ws.id} className="flex flex-col">
              <CardHeader className="flex-row items-start gap-3 space-y-0">
                <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt={primaryBrand?.name ?? ws.name} className="size-full object-contain p-1" />
                  ) : (
                    <span className="text-base font-semibold text-muted-foreground">
                      {(primaryBrand?.name ?? ws.name).charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="truncate text-base">{primaryBrand?.name ?? ws.name}</CardTitle>
                  <p className="truncate text-xs text-muted-foreground">
                    {ws.name}
                    {" · "}
                    {ws.owner.email}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${healthClass}`}>
                    {balance} cr
                  </span>
                  <RenameWorkspaceDialog workspaceId={ws.id} workspaceName={ws.name} />
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary">{ws._count.memberships} members</Badge>
                  <Badge variant="secondary">{ws._count.brands} brands</Badge>
                  <Badge variant="secondary">{creativesByWs.get(ws.id) ?? 0} creatives</Badge>
                </div>
                {ws.brands.length > 1 && (
                  <p className="truncate text-xs text-muted-foreground">Brands: {brandLabel}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  +{grantedByWs.get(ws.id) ?? 0} / −{spentByWs.get(ws.id) ?? 0} lifetime · API ≈{" "}
                  {formatUSD(cost)} · {ws._count.generationRuns} runs · {dateFmt.format(ws.createdAt)}
                </p>
              </CardContent>
              <CardFooter className="gap-2">
                <EnterWorkspaceButton workspaceId={ws.id} />
                <GrantCreditsDialog workspaceId={ws.id} workspaceName={ws.name} balance={balance} />
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {workspaces.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">No workspaces yet.</p>
      )}
    </div>
  );
}
