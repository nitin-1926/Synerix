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
import { LogoPicker } from "./logo-picker";
import { LogoUpload } from "./logo-upload";
import { ApparelDefaultControl } from "./apparel-default";
import type { BrandDna } from "@/lib/schemas/brand-dna";

export const metadata = { title: "Brand kit — Synerix Studio" };

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
        <Badge variant={brand.ingestStatus === "READY" ? "secondary" : "outline"}>
          {brand.ingestStatus.toLowerCase()}
        </Badge>
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
              <div className="flex items-center gap-3">
                <Input id="primaryColorHex" name="primaryColorHex" type="color" defaultValue={brand.primaryColorHex ?? "#b83b5e"} className="size-10 shrink-0 cursor-pointer rounded-lg p-1" />
                <span className="font-mono text-sm uppercase text-muted-foreground">{brand.primaryColorHex ?? "#b83b5e"}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accentColorHex">Accent color</Label>
              <div className="flex items-center gap-3">
                <Input id="accentColorHex" name="accentColorHex" type="color" defaultValue={brand.accentColorsHex[0] ?? "#e8862e"} className="size-10 shrink-0 cursor-pointer rounded-lg p-1" />
                <span className="font-mono text-sm uppercase text-muted-foreground">{brand.accentColorsHex[0] ?? "#e8862e"}</span>
              </div>
            </div>
            <div className="space-y-4 sm:col-span-2">
              <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Brand block · logo &amp; contact
              </h2>
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
          <CardTitle className="text-base">Apparel output default</CardTitle>
          <p className="text-sm text-muted-foreground">
            For on-model apparel creatives — applied by default, overridable per generation in the studio.
          </p>
        </CardHeader>
        <CardContent>
          <ApparelDefaultControl value={brand.apparelBrandingDefault} />
        </CardContent>
      </Card>

      {dna && (
        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <DnaCard title="Voice" items={[dna.voice.register.replaceAll("_", " "), ...dna.voice.signature_phrases.slice(0, 3)]} />
          <DnaCard title="Products spotted" items={dna.offering.primary_products.slice(0, 6)} />
          <DnaCard title="Audience" items={[dna.audience.target_customer ?? "—", ...dna.audience.occasions.slice(0, 4)]} />
          <DnaCard
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
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Brand assets</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload your logo, or tap a website-pulled image to set it as your logo.
        </p>
        <LogoUpload />
        {brand.assets.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No assets yet — upload a logo above.</p>
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

function DnaCard({ title, items }: { title: string; items: string[] }) {
  const filtered = items.filter((i) => i && i !== "—");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing detected yet</p>
        ) : (
          <ul className="space-y-1.5">
            {filtered.map((i) => (
              <li key={i} className="text-sm text-foreground">
                {i}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
