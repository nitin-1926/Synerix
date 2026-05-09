import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CustomEventForm } from "./custom-event-form";
import { FestivalList, type FestivalListItem } from "./festival-list";

export const metadata = { title: "Calendar — Synerix Studio" };

export default async function CalendarPage() {
  const auth = await requireAuth();
  const brand = await prisma.brand.findFirst({ where: { workspaceId: auth.workspaceId } });
  if (!brand) redirect("/onboarding");

  const [occurrences, customEntries] = await Promise.all([
    prisma.festivalOccurrence.findMany({
      include: { festival: true },
      orderBy: { date: "asc" },
    }),
    prisma.calendarEntry.findMany({
      where: { workspaceId: auth.workspaceId, kind: "CUSTOM", customDate: { not: null } },
      orderBy: { customDate: "asc" },
    }),
  ]);

  const items: FestivalListItem[] = [
    ...occurrences.map((o) => ({
      key: `f-${o.id}`,
      date: o.date.toISOString(),
      name: o.festival.name,
      nameHindi: o.festival.nameHindi,
      category: o.festival.category as string,
      href: `/studio?occasion=${o.id}`,
    })),
    ...customEntries.map((e) => ({
      key: `c-${e.id}`,
      date: e.customDate!.toISOString(),
      name: e.customTitle ?? "Custom occasion",
      nameHindi: null,
      category: "CUSTOM",
      href: `/studio?entry=${e.id}`,
    })),
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Calendar</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
            Festivals &amp; occasions
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Every occasion for your market — tap Create on any to start.
          </p>
        </div>
        <CustomEventForm />
      </div>

      <FestivalList items={items} />
    </div>
  );
}
