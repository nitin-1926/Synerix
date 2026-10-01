import { notFound } from "next/navigation";
import { listAiModels } from "@/app/actions/models";
import { requireAuth } from "@/lib/auth";
import { getWorkspaceProfile } from "@/lib/workspace-profile-server";
import { showsModelSurface } from "@/lib/workspace-profile";
import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AutoRefresh } from "@/components/auto-refresh";
import { BrandKitTabs } from "@/components/brand-kit-tabs";
import { ModelsClient, DeleteModelButton } from "./models-client";

export const metadata = { title: "AI Models | Synerix Studio" };

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Generating…",
  RUNNING: "Generating…",
  FAILED: "Failed",
};

export default async function ModelsPage() {
  // The Models tab is hidden for non-apparel account types on /brand and
  // /products, but the route itself was reachable by URL — gate it at the page
  // so the account-type decision holds everywhere, not just in the nav.
  const { workspaceId } = await requireAuth();
  const profile = await getWorkspaceProfile(workspaceId);
  if (!showsModelSurface(profile)) notFound();
  const models = await listAiModels();
  const generating = models.some((m) => m.status === "PENDING" || m.status === "RUNNING");

  return (
    <div>
      <AutoRefresh active={generating} />
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Brand Kit</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">AI Models</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Reusable AI models for on-model apparel shoots. Use a preset or generate your own.
      </p>

      <div className="mt-6">
        <BrandKitTabs />
      </div>

      {models.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border-2 border-dashed border-border px-6 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <UserRound className="size-5" />
          </span>
          <h2 className="mt-4 text-base font-semibold text-foreground">No models yet</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Describe the look you want and Studio generates a model you can reuse across apparel shoots.
          </p>
          <div className="mt-6 flex w-full justify-center text-left">
            <ModelsClient />
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6">
            <ModelsClient />
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {models.map((m) => {
              const busy = m.status === "PENDING" || m.status === "RUNNING";
              const failed = m.status === "FAILED";
              return (
                <div key={m.id} className="min-w-0">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-secondary ring-1 ring-foreground/10">
                    {m.thumbUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={m.thumbUrl}
                        alt={m.name}
                        className="absolute inset-0 size-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className={cn(
                          "flex size-full items-center justify-center px-4 text-center text-xs text-muted-foreground",
                          busy && "animate-pulse bg-muted motion-reduce:animate-none",
                        )}
                      >
                        {busy ? "Generating…" : failed ? "No image" : "Preview unavailable"}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5 px-0.5 pt-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <p title={m.name} className="truncate text-sm font-medium text-foreground">
                        {m.name}
                      </p>
                      {m.scope === "BRAND" && <DeleteModelButton modelId={m.id} name={m.name} />}
                    </div>
                    {m.description && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">{m.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant={m.scope === "GLOBAL" ? "secondary" : "outline"}>
                        {m.scope === "GLOBAL" ? "Preset" : "Yours"}
                      </Badge>
                      {m.status !== "READY" && (
                        <Badge
                          variant={failed ? "destructive" : "outline"}
                          className={busy ? "animate-pulse motion-reduce:animate-none" : ""}
                        >
                          {STATUS_LABEL[m.status] ?? m.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
