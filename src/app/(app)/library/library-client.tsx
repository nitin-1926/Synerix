"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type CreativeItem = {
  id: string;
  name: string;
  occasion: string;
  url: string | null;
  approved: boolean;
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
  const linkClass =
    "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";
  const disabledClass = "text-sm font-medium text-muted-foreground/40";
  return (
    <div className="mt-8 flex items-center justify-center gap-4">
      {props.page > 1 ? (
        <Link href={props.hrefFor(props.page - 1)} className={linkClass}>
          ← Previous
        </Link>
      ) : (
        <span className={disabledClass}>← Previous</span>
      )}
      <span className="text-xs text-muted-foreground">
        Page {props.page} of {props.pageCount}
      </span>
      {props.page < props.pageCount ? (
        <Link href={props.hrefFor(props.page + 1)} className={linkClass}>
          Next →
        </Link>
      ) : (
        <span className={disabledClass}>Next →</span>
      )}
    </div>
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
          <div className="flex rounded-lg bg-muted p-[3px]">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={cn(
                  "rounded-md px-3 py-1 text-sm font-medium transition-colors",
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
              placeholder="Search by concept name…"
              className="pl-9"
              aria-label="Search creatives"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border py-16 text-center">
            <p className="text-muted-foreground">
              {props.creatives.length === 0
                ? "Nothing here yet."
                : "No creatives match your filters."}
            </p>
            {props.creatives.length === 0 && (
              <Link
                href="/studio"
                className="mt-2 inline-block text-sm font-medium text-primary transition-opacity hover:opacity-80"
              >
                Create your first creative →
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-6 columns-2 gap-4 md:columns-3 lg:columns-4 [&>*]:mb-4">
            {filtered.map((c) => (
              <Link
                key={c.id}
                href={`/library/${c.id}`}
                className="group relative block break-inside-avoid overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                {c.url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={c.url} alt={c.name} className="w-full" loading="lazy" />
                ) : (
                  <div className="aspect-[4/5] bg-secondary" />
                )}
                {c.approved && (
                  <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">
                    <BadgeCheck className="size-3" /> Approved
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent p-3 pt-10 opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="text-xs font-semibold text-white">{c.name}</p>
                  <p className="text-[11px] text-white/70">{c.occasion}</p>
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
          <div className="mt-10 rounded-2xl border border-dashed border-border py-16 text-center">
            <p className="text-muted-foreground">No generation runs yet.</p>
            <Link
              href="/studio"
              className="mt-2 inline-block text-sm font-medium text-primary transition-opacity hover:opacity-80"
            >
              Start your first run →
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {props.runs.map((r) => {
              const chip = runChip(r.status);
              return (
                <Link key={r.id} href={`/studio/${r.id}`} className="group block">
                  <Card className="transition-colors hover:bg-muted/40">
                    <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 font-medium text-foreground">
                          <span className="truncate">{r.title}</span>
                          <Badge
                            variant="outline"
                            className={cn(chip.className, chip.busy && "animate-pulse")}
                          >
                            {chip.label}
                          </Badge>
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {r.brandName}
                          {r.productName ? ` · ${r.productName}` : ""} · {r.when}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {r.creativeCount} creative{r.creativeCount === 1 ? "" : "s"}
                        </span>
                        <span>{r.creditsDebited} credits</span>
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
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
