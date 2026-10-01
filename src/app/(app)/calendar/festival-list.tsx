"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarSearch, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CATEGORY_DOT: Record<string, string> = {
  RELIGIOUS: "bg-amber-500",
  NATIONAL: "bg-emerald-500",
  COMMERCIAL: "bg-sky-500",
  SEASONAL: "bg-violet-500",
  CUSTOM: "bg-primary",
};

const CATEGORY_LABEL: Record<string, string> = {
  RELIGIOUS: "Religious",
  NATIONAL: "National",
  COMMERCIAL: "Commercial",
  SEASONAL: "Seasonal",
  CUSTOM: "Custom",
};

const CATEGORY_CHIPS = ["ALL", "RELIGIOUS", "NATIONAL", "COMMERCIAL", "SEASONAL"] as const;

export interface FestivalListItem {
  key: string;
  /** ISO date string */
  date: string;
  name: string;
  nameHindi: string | null;
  category: string;
  href: string;
}

function daysAwayLabel(days: number) {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `in ${days} days`;
}

export function FestivalList({ items }: { items: FestivalListItem[] }) {
  const [view, setView] = useState<"upcoming" | "all">("upcoming");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORY_CHIPS)[number]>("ALL");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setFullYear(today.getFullYear() + 1);
  if (horizon.getMonth() !== today.getMonth()) horizon.setDate(0); // Feb 29 -> Feb 28, not Mar 1
  const q = query.trim().toLowerCase();

  const filtered = [...items]
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((item) => {
      const date = new Date(item.date);
      if (view === "upcoming" && (date < today || date > horizon)) return false;
      if (category !== "ALL" && item.category !== category) return false;
      if (
        q &&
        !item.name.toLowerCase().includes(q) &&
        !(item.nameHindi ?? "").toLowerCase().includes(q)
      )
        return false;
      return true;
    });

  const groups: { label: string; items: FestivalListItem[] }[] = [];
  for (const item of filtered) {
    const label = new Date(item.date).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Tabs value={view} onValueChange={(v) => setView(v as "upcoming" | "all")}>
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search festivals…"
            className="pl-8"
            aria-label="Search festivals"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {CATEGORY_CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            aria-pressed={category === c}
            className={cn(
              "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] motion-reduce:transform-none sm:h-8",
              category === c
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {c !== "ALL" && (
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  category === c ? "bg-primary-foreground" : CATEGORY_DOT[c],
                )}
              />
            )}
            {c === "ALL" ? "All" : CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-2xl border-2 border-dashed border-border px-6 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <CalendarSearch className="size-5" />
          </span>
          <h2 className="mt-4 text-base font-semibold text-foreground">No occasions match</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Try a different search, or show every category and date.
          </p>
          <Button
            variant="outline"
            size="lg"
            className="mt-6"
            onClick={() => {
              setQuery("");
              setCategory("ALL");
              setView("all");
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="mt-5 space-y-6">
          {groups.map((group) => (
            <section key={group.label}>
              <h2 className="sticky top-14 z-10 -mx-1 bg-background px-1 py-2 text-sm font-semibold text-foreground md:top-0">
                {group.label}
              </h2>
              <ul className="mt-1 divide-y divide-border overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
                {group.items.map((item) => {
                  const date = new Date(item.date);
                  const days = Math.round((new Date(date).setHours(0, 0, 0, 0) - today.getTime()) / 86_400_000);
                  return (
                    <li key={item.key} className="flex items-center gap-3 px-3 py-3 sm:px-4">
                      <div className="flex w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-secondary py-1.5">
                        <span className="text-lg font-semibold leading-none tabular-nums text-foreground">
                          {String(date.getDate()).padStart(2, "0")}
                        </span>
                        <span className="mt-1 text-[11px] leading-none text-muted-foreground">
                          {date.toLocaleDateString("en-US", { weekday: "short" })}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="truncate font-medium text-foreground">{item.name}</p>
                          <Badge variant="secondary" className="shrink-0 gap-1">
                            <span
                              className={cn(
                                "size-1.5 rounded-full",
                                CATEGORY_DOT[item.category] ?? "bg-muted-foreground",
                              )}
                            />
                            {CATEGORY_LABEL[item.category] ?? item.category}
                          </Badge>
                        </div>
                        {(item.nameHindi || days >= 0) && (
                          <p className="mt-0.5 truncate text-sm text-muted-foreground tabular-nums">
                            {item.nameHindi}
                            {item.nameHindi && days >= 0 && " · "}
                            {days >= 0 &&
                              (days <= 1 ? (
                                <span className="font-medium text-primary">{daysAwayLabel(days)}</span>
                              ) : (
                                daysAwayLabel(days)
                              ))}
                          </p>
                        )}
                      </div>
                      <Button
                        nativeButton={false}
                        render={<Link href={item.href} />}
                        variant="outline"
                        aria-label={`Create for ${item.name}`}
                        className="h-10 shrink-0 active:scale-[0.98] motion-reduce:transform-none sm:h-8"
                      >
                        <Sparkles data-icon="inline-start" />
                        Create
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
