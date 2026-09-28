"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowRight, Check, ImageIcon, Layers, Plus, Sparkles, UserSquare, Wand2 } from "lucide-react";
import Link from "next/link";
import { startGenerationRun } from "@/app/actions/generate";
import { enhanceUserPrompt } from "@/app/actions/enhance";
import { NewProductDialog, type InlineProduct } from "./new-product-dialog";
import { CREDIT_COSTS, LIMITS } from "@/lib/ai/models";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** How many picker cards to show inline before collapsing into "Browse all". */
const INLINE_LIMIT = 6;

type ModelTraits = { ageBand?: string; gender?: string; look?: string } | null;

const ASPECTS = [
  { id: "4:5", label: "Feed 4:5" },
  { id: "1:1", label: "Square" },
  { id: "9:16", label: "Story" },
  { id: "16:9", label: "Wide" },
];
const LANGS = [
  { id: "en", label: "English" },
  { id: "hinglish", label: "Hinglish" },
  { id: "hi", label: "हिन्दी" },
  { id: "pa", label: "ਪੰਜਾਬੀ" },
];
// On-model pose presets ("" = auto, let the AI vary it per option).
const POSES: { label: string; value: string }[] = [
  { label: "Auto", value: "" },
  { label: "Standing", value: "standing confidently, facing the camera" },
  { label: "Walking", value: "walking mid-stride, candid street style" },
  { label: "Seated", value: "seated and relaxed" },
  { label: "3/4 turn", value: "in a three-quarter turn, glancing over the shoulder" },
  { label: "Hands in pockets", value: "leaning casually with hands in pockets" },
  { label: "Candid", value: "looking away from camera, candid editorial moment" },
];

type ProductCategory = "FMCG" | "APPAREL" | "OTHER";
type Product = { id: string; name: string; category: ProductCategory; dissectionReady: boolean; imageUrl: string | null };
type AiModel = { id: string; name: string; description: string | null; thumbUrl: string | null; scope: "GLOBAL" | "BRAND"; traits: unknown };
type BrandingMode = "BRANDED" | "PLAIN";

