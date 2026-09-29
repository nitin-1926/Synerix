"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, ChevronLeft, ChevronRight, ImageIcon, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type CreativeItem = {
  id: string;
  name: string;
  occasion: string;
  url: string | null;
  approved: boolean;
  /** CSS aspect-ratio ("4 / 5") so the grid reserves space before load. */
  aspect?: string;
};

type RunItem = {
  id: string;
  title: string;
  productName: string | null;
  brandName: string;
  status: string;
  when: string;
  creditsDebited: number;
  creativeCount: number;
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "approved", label: "Approved" },
  { value: "drafts", label: "Drafts" },
] as const;

type Filter = (typeof FILTERS)[number]["value"];

function runChip(status: string): { label: string; className: string; busy: boolean } {
  switch (status) {
    case "COMPLETE":
      return {
        label: "Complete",
        className: "border-transparent bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        busy: false,
      };
    case "PARTIAL":
      return {
        label: "Partial",
        className: "border-transparent bg-amber-500/10 text-amber-600 dark:text-amber-400",
        busy: false,
      };
    case "FAILED":
      return {
        label: "Failed",
        className: "border-transparent bg-destructive/10 text-destructive",
        busy: false,
      };
    default:
      return {
        label: "Running",
        className: "border-border text-muted-foreground",
        busy: true,
      };
  }
}

type Pagination = {
  creativesPage: number;
  creativesPageCount: number;
  runsPage: number;
  runsPageCount: number;
};

function Pager(props: { page: number; pageCount: number; hrefFor: (page: number) => string }) {
  if (props.pageCount <= 1) return null;
  const base = "inline-flex h-10 items-center gap-1 rounded-full px-4 text-sm font-medium";
  const linkClass = cn(
    base,
    "text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-[0.98] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none",
  );
  const disabledClass = cn(base, "cursor-not-allowed text-muted-foreground/40");
  const prev = (
    <>
      <ChevronLeft className="size-4" /> Previous
    </>
  );
  const next = (
    <>
      Next <ChevronRight className="size-4" />
    </>
  );
  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-2">
      {props.page > 1 ? (
        <Link href={props.hrefFor(props.page - 1)} className={linkClass}>
          {prev}
        </Link>
      ) : (
        <span aria-disabled className={disabledClass}>
          {prev}
        </span>
      )}
      <span className="text-xs tabular-nums text-muted-foreground">
        Page {props.page} of {props.pageCount}
      </span>
      {props.page < props.pageCount ? (
        <Link href={props.hrefFor(props.page + 1)} className={linkClass}>
          {next}
        </Link>
      ) : (
        <span aria-disabled className={disabledClass}>
          {next}
        </span>
      )}
    </nav>
  );
}

export function LibraryClient(props: {
  creatives: CreativeItem[];
  runs: RunItem[];
  initialTab: "creatives" | "generations";
  pagination: Pagination;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const { creativesPage, creativesPageCount, runsPage, runsPageCount } = props.pagination;

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return props.creatives.filter((c) => {
      if (filter === "approved" && !c.approved) return false;
      if (filter === "drafts" && c.approved) return false;
      if (!q) return true;
      return (
        c.name.toLocaleLowerCase().includes(q) || c.occasion.toLocaleLowerCase().includes(q)
      );
    });
  }, [props.creatives, filter, query]);

  return (
    <Tabs defaultValue={props.initialTab} className="mt-6">
      <TabsList variant="line">
        <TabsTrigger value="creatives">Creatives</TabsTrigger>
        <TabsTrigger value="generations">Generations</TabsTrigger>
      </TabsList>

      <TabsContent value="creatives">
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex rounded-full bg-muted p-1">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                className={cn(
                  "cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  filter === value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or occasion…"
              className="pl-9"
              aria-label="Search creatives"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              {props.creatives.length === 0 ? <ImageIcon className="size-5" /> : <Search className="size-5" />}
            </span>
            <p className="mt-4 font-medium text-foreground">
              {props.creatives.length === 0 ? "No creatives yet" : "No creatives match"}
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {props.creatives.length === 0
                ? "Everything you generate in Create lands here, ready to edit, approve and download."
                : "Try another search, or clear the filters to see everything on this page."}
            </p>
            {props.creatives.length === 0 ? (
              <Button className="mt-5 rounded-full" nativeButton={false} render={<Link href="/studio" />}>
                Create your first creative
              </Button>
            ) : (
              <Button
                variant="outline"
                className="mt-5 rounded-full"
                onClick={() => {
                  setFilter("all");
                  setQuery("");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="mt-6 columns-2 gap-4 md:columns-3 lg:columns-4 [&>*]:mb-4">
            {filtered.map((c) => (
              <Link
                key={c.id}
                href={`/library/${c.id}`}
                className="group relative block cursor-pointer break-inside-avoid overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                {c.url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={c.url}
                    alt={c.name}
                    className="w-full bg-secondary"
                    // `auto` reserves the stored ratio before load, then yields to the
                    // image's natural ratio so a mismatched render is never stretched.
                    style={{ aspectRatio: `auto ${c.aspect ?? "4 / 5"}` }}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="aspect-[4/5] bg-secondary" />
                )}
                {c.approved && (
                  <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-600/90 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                    <BadgeCheck className="size-3" /> Approved
                  </span>
                )}
                {/* Hover-only captions left touch users (no hover) with nameless tiles:
                    always shown where hover doesn't exist, and on keyboard focus. */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent p-3 pt-10 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none [@media(hover:none)]:opacity-100">
                  <p className="truncate text-xs font-semibold text-white">{c.name}</p>
                  <p className="truncate text-[11px] text-white/70">{c.occasion}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
        <Pager
          page={creativesPage}
          pageCount={creativesPageCount}
          hrefFor={(page) => `/library?page=${page}&rpage=${runsPage}`}
        />
      </TabsContent>

      <TabsContent value="generations">
        {props.runs.length === 0 ? (
          <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
            <p className="font-medium text-foreground">No generation runs yet</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Each time you create, the run shows here with its status and credits used.
            </p>
            <Button className="mt-5 rounded-full" nativeButton={false} render={<Link href="/studio" />}>
              Start your first run
            </Button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {props.runs.map((r) => {
              const chip = runChip(r.status);
              return (
                <Link
                  key={r.id}
                  href={`/studio/${r.id}`}
                  className="group block rounded-xl transition-transform duration-150 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-[0.99] motion-reduce:transition-none"
                >
                  <Card className="transition-colors hover:bg-muted/40">
                    <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 font-medium text-foreground">
                          <span className="truncate">{r.title}</span>
                          <Badge
                            variant="outline"
                            className={cn(chip.className, chip.busy && "animate-pulse motion-reduce:animate-none")}
                          >
                            {chip.label}
                          </Badge>
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {r.brandName}
                          {r.productName ? ` · ${r.productName}` : ""} · {r.when}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs tabular-nums text-muted-foreground">
                        <span>
                          {r.creativeCount.toLocaleString("en-IN")} creative{r.creativeCount === 1 ? "" : "s"}
                        </span>
                        <span>
                          {r.creditsDebited.toLocaleString("en-IN")} credit{r.creditsDebited === 1 ? "" : "s"}
                        </span>
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
        <Pager
          page={runsPage}
          pageCount={runsPageCount}
          hrefFor={(page) => `/library?tab=generations&page=${creativesPage}&rpage=${page}`}
        />
      </TabsContent>
    </Tabs>
  );
}
