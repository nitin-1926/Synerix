import Link from "next/link";
import { ArrowRight, Check, ChevronRight, Coins, Images, Package, Palette, Sparkles } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { getBalance } from "@/lib/credits";
import { prisma } from "@/lib/db";
import { getSignedThumbUrls } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { todayIST } from "@/lib/ist-date";

export const metadata = { title: "Dashboard | Synerix Studio" };

const RECENT_CREATIVES = 8;

/** Festival dates are `@db.Date` (UTC midnight); "today" is the user's day in India. */
function daysUntil(date: Date) {
  const today = new Date(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }));
  return Math.round((date.getTime() - today.getTime()) / 86_400_000);
}

function daysAwayLabel(days: number) {
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `in ${days} days`;
}

export default async function DashboardPage() {
  const auth = await requireAuth();
  const brand = await prisma.brand.findFirst({ where: { workspaceId: auth.workspaceId } });

  // Workspace not set up yet: show the setup checklist instead of the grid.
  if (!brand || brand.ingestStatus !== "READY") {
    const [productCount, runCount] = brand
      ? await Promise.all([
          prisma.product.count({ where: { brandId: brand.id } }),
          prisma.generationRun.count({ where: { workspaceId: auth.workspaceId } }),
        ])
      : [0, 0];
    const ingestFailed = brand?.ingestStatus === "FAILED";
    const steps = [
      {
        label: "Set up your brand",
        sub: ingestFailed
          ? "We couldn't read your website. Retry or enter details manually."
          : "Point us at your website: we learn your colors, voice and style.",
        href: "/onboarding",
        done: brand?.ingestStatus === "READY",
        error: ingestFailed,
        icon: Palette,
      },
      {
        label: "Add a product",
        sub: "Upload a photo of what you sell.",
        href: "/products",
        done: productCount > 0,
        error: false,
        icon: Package,
      },
      {
        label: "Generate your first creatives",
        sub: "Pick an occasion and get creative options to choose from.",
        href: "/studio",
        done: runCount > 0,
        error: false,
        icon: Sparkles,
      },
    ];

    return (
      <>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Welcome
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
          Let&apos;s get you set up
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Three quick steps to your first creatives.
        </p>

        <ol className="mt-8 max-w-2xl divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {steps.map(({ label, sub, href, done, error, icon: Icon }) => (
            <li key={label}>
              <Link
                href={href}
                className="group flex items-center gap-4 px-4 py-4 outline-none transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring active:bg-muted/60 sm:px-5"
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full",
                    done ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400" : "bg-primary/10 text-primary",
                  )}
                >
                  {done ? <Check className="size-5" /> : <Icon className="size-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn("font-medium", done ? "text-muted-foreground" : "text-foreground")}>
                    {label}
                    {done && <span className="sr-only"> (done)</span>}
                  </p>
                  <p className={cn("mt-0.5 text-sm", error ? "text-destructive" : "text-muted-foreground")}>
                    {sub}
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
              </Link>
            </li>
          ))}
        </ol>
      </>
    );
  }

  const [creativeCount, productCount, recent, upcoming, balance] = await Promise.all([
    prisma.creative.count({ where: { brandId: brand.id, status: "READY", deletedAt: null } }),
    prisma.product.count({ where: { brandId: brand.id } }),
    // Same shape as the library grid (library/page.tsx), minus the occasion join.
    prisma.creative.findMany({
      where: { brandId: brand.id, status: "READY", deletedAt: null },
      select: {
        id: true,
        masterAspect: true,
        renders: {
          where: { status: "COMPOSED" },
          take: 1,
          select: { composedImageKey: true, aspectRatio: true },
        },
        concept: true,
      },
      orderBy: { createdAt: "desc" },
      take: RECENT_CREATIVES,
    }),
    prisma.festivalOccurrence.findMany({
      where: { date: { gte: todayIST() } },
      orderBy: { date: "asc" },
      take: 5,
      include: { festival: true },
    }),
    getBalance(auth.workspaceId),
  ]);

  const urls = await getSignedThumbUrls(
    recent.flatMap((c) => c.renders.map((r) => r.composedImageKey).filter((k): k is string => Boolean(k))),
    600,
  );
  const recentItems = recent.map((c) => {
    const render = c.renders[0];
    return {
      id: c.id,
      name: (c.concept as { name: string }).name,
      aspect: (render?.aspectRatio ?? c.masterAspect ?? "4:5").replace(":", " / "),
      url: render?.composedImageKey ? (urls[render.composedImageKey] ?? null) : null,
    };
  });

  return (
    <>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Welcome back
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
            Namaste, {brand.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            <Link
              href="/library"
              className="font-medium text-foreground tabular-nums underline-offset-4 hover:underline"
            >
              {creativeCount.toLocaleString("en-IN")} {creativeCount === 1 ? "creative" : "creatives"}
            </Link>{" "}
            ready. Pick an occasion or start from your own idea.
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/studio" />}
          size="lg"
          className="h-10 shrink-0 self-start px-4 active:scale-[0.98] sm:self-auto"
        >
          <Sparkles /> New creative
        </Button>
      </div>

      {(productCount === 0 || balance === 0) && (
        <div className="mt-6 space-y-3">
          {productCount === 0 && (
            <Link
              href="/products"
              className="group flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/[0.04] px-4 py-3.5 outline-none transition-colors hover:bg-primary/[0.07] focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Package className="size-4 shrink-0 text-primary" />
              <p className="min-w-0 text-sm font-medium">Add your first product to start generating</p>
              <ArrowRight className="ml-auto size-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
            </Link>
          )}
          {balance === 0 && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl bg-muted/50 px-4 py-3.5 text-sm text-muted-foreground">
              <Coins className="size-4 shrink-0" />
              <span>Your workspace has no credits yet. We activate credits after a quick hello.</span>
              <a
                href="mailto:consulting.synerix@gmail.com"
                className="font-medium text-primary hover:underline"
              >
                Say hello
              </a>
            </div>
          )}
        </div>
      )}

      <section className="mt-10">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight">Recent creatives</h2>
          {recentItems.length > 0 && (
            <Link
              href="/library"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-opacity hover:opacity-80"
            >
              View all <ArrowRight className="size-3.5" />
            </Link>
          )}
        </div>

        {recentItems.length > 0 ? (
          // Fixed row height, width from each creative's own aspect: formats
          // stay uncropped. Bleeds to the screen edge on mobile.
          <div className="-mx-4 mt-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:thin] sm:mx-0 sm:scroll-px-0 sm:px-0">
            {recentItems.map((c) => (
              <Link
                key={c.id}
                href={`/library/${c.id}`}
                className="group shrink-0 snap-start outline-none transition-transform duration-150 active:scale-[0.98] motion-reduce:transition-none"
              >
                <div
                  className="h-52 overflow-hidden rounded-2xl border border-border bg-secondary group-focus-visible:outline-2 group-focus-visible:-outline-offset-2 group-focus-visible:outline-ring md:h-60"
                  style={{ aspectRatio: c.aspect }}
                >
                  {c.url && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={c.url}
                      alt={c.name}
                      className="size-full object-cover transition-transform duration-200 group-hover:scale-[1.03] motion-reduce:transition-none"
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                </div>
                {/* w-0 + min-w-full: caption takes the image's width instead of widening the item. */}
                <p className="mt-2 w-0 min-w-full truncate text-sm font-medium text-foreground/80 group-hover:text-foreground">
                  {c.name}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-10 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Images className="size-5" />
            </span>
            <p className="mt-3 font-medium">No creatives yet</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Finished creatives land here, ready to download or edit.
            </p>
            <Button
              nativeButton={false}
              render={<Link href="/studio" />}
              variant="outline"
              className="mt-5 h-10 px-4 active:scale-[0.98]"
            >
              <Sparkles /> New creative
            </Button>
          </div>
        )}
      </section>

      {upcoming.length > 0 && (
        <section className="mt-10">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight">Plan your next post</h2>
            <Link
              href="/calendar"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-opacity hover:opacity-80"
            >
              View calendar <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {upcoming.map((o) => {
              const days = daysUntil(o.date);
              return (
                <li key={o.id}>
                  <Link
                    href={`/studio?occasion=${o.id}`}
                    className="group flex items-center gap-4 px-4 py-3.5 outline-none transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring active:bg-muted/60 sm:px-5"
                  >
                    <span className="flex w-12 shrink-0 flex-col items-center leading-none">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                        {o.date.toLocaleDateString("en-IN", { month: "short", timeZone: "UTC" })}
                      </span>
                      <span className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
                        {o.date.toLocaleDateString("en-IN", { day: "numeric", timeZone: "UTC" })}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{o.festival.name}</span>
                      <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                        {o.festival.nameHindi ? `${o.festival.nameHindi} · ` : ""}
                        <span className={cn("tabular-nums", days <= 1 && "font-medium text-primary")}>
                          {daysAwayLabel(days)}
                        </span>
                      </span>
                    </span>
                    <span className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary sm:inline-flex">
                      Generate creatives
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground sm:hidden" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}
