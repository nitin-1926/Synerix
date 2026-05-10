import { listAiModels } from "@/app/actions/models";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AutoRefresh } from "@/components/auto-refresh";
import { BrandKitTabs } from "@/components/brand-kit-tabs";
import { ModelsClient, DeleteModelButton } from "./models-client";

export const metadata = { title: "AI Models — Synerix Studio" };

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Generating…",
  RUNNING: "Generating…",
  FAILED: "Failed",
};

export default async function ModelsPage() {
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

      <div className="mt-6">
        <ModelsClient />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {models.map((m) => {
          const busy = m.status === "PENDING" || m.status === "RUNNING";
          const failed = m.status === "FAILED";
          return (
            <Card key={m.id} className="group relative h-full gap-0 py-0 overflow-hidden">
              <div className="aspect-[4/5] bg-secondary">
                {m.thumbUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={m.thumbUrl}
                    alt={m.name}
                    className="size-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
                    {busy ? "Generating…" : failed ? "No image" : ""}
                  </div>
                )}
              </div>
              <CardContent className="space-y-2 py-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate font-medium text-foreground">{m.name}</p>
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
                      className={busy ? "animate-pulse" : ""}
                    >
                      {STATUS_LABEL[m.status] ?? m.status}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {models.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
            No models yet — generate your first one above.
          </p>
        )}
      </div>
    </div>
  );
}
