"use client";

import { useState } from "react";
import Link from "next/link";
import { addMonths, differenceInCalendarDays, format, startOfDay } from "date-fns";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

  const today = startOfDay(new Date());
  const horizon = addMonths(today, 12);
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
    const label = format(new Date(item.date), "MMMM yyyy");
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
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
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
        <p className="py-16 text-center text-sm text-muted-foreground">
          No occasions match — try a different search or filter.
        </p>
      ) : (
        <div className="mt-5 space-y-7">
          {groups.map((group) => (
            <section key={group.label}>
              <h2 className="sticky top-14 z-10 -mx-1 bg-background/95 px-1 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground backdrop-blur-sm md:top-0">
                {group.label}
              </h2>
              <div className="mt-1 space-y-2.5">
                {group.items.map((item) => {
                  const date = new Date(item.date);
                  const days = differenceInCalendarDays(date, new Date());
                  return (
                    <Card
                      key={item.key}
                      className="flex-row items-center gap-3 px-(--card-spacing)"
                    >
                      <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-secondary py-1.5">
                        <span className="text-sm font-semibold leading-tight text-foreground">
                          {format(date, "dd MMM")}
                        </span>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {format(date, "EEE")}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
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
                          <p className="mt-0.5 truncate text-sm text-muted-foreground">
                            {item.nameHindi}
                            {item.nameHindi && days >= 0 && " · "}
                            {days >= 0 &&
                              (days === 0 ? (
                                <span className="font-medium text-primary">Today</span>
                              ) : (
                                daysAwayLabel(days)
                              ))}
                          </p>
                        )}
                      </div>
                      <Button
                        nativeButton={false}
                        render={<Link href={item.href} />}
                        size="sm"
                        variant="outline"
                        className="shrink-0"
                      >
                        Create
                      </Button>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
