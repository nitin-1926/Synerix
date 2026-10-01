import { ImageIcon } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureBrand } from "@/lib/ensure-brand";
import { getSignedUrls } from "@/lib/storage";
import { getWorkspaceProfile } from "@/lib/workspace-profile-server";
import { showsModelSurface } from "@/lib/workspace-profile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BrandKitTabs } from "@/components/brand-kit-tabs";
import { BrandKitForm } from "./brand-kit-form";
import { RefreshIntelButton } from "./refresh-intel";
import { CREDIT_COSTS } from "@/lib/ai/models";
import { LogoPicker } from "./logo-picker";
import { LogoUpload } from "./logo-upload";
import { ApparelDefaultControl } from "./apparel-default";
import { ColorField } from "./color-field";
import type { BrandDna } from "@/lib/schemas/brand-dna";

export const metadata = { title: "Brand kit | Synerix Studio" };

const INGEST_LABEL: Record<string, string> = {
  PENDING: "Website read queued",
  CRAWLING: "Reading your website…",
  EXTRACTING: "Reading your website…",
  FAILED: "Website read failed",
};

export default async function BrandPage() {
  const auth = await requireAuth();
  await ensureBrand(auth.workspaceId, auth.workspaceName);
  const brand = await prisma.brand.findFirstOrThrow({
    where: { workspaceId: auth.workspaceId },
    include: { assets: { orderBy: [{ isPrimaryLogo: "desc" }, { createdAt: "asc" }] } },
  });

  const dna = brand.dna as BrandDna | null;
  const [urls, profile] = await Promise.all([
    getSignedUrls(brand.assets.map((a) => a.storageKey)),
    getWorkspaceProfile(auth.workspaceId),
  ]);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Brand Kit
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">Brand kit</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Everything Studio knows about your brand. Creatives inherit these automatically.
          </p>
        </div>
        {/* READY is the normal state; only surface the in-flight / failed ones. */}
        {brand.ingestStatus !== "READY" && (
          <Badge variant={brand.ingestStatus === "FAILED" ? "destructive" : "outline"} className="shrink-0">
            {INGEST_LABEL[brand.ingestStatus] ?? brand.ingestStatus}
          </Badge>
        )}
      </div>

      <div className="mt-6">
        <BrandKitTabs showModels={showsModelSurface(profile)} />
      </div>

      <Card className="mt-8">
        <CardContent>
          <BrandKitForm>
            <div className="space-y-2">
              <Label htmlFor="name">Business name</Label>
              <Input id="name" name="name" defaultValue={brand.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motto">Tagline / motto</Label>
              <Input id="motto" name="motto" defaultValue={brand.mottoText ?? ""} placeholder="Appears on every creative" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="oneLiner">One-liner</Label>
              <Input id="oneLiner" name="oneLiner" defaultValue={brand.oneLiner ?? ""} />
            </div>
            {/* Compact swatches — a full-width native color input reads as a
                giant unlabeled bar, not a color field. */}
            <div className="space-y-2">
              <Label htmlFor="primaryColorHex">Primary color</Label>
              <ColorField id="primaryColorHex" defaultValue={brand.primaryColorHex ?? "#b83b5e"} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accentColorHex">Accent color</Label>
              <ColorField id="accentColorHex" defaultValue={brand.accentColorsHex[0] ?? "#e8862e"} />
            </div>
            <div className="space-y-4 border-t border-border pt-5 sm:col-span-2">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Logo &amp; contact</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  How the brand block sits on your creatives.
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="contactLine">Contact line</Label>
                  <Input
                    id="contactLine"
                    name="contactLine"
                    maxLength={80}
                    defaultValue={brand.contactLine ?? ""}
                    placeholder="For business queries: 98xxxxxxxx"
                  />
                  <p className="text-xs text-muted-foreground">
                    Shown only on creatives where you turn it on.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logoCorner">Logo corner</Label>
                  <Select name="logoCorner" defaultValue={brand.logoCorner ?? "TL"}>
                    <SelectTrigger id="logoCorner" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TL">Top-left</SelectItem>
                      <SelectItem value="TR">Top-right</SelectItem>
                      <SelectItem value="TC">Top-center</SelectItem>
                      <SelectItem value="BL">Bottom-left</SelectItem>
                      <SelectItem value="BR">Bottom-right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logoScale">Logo scale</Label>
                  <Input
                    id="logoScale"
                    name="logoScale"
                    type="number"
                    step={0.1}
                    min={0.5}
                    max={2}
                    defaultValue={brand.logoScale ?? 1}
                  />
                </div>
              </div>
            </div>
          </BrandKitForm>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Brand research</CardTitle>
          <p className="text-sm text-muted-foreground">
            Web-grounded evidence about your category: the ad patterns, customer language and
            angles that work. Every generation reads this when building its brief. Refresh it after
            a repositioning or a new product line.
          </p>
        </CardHeader>
        <CardContent>
          <RefreshIntelButton
            brandId={brand.id}
            cost={CREDIT_COSTS.brandIntel}
            lastRefreshedAt={
              brand.creativeIntelAt
                ? brand.creativeIntelAt.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    // Server renders in UTC; without this an early-morning IST
                    // refresh shows yesterday's date.
                    timeZone: "Asia/Kolkata",
                  })
                : null
            }
          />
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Apparel output default</CardTitle>
          <p className="text-sm text-muted-foreground">
            For on-model apparel creatives: applied by default, overridable per generation in the studio.
          </p>
        </CardHeader>
        <CardContent>
          <ApparelDefaultControl value={brand.apparelBrandingDefault} />
        </CardContent>
      </Card>

      {dna && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">What Studio learned about your brand</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
              <DnaItem title="Voice" items={[dna.voice.register.replaceAll("_", " "), ...dna.voice.signature_phrases.slice(0, 3)]} />
              <DnaItem title="Products spotted" items={dna.offering.primary_products.slice(0, 6)} />
              <DnaItem title="Audience" items={[dna.audience.target_customer ?? "—", ...dna.audience.occasions.slice(0, 4)]} />
              <DnaItem
                title="Positioning"
                items={[
                  dna.positioning.promise ?? "—",
                  // Hide the price row when research couldn't determine it —
                  // "price: unknown" reads as a bug, not a fact.
                  ...(dna.positioning.price_band && dna.positioning.price_band !== "unknown"
                    ? [`Price band: ${dna.positioning.price_band}`]
                    : []),
                ]}
              />
            </dl>
          </CardContent>
        </Card>
      )}

      <section className="mt-10">
        <h2 className="text-base font-semibold text-foreground">Brand assets</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload your logo, or tap a website-pulled image to set it as your logo.
        </p>
        <LogoUpload />
        {brand.assets.length === 0 ? (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
            <ImageIcon className="size-5 shrink-0" />
            No logo yet. Upload one so it can appear on your creatives.
          </div>
        ) : (
          <LogoPicker
            assets={brand.assets.map((a) => ({
              id: a.id,
              kind: a.kind,
              url: urls[a.storageKey] ?? "",
              isPrimaryLogo: a.isPrimaryLogo,
            }))}
          />
        )}
      </section>
    </div>
  );
}

function DnaItem({ title, items }: { title: string; items: string[] }) {
  const filtered = items.filter((i) => i && i !== "—");
  return (
    <div>
      <dt className="text-sm font-medium text-muted-foreground">{title}</dt>
      {filtered.length === 0 ? (
        <dd className="mt-1.5 text-sm text-muted-foreground">Nothing detected yet</dd>
      ) : (
        <dd className="mt-1.5">
          <ul className="space-y-1">
            {filtered.map((i) => (
              <li key={i} className="text-sm text-foreground first-letter:uppercase">
                {i}
              </li>
            ))}
          </ul>
        </dd>
      )}
    </div>
  );
}
