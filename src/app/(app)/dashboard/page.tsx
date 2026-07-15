import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Circle,
  Coins,
  Images,
  Package,
  Palette,
  Sparkles,
} from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { getBalance } from "@/lib/credits";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Dashboard — Synerix Studio" };

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
          ? "We couldn't read your website — retry or enter details manually."
          : "Point us at your website — we learn your colors, voice and style.",
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

        <div className="mt-8 max-w-2xl space-y-3">
          {steps.map(({ label, sub, href, done, error, icon: Icon }) => (
            <Link key={label} href={href} className="group block">
              <Card className="flex-row items-center gap-4 px-(--card-spacing) transition-colors hover:bg-muted/40">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 font-medium text-foreground">
                    {label}
                    {done ? (
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                    ) : (
                      <Circle className="size-4 shrink-0 text-muted-foreground/40" />
                    )}
                  </p>
                  <p className={`mt-0.5 text-sm ${error ? "text-destructive" : "text-muted-foreground"}`}>
                    {sub}
                  </p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Card>
            </Link>
          ))}
        </div>
      </>
    );
  }

  const [creativeCount, productCount, upcoming, balance] = await Promise.all([
    prisma.creative.count({ where: { brandId: brand.id, status: "READY", deletedAt: null } }),
    prisma.product.count({ where: { brandId: brand.id } }),
    prisma.festivalOccurrence.findMany({
      where: { date: { gte: new Date() } },
      orderBy: { date: "asc" },
      take: 5,
      include: { festival: true },
    }),
    getBalance(auth.workspaceId),
  ]);

  const stats = [
    { label: "Creatives ready", value: creativeCount, icon: Images, href: "/library" },
    { label: "Festivals upcoming", value: upcoming.length, icon: CalendarDays, href: "/calendar" },
    { label: "Credits", value: balance, icon: Coins, href: "/settings/credits" },
  ];

  return (
    <>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Welcome back
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
        Namaste, {brand.name}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {creativeCount} creatives ready · {upcoming.length} festivals coming up
      </p>

      {(productCount === 0 || balance === 0) && (
        <div className="mt-6 space-y-3">
          {productCount === 0 && (
            <Link href="/products" className="group block">
              <Card className="border border-primary/30 bg-primary/[0.04] ring-0 transition-colors group-hover:bg-primary/[0.07]">
                <CardContent className="flex items-center gap-3">
                  <Package className="size-4 shrink-0 text-primary" />
                  <p className="min-w-0 text-sm font-medium">
                    Add your first product to start generating
                  </p>
                  <ArrowRight className="ml-auto size-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
                </CardContent>
              </Card>
            </Link>
          )}
          {balance === 0 && (
            <Card className="bg-muted/40">
              <CardContent className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <Coins className="size-4 shrink-0" />
                <span>
                  Your workspace has no credits yet — we activate credits after a quick hello.
                </span>
                <a
                  href="mailto:consulting.synerix@gmail.com"
                  className="font-medium text-primary hover:underline"
                >
                  Say hello
                </a>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href} className="block">
            <Card className="transition-colors hover:bg-muted/40">
              <CardContent className="flex items-center gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="text-2xl font-semibold tracking-tight">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Plan your next post
          </h2>
          <Link
            href="/calendar"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-opacity hover:opacity-80"
          >
            View calendar <ArrowRight className="size-3.5" />
          </Link>
        </div>
        {/* No auto-rows-fr: it forces every row to the tallest card's height,
            leaving festival cards with a slab of dead space in the middle. */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((o) => (
            <Link key={o.id} href={`/studio?occasion=${o.id}`} className="group block">
              <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
                <CardContent className="flex h-full flex-col">
                  <p className="text-xs font-medium uppercase tracking-wide text-primary">
                    {o.date.toLocaleDateString("en-IN", { day: "numeric", month: "long" })}
                  </p>
                  <p className="mt-2 text-xl font-semibold tracking-tight">{o.festival.name}</p>
                  {o.festival.nameHindi && (
                    <p className="text-sm text-muted-foreground">{o.festival.nameHindi}</p>
                  )}
                  <p className="mt-auto pt-4 inline-flex items-center gap-1 text-xs font-medium text-primary">
                    Generate creatives
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}

          {/* The "create something custom" tile — the sixth card, in-grid. */}
          <Link href="/studio" className="group block">
            <Card className="h-full border-2 border-dashed border-primary/30 bg-primary/[0.04] ring-0 transition-colors group-hover:border-primary/50 group-hover:bg-primary/[0.07]">
              <CardContent className="flex h-full flex-col items-center justify-center py-4 text-center">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="size-4" />
                </span>
                <p className="mt-2 font-semibold">Need something custom?</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  A sale, a new dish, a store opening — describe it
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  Create a custom creative <ArrowRight className="size-3.5" />
                </span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>
    </>
  );
}