export function CreateForm(props: {
  occasionId: string | null;
  entryId: string | null;
  isOccasion: boolean;
  occasionTitle: string | null;
  /** Upcoming festivals for the in-form picker (deep links preselect instead). */
  upcomingOccasions: { id: string; title: string; dateLabel: string }[];
  products: Product[];
  aiModels: AiModel[];
  preselectedProductId: string | null;
  apparelBrandingDefault: BrandingMode;
  creditBalance: number;
}) {
  const [tab, setTab] = useState<"guided" | "direct">("guided");
  const [products, setProducts] = useState<Product[]>(props.products);
  const [productId, setProductId] = useState<string | null>(props.preselectedProductId ?? props.products[0]?.id ?? null);
  const [renderMode, setRenderMode] = useState<"in_scene" | "composite" | "on_model">("in_scene");
  const [aiModelId, setAiModelId] = useState<string | null>(props.aiModels[0]?.id ?? null);
  const [brandingMode, setBrandingMode] = useState<BrandingMode>(props.apparelBrandingDefault);
  // On-model poses (multi-select): each selected pose → one image of the SAME
  // model + garment. Empty = a single AI-varied pose. `customPose` is appended
  // as one more pose when filled.
  const [poses, setPoses] = useState<string[]>([]);
  const [customPose, setCustomPose] = useState("");
  const [language, setLanguage] = useState("en");
  const [optionCount, setOptionCount] = useState(LIMITS.maxConceptsPerRun);
  const [aspects, setAspects] = useState<string[]>(["4:5"]);
  const [brief, setBrief] = useState("");
  // In-form festival pick (only when not deep-linked from home/calendar).
  const [pickedOccasionId, setPickedOccasionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [enhancing, setEnhancing] = useState(false);

  async function handleEnhance() {
    setEnhancing(true);
    try {
      const res = await enhanceUserPrompt({ text: brief, mode: "scene" });
      // Toast, not the summary-column error slot — that renders far from the
      // Enhance button and reads like a submit failure.
      if ("error" in res) toast.error(res.error);
      else setBrief(res.enhanced);
    } finally {
      setEnhancing(false);
    }
  }

  const selectedProduct = products.find((p) => p.id === productId);

  // Default the render mode when the chosen product changes: apparel → on-model
  // (the garment must be fused onto a model); everything else → in-scene, where
  // the model integrates the real product with matched light and perspective
  // (most deployable look). Exact cut-out composite is opt-in for clean packshot
  // concepts via the toggle below.
  useEffect(() => {
    const p = products.find((x) => x.id === productId);
    if (!p) { setRenderMode("in_scene"); return; }
    if (p.category === "APPAREL") { setRenderMode("on_model"); return; }
    setRenderMode("in_scene");
  }, [productId, products]);

  const selectedModel = props.aiModels.find((m) => m.id === aiModelId);
  const onModel = renderMode === "on_model" && Boolean(selectedProduct);
  const direct = tab === "direct" && !props.isOccasion;
  const pickedOccasion = props.upcomingOccasions.find((o) => o.id === pickedOccasionId) ?? null;
  const hasOccasion = props.isOccasion || (!direct && Boolean(pickedOccasion));
  // A selected product is a complete brief by itself — free text stays optional.
  const briefOptional = hasOccasion || Boolean(selectedProduct);
  // On-model: the selected poses ARE the options (same model+garment, one image
  // per pose). Empty selection = a single AI-varied pose. Elsewhere the option
  // count drives it.
  const effectivePoses = [...poses, customPose.trim()].filter(Boolean);
  const onModelCount = Math.max(1, effectivePoses.length);
  const guidedCount = onModel ? onModelCount : optionCount;
  const cost = direct ? CREDIT_COSTS.perConcept : CREDIT_COSTS.perConcept * guidedCount;
  const insufficient = props.creditBalance < cost;
  const needsModel = onModel && !aiModelId;
  const langLabel = LANGS.find((l) => l.id === language)?.label ?? language;
  const aspectLabels = aspects.map((a) => ASPECTS.find((x) => x.id === a)?.label ?? a);
  // Shared by the summary CTA and the mobile sticky bar so they never disagree.
  const ctaDisabled = pending || insufficient || needsModel;
  const ctaLabel = pending
    ? "Starting…"
    : insufficient
      ? `Need ${fmt(cost)} credits`
      : needsModel
        ? "Pick a model"
        : direct
          ? "Generate creative"
          : `Generate ${guidedCount} ${guidedCount === 1 ? "option" : "options"}`;
  const creditsWord = cost === 1 ? "credit" : "credits";

  function handleProductCreated(p: InlineProduct) {
    setProducts((prev) => [
      ...prev,
      { id: p.id, name: p.name, category: p.category, dissectionReady: p.dissectionStatus === "READY", imageUrl: p.imageUrl },
    ]);
    setProductId(p.id);
  }

  function toggleAspect(id: string) {
    setAspects((prev) => (prev.includes(id) ? (prev.length > 1 ? prev.filter((a) => a !== id) : prev) : [...prev, id]));
  }

  function submit() {
    const fd = new FormData();
    if (props.occasionId) fd.set("occasionId", props.occasionId);
    else if (!direct && pickedOccasionId) fd.set("occasionId", pickedOccasionId);
    if (props.entryId) fd.set("entryId", props.entryId);
    if (productId) fd.set("productId", productId);
    fd.set("customBrief", brief);
    fd.set("directMode", direct ? "1" : "0");
    const fidelityMode = !selectedProduct
      ? "IN_SCENE"
      : renderMode === "on_model"
        ? "ON_MODEL"
        : renderMode === "composite"
          ? "EXACT_PRODUCT"
          : "IN_SCENE";
    fd.set("fidelityMode", fidelityMode);
    if (fidelityMode === "ON_MODEL" && aiModelId) fd.set("aiModelId", aiModelId);
    if (fidelityMode === "ON_MODEL") {
      fd.set("brandingMode", brandingMode);
      // Multi-pose: each pose → one image (same model+garment). JSON-encoded so
      // pose text can contain any character. Empty = single AI-varied pose.
      fd.set("modelPoses", JSON.stringify(effectivePoses));
    }
    fd.set("language", language);
    // On-model uses the pose count as its option count; everything else the picker.
    fd.set("optionCount", String(guidedCount));
    fd.set("aspects", aspects.join(","));
    startTransition(async () => {
      setError(null);
      const res = await startGenerationRun(fd);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="grid gap-10 pb-20 md:pb-0 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-10">
      {/* Left — configuration. Sections separated by space and type, not boxes. */}
      <div className="min-w-0 space-y-10">
        {/* Guided vs Direct (only for non-festival custom) */}
        {!props.isOccasion && (
          <Segmented
            value={tab}
            onChange={(v) => setTab(v as "guided" | "direct")}
            options={[
              { id: "guided", label: "Guided", hint: "AI designs options" },
              { id: "direct", label: "Direct prompt", hint: "Your exact scene" },
            ]}
          />
        )}

        {/* Product */}
        <Section
          title="Featured product"
          hint="Pick what to feature, or go scene only."
          action={
            products.length > INLINE_LIMIT ? (
              <BrowseAllDialog title="Choose a product" count={products.length}>
                <SceneOnlyCard selected={productId === null} onSelect={() => setProductId(null)} />
                {products.map((p) => (
                  <ProductCardButton key={p.id} product={p} selected={productId === p.id} onSelect={() => setProductId(p.id)} />
                ))}
              </BrowseAllDialog>
            ) : null
          }
        >
          {products.length === 0 ? (
            <div className="flex flex-col items-start gap-3 rounded-2xl border-2 border-dashed border-border p-5">
              <p className="text-sm text-muted-foreground">No products yet. Add one for product ads, or generate a scene-only creative.</p>
              <NewProductDialog
                onCreated={handleProductCreated}
                trigger={
                  <Button type="button" variant="outline" size="sm">
                    <Plus data-icon="inline-start" /> Add product
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 xl:grid-cols-4">
              <SceneOnlyCard selected={productId === null} onSelect={() => setProductId(null)} />
              {products.slice(0, INLINE_LIMIT).map((p) => (
                <ProductCardButton key={p.id} product={p} selected={productId === p.id} onSelect={() => setProductId(p.id)} />
              ))}
              <NewProductDialog
                onCreated={handleProductCreated}
                trigger={
                  <button type="button" className={TILE_BUTTON}>
                    <span className="flex aspect-square w-full items-center justify-center rounded-2xl border-2 border-dashed border-border text-muted-foreground transition-colors duration-200 group-hover:border-primary group-hover:text-primary">
                      <Plus className="size-6" />
                    </span>
                    <TileCaption name="Add product" sub="Upload a photo" />
                  </button>
                }
              />
            </div>
          )}
          {selectedProduct && !selectedProduct.dissectionReady && (
            <p className="mt-3 text-xs text-muted-foreground">
              Photos still being analyzed. Exact-product mode unlocks in ~1 min.
            </p>
          )}
        </Section>

        {/* Render mode */}
        {selectedProduct && (
          <Section title="How to show your product">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <ModeCard
                active={renderMode === "in_scene"}
                onClick={() => setRenderMode("in_scene")}
                icon={<ImageIcon className="size-4" />}
                title="In-scene"
                desc="Model places your real pack naturally in the scene. Most lifelike."
              />
              <ModeCard
                active={renderMode === "composite"}
                onClick={() => setRenderMode("composite")}
                icon={<Layers className="size-4" />}
                title="Exact pack"
                desc="Pixel-exact packaging: every concept is a styled packshot with your real product photo composited in."
              />
              {/* On-model only makes sense for garments — hide it for atta packs & co. */}
              {selectedProduct.category === "APPAREL" && (
                <ModeCard
                  active={renderMode === "on_model"}
                  onClick={() => setRenderMode("on_model")}
                  icon={<UserSquare className="size-4" />}
                  title="On-model"
                  desc="Your garment worn by an AI model. Needs a ready model."
                />
              )}
            </div>

            {/* On-model: pick the AI model, output style and poses */}
            {onModel && (
              <div className="mt-8 space-y-8">
                <div>
                  <SubHeading
                    title="AI model"
                    action={
                      props.aiModels.length > INLINE_LIMIT ? (
                        <BrowseAllDialog title="Choose a model" count={props.aiModels.length}>
                          {props.aiModels.map((m) => (
                            <ModelCardButton key={m.id} model={m} selected={aiModelId === m.id} onSelect={() => setAiModelId(m.id)} />
                          ))}
                        </BrowseAllDialog>
                      ) : null
                    }
                  />
                  {props.aiModels.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      No ready models yet.{" "}
                      <Link href="/models" className="font-medium text-primary underline-offset-2 hover:underline">
                        Generate or pick a model first
                      </Link>
                      .
                    </p>
                  ) : (
                    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3">
                      {props.aiModels.slice(0, INLINE_LIMIT).map((m) => (
                        <ModelCardButton key={m.id} model={m} selected={aiModelId === m.id} onSelect={() => setAiModelId(m.id)} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Apparel output: branded campaign vs plain on-model image */}
                <div>
                  <SubHeading title="Output" />
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <ModeCard
                      active={brandingMode === "BRANDED"}
                      onClick={() => setBrandingMode("BRANDED")}
                      icon={<Sparkles className="size-4" />}
                      title="Branded campaign"
                      desc="Logo, headline and brand colours composited onto the shot."
                    />
                    <ModeCard
                      active={brandingMode === "PLAIN"}
                      onClick={() => setBrandingMode("PLAIN")}
                      icon={<ImageIcon className="size-4" />}
                      title="Plain image"
                      desc="Just the model wearing your garment. No logo or text."
                    />
                  </div>
                </div>

                {/* Model poses — MULTI-select. Each selected pose becomes one
                    image of the same model + garment (poses replace the option
                    count for on-model runs). */}
                <div>
                  <SubHeading title="Poses & angles" />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {POSES.filter((p) => p.value).map((p) => {
                      const on = poses.includes(p.value);
                      return (
                        <Pill
                          key={p.label}
                          active={on}
                          onClick={() =>
                            setPoses((prev) => (on ? prev.filter((v) => v !== p.value) : [...prev, p.value]))
                          }
                        >
                          {p.label}
                        </Pill>
                      );
                    })}
                  </div>
                  <Input
                    value={customPose}
                    onChange={(e) => setCustomPose(e.target.value)}
                    maxLength={200}
                    placeholder="…add a custom pose (e.g. mid-twirl showing the dupatta)"
                    className="mt-3"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {onModelCount === 1
                      ? "One image: pick poses to get the same model & outfit in each."
                      : `${onModelCount} images · same model & garment, one per pose · ${fmt(cost)} credits`}
                  </p>
                </div>
              </div>
            )}
          </Section>
        )}

        {/* Occasion (in-form pick — deep links from home/calendar preselect instead) */}
        {!props.isOccasion && !direct && props.upcomingOccasions.length > 0 && (
          <Section title="Occasion" hint="Optional. Tie the creative to an upcoming festival.">
            <div className="flex flex-wrap gap-2">
              <Pill active={pickedOccasionId === null} onClick={() => setPickedOccasionId(null)}>
                None: my own brief
              </Pill>
              {props.upcomingOccasions.map((o) => (
                <Pill
                  key={o.id}
                  active={pickedOccasionId === o.id}
                  onClick={() => setPickedOccasionId((cur) => (cur === o.id ? null : o.id))}
                >
                  {o.title} <span className="opacity-60">· {o.dateLabel}</span>
                </Pill>
              ))}
            </div>
          </Section>
        )}

        {/* Brief */}
        <Section
          title={
            <label htmlFor="brief">
              {direct ? "Describe the exact scene *" : briefOptional ? "Anything specific? (optional)" : "Describe what you want *"}
            </label>
          }
          action={
            <button
              type="button"
              disabled={enhancing || brief.trim().length < 8}
              onClick={handleEnhance}
              className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-full px-3 text-xs font-medium text-primary outline-none transition-colors hover:bg-primary/10 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-40"
              title="Rewrite your idea into an art-directed prompt (0.25 credits)"
            >
              <Sparkles className="size-3" />
              {enhancing ? "Enhancing…" : `Enhance · ${fmt(CREDIT_COSTS.enhancePrompt)} credits`}
            </button>
          }
        >
          <Textarea
            id="brief"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={direct ? 5 : 3}
            maxLength={1200}
            placeholder={
              direct
                ? "e.g. The pack on a marble counter beside a steaming plate of pooris, soft window light, marigold petals"
                : briefOptional
                  ? "e.g. Highlight 20% off, focus on the family pack"
                  : "e.g. A monsoon-sale post, cozy rainy morning, hot pooris, chai on the side"
            }
            className="resize-none"
          />
        </Section>

        {/* Language + formats */}
        <div className="grid gap-10 sm:grid-cols-2 sm:gap-6">
          {!direct && (
            <Section title="Copy language">
              <div className="flex flex-wrap gap-2">
                {LANGS.map((l) => (
                  <Pill key={l.id} active={language === l.id} onClick={() => setLanguage(l.id)}>{l.label}</Pill>
                ))}
              </div>
            </Section>
          )}
          <Section title="Formats" hint="Pick one or more.">
            <div className="flex flex-wrap gap-2">
              {ASPECTS.map((a) => (
                <Pill key={a.id} active={aspects.includes(a.id)} onClick={() => toggleAspect(a.id)}>{a.label}</Pill>
              ))}
            </div>
          </Section>
        </div>

        {/* How many options to generate (guided only) — drives cost. Hidden
            for on-model runs, where the selected poses drive the count. */}
        {!direct && !onModel && (
          <Section
            title="How many options?"
            hint="Each option is a distinct creative concept in your chosen language. More options = more variety to pick from."
          >
            <div className="flex flex-wrap gap-2">
              {[1, 2, LIMITS.maxConceptsPerRun].map((n) => (
                <Pill key={n} active={optionCount === n} onClick={() => setOptionCount(n)}>
                  {n} {n === 1 ? "option" : "options"} · {fmt(CREDIT_COSTS.perConcept * n)} credits
                </Pill>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* Right — summary + CTA (sticky on desktop) */}
      <Card className="lg:sticky lg:top-8">
        <CardContent className="space-y-5">
          <h2 className="text-base font-semibold tracking-tight">Summary</h2>
          <dl className="space-y-2.5 text-sm">
            <SummaryRow label="Occasion" value={direct ? "Direct prompt" : props.occasionTitle ?? pickedOccasion?.title ?? "Custom brief"} />
            <SummaryRow label="Product" value={selectedProduct?.name ?? "Scene only"} />
            {selectedProduct && (
              <SummaryRow
                label="Style"
                value={renderMode === "on_model" ? "On-model" : renderMode === "composite" ? "Exact pack" : "In-scene"}
              />
            )}
            {onModel && <SummaryRow label="Model" value={selectedModel?.name ?? "Not selected"} />}
            {onModel && <SummaryRow label="Output" value={brandingMode === "PLAIN" ? "Plain image" : "Branded campaign"} />}
            {onModel && <SummaryRow label="Poses" value={`${onModelCount} ${onModelCount === 1 ? "pose" : "poses"}`} />}
            {!direct && <SummaryRow label="Language" value={langLabel} />}
            <SummaryRow label="Formats" value={aspectLabels.join(", ")} />
          </dl>

          <Separator />

          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Cost</p>
              <p className="mt-0.5 text-2xl font-semibold tracking-tight tabular-nums">
                {fmt(cost)} <span className="text-sm font-medium text-muted-foreground">{creditsWord}</span>
              </p>
            </div>
            <div className="text-right text-xs text-muted-foreground tabular-nums">
              <p>Balance {fmt(props.creditBalance)}</p>
              {!insufficient && <p>{fmt(props.creditBalance - cost)} left after</p>}
            </div>
          </div>

          {insufficient && (
            <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              Not enough credits: you need {fmt(cost)}, you have {fmt(props.creditBalance)}.{" "}
              <Link href="/settings/credits" className="font-medium underline underline-offset-2">
                See credits
              </Link>
            </p>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={submit} disabled={ctaDisabled} size="lg" className="h-11 w-full text-base">
            <Wand2 data-icon="inline-start" />
            {ctaLabel}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            {direct
              ? "One image from your exact prompt."
              : guidedCount === 1
                ? `One creative, ${CREDIT_COSTS.perConcept} credits. Refunded if it fails to render.`
                : `${guidedCount} ${onModel ? "poses" : "distinct concepts"} at ${CREDIT_COSTS.perConcept} credits each, all saved to your library. Any that fail to render are refunded.`}
          </p>
        </CardContent>
      </Card>

      {/* Mobile: the summary sits below a long form, so keep cost + Generate in
          reach. Sits just above the fixed bottom tab bar (md:hidden in app-nav). */}
      <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-background px-4 py-3 md:hidden">
        {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1 tabular-nums">
            <p className="text-sm font-semibold">
              {fmt(cost)} {creditsWord}
            </p>
            {insufficient ? (
              <Link href="/settings/credits" className="text-xs font-medium text-amber-700 underline underline-offset-2 dark:text-amber-400">
                Not enough credits. See credits
              </Link>
            ) : (
              <p className="truncate text-xs text-muted-foreground">Balance {fmt(props.creditBalance)}</p>
            )}
          </div>
          <Button onClick={submit} disabled={ctaDisabled} className="h-10 px-4">
            <Wand2 data-icon="inline-start" />
            {ctaLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Credits can be fractional (0.25 enhance, env-configured unit price). */
function fmt(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function Section({
  title,
  hint,
  action,
  children,
}: {
  title: React.ReactNode;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
          {hint && <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SubHeading({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {action}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="truncate text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}

function Segmented({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { id: string; label: string; hint: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-muted p-1.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "cursor-pointer rounded-xl px-4 py-2.5 text-left outline-none transition-all duration-200 focus-visible:ring-3 focus-visible:ring-ring/50",
            value === o.id ? "bg-background shadow-sm" : "hover:bg-background/50",
          )}
        >
          <span className="block text-sm font-semibold text-foreground">{o.label}</span>
          <span className="block text-[11px] text-muted-foreground">{o.hint}</span>
        </button>
      ))}
    </div>
  );
}

const CATEGORY_LABEL: Record<ProductCategory, string> = { FMCG: "Packaged", APPAREL: "Apparel", OTHER: "Product" };

/** Picker tile: image on top, name + detail below (legible on any photo). */
const TILE_BUTTON =
  "group flex min-w-0 cursor-pointer flex-col gap-2 rounded-2xl text-left outline-none transition-transform duration-150 active:scale-[0.98] focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none motion-reduce:active:scale-100";

function TileCaption({ name, sub, selected }: { name: string; sub?: React.ReactNode; selected?: boolean }) {
  return (
    <span className="block min-w-0 px-0.5">
      <span className={cn("block truncate text-sm font-medium", selected ? "text-primary" : "text-foreground")}>{name}</span>
      {sub && <span className="mt-0.5 block truncate text-xs text-muted-foreground">{sub}</span>}
    </span>
  );
}

function PickerCard({
  selected,
  onSelect,
  name,
  sub,
  media,
}: {
  selected: boolean;
  onSelect: () => void;
  name: string;
  sub?: React.ReactNode;
  media: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onSelect} title={name} aria-pressed={selected} className={TILE_BUTTON}>
      <span
        className={cn(
          "relative block aspect-square w-full overflow-hidden rounded-2xl bg-muted transition-shadow duration-200",
          selected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "ring-1 ring-border group-hover:ring-foreground/30",
        )}
      >
        {media}
        {selected && (
          <span className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm ring-2 ring-background">
            <Check className="size-4" strokeWidth={3} />
          </span>
        )}
      </span>
      <TileCaption name={name} sub={sub} selected={selected} />
    </button>
  );
}

function TileImage({ url, alt }: { url: string | null; alt: string }) {
  return url ? (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={url}
      alt={alt}
      className="size-full object-cover transition-transform duration-200 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
    />
  ) : (
    <span className="flex size-full items-center justify-center text-muted-foreground">
      <ImageIcon className="size-7" />
    </span>
  );
}

function SceneOnlyCard({ selected, onSelect }: { selected: boolean; onSelect: () => void }) {
  return (
    <PickerCard
      selected={selected}
      onSelect={onSelect}
      name="Scene only"
      sub="No product"
      media={
        <span className={cn("flex size-full items-center justify-center", selected ? "bg-primary/5 text-primary" : "text-muted-foreground")}>
          <Sparkles className="size-6" />
        </span>
      }
    />
  );
}

function ProductCardButton({ product, selected, onSelect }: { product: Product; selected: boolean; onSelect: () => void }) {
  const analyzing = product.category !== "APPAREL" && !product.dissectionReady;
  return (
    <PickerCard
      selected={selected}
      onSelect={onSelect}
      name={product.name}
      media={<TileImage url={product.imageUrl} alt={product.name} />}
      sub={
        <>
          {CATEGORY_LABEL[product.category]}
          {analyzing && <span className="text-amber-700 dark:text-amber-400"> · Analyzing…</span>}
        </>
      }
    />
  );
}

function ModelCardButton({ model, selected, onSelect }: { model: AiModel; selected: boolean; onSelect: () => void }) {
  const traits = (model.traits ?? null) as ModelTraits;
  const sub = [model.scope === "GLOBAL" ? "Preset" : "Yours", traits?.gender, traits?.ageBand, traits?.look]
    .filter(Boolean)
    .join(" · ");
  return (
    <PickerCard
      selected={selected}
      onSelect={onSelect}
      name={model.name}
      sub={sub}
      media={<TileImage url={model.thumbUrl} alt={model.name} />}
    />
  );
}

/** Collapsed "Browse all" entry → opens a dialog with the full picker grid. */
function BrowseAllDialog({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="ghost" size="sm" className="h-8 shrink-0 rounded-full text-primary" />}>
        Browse all {count}
        <ArrowRight data-icon="inline-end" />
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div
          className="grid max-h-[60vh] grid-cols-2 gap-x-3 gap-y-5 overflow-y-auto p-1 sm:grid-cols-3"
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ModeCard({ active, onClick, icon, title, desc }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-2xl border p-4 text-left outline-none transition-all duration-200 focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100",
        active ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/25" : "border-border bg-card hover:border-foreground/20",
      )}
    >
      <span className={cn("inline-flex size-8 items-center justify-center rounded-lg", active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
        {icon}
      </span>
      <p className="mt-2.5 text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{desc}</p>
    </button>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      aria-pressed={active}
      onClick={onClick}
      // 40px touch target on phones, compact on desktop.
      className="h-10 rounded-full px-3.5 sm:h-8"
    >
      {children}
    </Button>
  );
}
