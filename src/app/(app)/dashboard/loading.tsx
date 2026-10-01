import { Skeleton } from "@/components/ui/skeleton";

/** Shaped like the dashboard: hero, creatives strip, occasion list. */
export default function DashboardLoading() {
  return (
    <div className="animate-in fade-in duration-200">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-9 w-72 max-w-full" />
      <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      <Skeleton className="mt-10 h-5 w-40" />
      <div className="mt-4 flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/5] h-52 shrink-0 rounded-2xl md:h-60" />
        ))}
      </div>
      <Skeleton className="mt-10 h-5 w-44" />
      <Skeleton className="mt-4 h-80 rounded-2xl" />
    </div>
  );
}
