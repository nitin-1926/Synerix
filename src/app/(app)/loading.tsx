import { Skeleton } from "@/components/ui/skeleton";

/** Shown instantly on every in-app navigation while the page's server data
 *  streams — the sidebar (in the layout) stays put, so tab switches feel
 *  immediate instead of blank-then-jump. */
export default function AppLoading() {
  return (
    <div className="animate-in fade-in duration-200">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-9 w-72 max-w-full" />
      <Skeleton className="mt-3 h-4 w-56 max-w-full" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
