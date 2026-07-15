"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, ImageIcon, Layers, Plus, Sparkles, UserSquare, Wand2 } from "lucide-react";
import Link from "next/link";
import { startGenerationRun } from "@/app/actions/generate";
import { enhanceUserPrompt } from "@/app/actions/enhance";
import { NewProductDialog, type InlineProduct } from "./new-product-dialog";
import { CREDIT_COSTS, LIMITS } from "@/lib/ai/models";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
// Premium image models (mirrors IMAGE_MODEL_PREFS server-side — kept local so
// the client bundle doesn't pull the provider module).
type ImageModelId = "nb-pro" | "gpt-image-2" | "compare";
const IMAGE_MODELS: { id: ImageModelId; label: string; hint: string }[] = [
  { id: "nb-pro", label: "Nano Banana Pro", hint: "Best pack & label fidelity. Recommended." },
  { id: "gpt-image-2", label: "GPT Image 2", hint: "Alternative premium render." },
  { id: "compare", label: "Both — compare", hint: "Every option on both models. 2× credits." },
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
  isSuperAdmin: boolean;
}) {
  const [tab, setTab] = useState<"guided" | "direct">("guided");
  const [products, setProducts] = useState<Product[]>(props.products);
  const [productId, setProductId] = useState<string | null>(props.preselectedProductId ?? props.products[0]?.id ?? null);
  const [renderMode, setRenderMode] = useState<"in_scene" | "composite" | "on_model">("in_scene");
  const [aiModelId, setAiModelId] = useState<string | null>(props.aiModels[0]?.id ?? null);
  const [brandingMode, setBrandingMode] = useState<BrandingMode>(props.apparelBrandingDefault);
  const [pose, setPose] = useState("");
  const [language, setLanguage] = useState("en");
  const [optionCount, setOptionCount] = useState(LIMITS.maxConceptsPerRun);
  const [aspects, setAspects] = useState<string[]>(["4:5"]);
  const [brief, setBrief] = useState("");
  // In-form festival pick (only when not deep-linked from home/calendar).
  const [pickedOccasionId, setPickedOccasionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [enhancing, setEnhancing] = useState(false);
  // Super-admin model bake-off: same prompts across the whole model lineup.
  const [bakeoff, setBakeoff] = useState(false);
  // Premium image model pick; "compare" renders on both (2× credits).
  const [imageModel, setImageModel] = useState<ImageModelId>("nb-pro");

  async function handleEnhance() {
    setEnhancing(true);
    setError(null);
    try {
      const res = await enhanceUserPrompt({ text: brief, mode: "scene" });
      if ("error" in res) setError(res.error);
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
  const variantMult = imageModel === "compare" ? 2 : 1;
  const cost = bakeoff ? 0 : (direct ? CREDIT_COSTS.perConcept : CREDIT_COSTS.perConcept * optionCount) * variantMult;
  const insufficient = props.creditBalance < cost;
  const needsModel = onModel && !aiModelId;
  const langLabel = LANGS.find((l) => l.id === language)?.label ?? language;
  const aspectLabels = aspects.map((a) => ASPECTS.find((x) => x.id === a)?.label ?? a);

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
      if (pose.trim()) fd.set("modelPose", pose.trim());
    }
    fd.set("language", language);
    fd.set("optionCount", String(optionCount));
    fd.set("aspects", aspects.join(","));
    fd.set("imageModel", imageModel);
    if (bakeoff) fd.set("bakeoff", "1");
    startTransition(async () => {
      setError(null);
      const res = await startGenerationRun(fd);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
      {/* Left — configuration */}
      <Card>
        <CardContent className="space-y-5">
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
          <section>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Featured product</Label>
            {products.length === 0 ? (
              <div className="mt-3 flex flex-col items-start gap-3 rounded-2xl border-2 border-dashed border-border p-5">
                <p className="text-sm text-muted-foreground">No products yet — add one for product ads, or generate a scene-only creative.</p>
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
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {/* Scene-only (no product) */}
                  <button
                    type="button"
                    onClick={() => setProductId(null)}
                    className={cn(
                      "flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border text-center transition-all",
                      productId === null ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/25" : "border-border text-muted-foreground hover:border-foreground/20",
                    )}
                  >
                    <Sparkles className="size-6" />
                    <span className="text-xs font-medium">Scene only</span>
                  </button>
                  {products.slice(0, INLINE_LIMIT).map((p) => (
                    <ProductCardButton key={p.id} product={p} selected={productId === p.id} onSelect={() => setProductId(p.id)} />
                  ))}
                  <NewProductDialog
                    onCreated={handleProductCreated}
                    trigger={
                      <button
                        type="button"
                        className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        <Plus className="size-6" />
                        <span className="text-xs font-medium">Add product</span>
                      </button>
                    }
                  />
                </div>
                {products.length > INLINE_LIMIT && (
                  <BrowseAllDialog title="Choose a product" count={products.length}>
                    <button
                      type="button"
                      onClick={() => setProductId(null)}
                      className={cn(
                        "flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border text-center transition-all",
                        productId === null ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/25" : "border-border text-muted-foreground hover:border-foreground/20",
                      )}
                    >
                      <Sparkles className="size-6" />
                      <span className="text-xs font-medium">Scene only</span>
                    </button>
                    {products.map((p) => (
                      <ProductCardButton key={p.id} product={p} selected={productId === p.id} onSelect={() => setProductId(p.id)} />
                    ))}
                  </BrowseAllDialog>
                )}
              </div>
            )}
            {selectedProduct && !selectedProduct.dissectionReady && (
              <p className="mt-2 text-xs text-muted-foreground">
                Photos still being analyzed — Exact-product mode unlocks in ~1 min.
              </p>
            )}
          </section>

          {/* Render mode */}
          {selectedProduct && (
            <section>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">How to show your product</Label>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
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
              {/* On-model: pick the AI model */}
              {onModel && (
                <div className="mt-4">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">AI model</Label>
                  {props.aiModels.length === 0 ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      No ready models yet.{" "}
                      <Link href="/models" className="font-medium text-primary underline-offset-2 hover:underline">
                        Generate or pick a model first
                      </Link>
                      .
                    </p>
                  ) : (
                    <div className="mt-3 space-y-3">
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {props.aiModels.slice(0, INLINE_LIMIT).map((m) => (
                          <ModelCardButton key={m.id} model={m} selected={aiModelId === m.id} onSelect={() => setAiModelId(m.id)} />
                        ))}
                      </div>
                      {props.aiModels.length > INLINE_LIMIT && (
                        <BrowseAllDialog title="Choose a model" count={props.aiModels.length}>
                          {props.aiModels.map((m) => (
                            <ModelCardButton key={m.id} model={m} selected={aiModelId === m.id} onSelect={() => setAiModelId(m.id)} />
                          ))}
                        </BrowseAllDialog>
                      )}
                    </div>
                  )}

                  {/* Apparel output: branded campaign vs plain on-model image */}
                  <div className="mt-4">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Output</Label>
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

                  {/* Model pose */}
                  <div className="mt-4">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Model pose</Label>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {POSES.map((p) => (
                        <Pill key={p.label} active={pose === p.value} onClick={() => setPose(p.value)}>{p.label}</Pill>
                      ))}
                    </div>
                    <input
                      value={pose}
                      onChange={(e) => setPose(e.target.value)}
                      maxLength={200}
                      placeholder="…or describe a custom pose (e.g. mid-twirl showing the dupatta)"
                      className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                    />
                    <p className="mt-1.5 text-xs text-muted-foreground">Leave on “Auto” to let the AI vary the pose per option.</p>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Image model — premium renders only; "compare" fans out to both */}
          <section>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Image model</Label>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {IMAGE_MODELS.map((m) => (
                <ModeCard
                  key={m.id}
                  active={imageModel === m.id}
                  onClick={() => setImageModel(m.id)}
                  icon={m.id === "compare" ? <Layers className="size-4" /> : <ImageIcon className="size-4" />}
                  title={m.label}
                  desc={m.hint}
                />
              ))}
            </div>
          </section>

          {/* Occasion (in-form pick — deep links from home/calendar preselect instead) */}
          {!props.isOccasion && !direct && props.upcomingOccasions.length > 0 && (
            <section>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Occasion (optional)</Label>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPickedOccasionId(null)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    pickedOccasionId === null
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-foreground/20",
                  )}
                >
                  None — my own brief
                </button>
                {props.upcomingOccasions.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setPickedOccasionId((cur) => (cur === o.id ? null : o.id))}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      pickedOccasionId === o.id
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-foreground/20",
                    )}
                  >
                    {o.title} <span className="opacity-60">· {o.dateLabel}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Brief */}
          <section>
            <div className="flex items-center justify-between">
              <Label htmlFor="brief" className="text-xs uppercase tracking-wide text-muted-foreground">
                {direct ? "Describe the exact scene *" : hasOccasion ? "Anything specific? (optional)" : "Describe what you want *"}
              </Label>
              <button
                type="button"
                disabled={enhancing || brief.trim().length < 8}
                onClick={handleEnhance}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
                title="Rewrite your idea into an art-directed prompt (0.25 credits)"
              >
                <Sparkles className="size-3" />
                {enhancing ? "Enhancing…" : "Enhance · 0.25 cr"}
              </button>
            </div>
            <Textarea
              id="brief"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={direct ? 5 : 3}
              maxLength={1200}
              placeholder={
                direct
                  ? "e.g. The pack on a marble counter beside a steaming plate of pooris, soft window light, marigold petals"
                  : hasOccasion
                    ? "e.g. Highlight 20% off, focus on the family pack"
                    : "e.g. A monsoon-sale post, cozy rainy morning, hot pooris, chai on the side"
              }
              className="mt-2 resize-none"
            />
          </section>

          {/* Language + formats */}
          <div className="grid gap-5 sm:grid-cols-2">
            {!direct && (
              <section>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Copy language</Label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {LANGS.map((l) => (
                    <Pill key={l.id} active={language === l.id} onClick={() => setLanguage(l.id)}>{l.label}</Pill>
                  ))}
                </div>
              </section>
            )}
            <section>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Formats</Label>
              <div className="mt-3 flex flex-wrap gap-2">
                {ASPECTS.map((a) => (
                  <Pill key={a.id} active={aspects.includes(a.id)} onClick={() => toggleAspect(a.id)}>{a.label}</Pill>
                ))}
              </div>
            </section>
          </div>

          {/* How many options to generate (guided only) — drives cost. */}
          {!direct && (
            <section>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">How many options?</Label>
              <div className="mt-3 flex flex-wrap gap-2">
                {[1, 2, LIMITS.maxConceptsPerRun].map((n) => (
                  <Pill key={n} active={optionCount === n} onClick={() => setOptionCount(n)}>
                    {n} {n === 1 ? "option" : "options"} · {CREDIT_COSTS.perConcept * n} cr
                  </Pill>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Each option is a distinct creative concept in your chosen language. More options = more variety to pick from.
              </p>
            </section>
          )}
        </CardContent>
      </Card>

      {/* Right — summary + CTA (sticky on desktop) */}
      <Card className="lg:sticky lg:top-8">
        <CardContent className="space-y-4">
          <p className="text-sm font-semibold">Summary</p>
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
            {!direct && <SummaryRow label="Language" value={langLabel} />}
            <SummaryRow label="Image model" value={IMAGE_MODELS.find((m) => m.id === imageModel)?.label ?? imageModel} />
            <SummaryRow label="Formats" value={aspectLabels.join(", ")} />
          </dl>

          <Separator />

          {props.isSuperAdmin && (
            <button
              type="button"
              onClick={() => setBakeoff((v) => !v)}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition ${
                bakeoff ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
              }`}
            >
              <span>
                <span className="block font-semibold">Model bake-off</span>
                <span className="text-muted-foreground">
                  Renders every option on NB2, NB Pro, GPT Image 2 & Seedream — no credits, API cost logged.
                </span>
              </span>
              <span
                className={`ml-3 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  bakeoff ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {bakeoff ? "ON" : "OFF"}
              </span>
            </button>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Cost</span>
            <span className="text-sm font-semibold">
              {bakeoff ? "Free (bake-off)" : `${cost} ${cost === 1 ? "credit" : "credits"}`} · Balance: {props.creditBalance}
            </span>
          </div>

          {insufficient && (
            <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              Not enough credits — you need {cost}, you have {props.creditBalance}.{" "}
              <Link href="/settings/credits" className="font-medium underline underline-offset-2">
                See credits
              </Link>
            </p>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={submit} disabled={pending || insufficient || needsModel} size="lg" className="h-11 w-full text-base">
            <Wand2 data-icon="inline-start" />
            {pending
              ? "Starting…"
              : insufficient
                ? `Need ${cost} credits`
                : needsModel
                  ? "Pick a model"
                  : direct
                    ? "Generate creative"
                    : `Generate ${optionCount} ${optionCount === 1 ? "option" : "options"}`}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            {bakeoff
              ? `Each ${direct ? "render" : "concept"} is generated once per model (4 models) with the identical prompt — compare them side by side on the run page.`
              : imageModel === "compare"
                ? `Every ${direct ? "render" : "option"} is generated on BOTH models from the identical prompt — pick your winner side by side. Failed renders are refunded.`
                : direct
                  ? "One image from your exact prompt."
                  : optionCount === 1
                    ? `One creative concept, ${CREDIT_COSTS.perConcept} credits. Refunded if it fails to render.`
                    : `${optionCount} distinct concepts at ${CREDIT_COSTS.perConcept} credits each, all saved to your library. Any that fail to render are refunded.`}
          </p>
        </CardContent>
      </Card>
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
    <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-muted p-1.5">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "rounded-lg px-4 py-2.5 text-left transition-all",
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

function PickerCard({
  selected,
  onSelect,
  imageUrl,
  alt,
  name,
  topBadge,
  bottomBadges,
}: {
  selected: boolean;
  onSelect: () => void;
  imageUrl: string | null;
  alt: string;
  name: string;
  topBadge?: React.ReactNode;
  bottomBadges?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      title={name}
      className={cn(
        "group relative aspect-square overflow-hidden rounded-2xl border bg-muted text-left transition-all",
        selected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-foreground/30",
      )}
    >
      {imageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={imageUrl} alt={alt} className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center text-muted-foreground">
          <ImageIcon className="size-7" />
        </div>
      )}
      {/* readable gradient + name */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-2.5 pt-7">
        <p className="truncate text-sm font-semibold text-white">{name}</p>
        {bottomBadges}
      </div>
      {topBadge && <div className="absolute left-2 top-2">{topBadge}</div>}
      {selected && (
        <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
          <Check className="size-3.5" />
        </span>
      )}
    </button>
  );
}

function ProductCardButton({ product, selected, onSelect }: { product: Product; selected: boolean; onSelect: () => void }) {
  return (
    <PickerCard
      selected={selected}
      onSelect={onSelect}
      imageUrl={product.imageUrl}
      alt={product.name}
      name={product.name}
      topBadge={
        <Badge variant="secondary" className="text-[10px]">
          {CATEGORY_LABEL[product.category]}
        </Badge>
      }
      bottomBadges={
        product.category !== "APPAREL" && !product.dissectionReady ? (
          <span className="mt-0.5 block text-[10px] font-medium text-amber-300">Analyzing…</span>
        ) : null
      }
    />
  );
}

function ModelCardButton({ model, selected, onSelect }: { model: AiModel; selected: boolean; onSelect: () => void }) {
  const traits = (model.traits ?? null) as ModelTraits;
  const traitText = [traits?.gender, traits?.ageBand, traits?.look].filter(Boolean).join(" · ");
  return (
    <PickerCard
      selected={selected}
      onSelect={onSelect}
      imageUrl={model.thumbUrl}
      alt={model.name}
      name={model.name}
      topBadge={
        <Badge variant={model.scope === "GLOBAL" ? "secondary" : "outline"} className="bg-background/80 text-[10px]">
          {model.scope === "GLOBAL" ? "Preset" : "Yours"}
        </Badge>
      }
      bottomBadges={traitText ? <span className="mt-0.5 block truncate text-[10px] text-white/75">{traitText}</span> : null}
    />
  );
}

/** Collapsed "Browse all" entry → opens a dialog with the full picker grid. */
function BrowseAllDialog({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" className="w-full" />}>
        Browse all {count}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div
          className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3"
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
      onClick={onClick}
      className={cn(
        "rounded-2xl border p-4 text-left transition-all",
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
      onClick={onClick}
      className="rounded-full"
    >
      {children}
    </Button>
  );
}
