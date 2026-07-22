"use client";

import { useEffect, useMemo, useState, useTransition, type TransitionStartFunction } from "react";
import { useRouter } from "next/navigation";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { toast } from "sonner";
import {
  Check,
  ChevronDown,
  History,
  ImageIcon,
  Languages,
  LayoutGrid,
  Loader2,
  Lock,
  Move,
  RotateCcw,
  Sparkles,
  Type,
  Wand2,
} from "lucide-react";
import {
  regenerateWithInstruction,
  renderNewAspect,
  revertToVersion,
  switchCreativeLanguage,
  toggleContactLine,
  updateCreativeText,
  updateLogoPlacement,
  updateLogoPlacementFree,
} from "@/app/actions/editor";
import { applyLayout, listLayoutVariants } from "@/app/actions/layouts";
import { enhanceUserPrompt } from "@/app/actions/enhance";
import { approveCreative, unapproveCreative } from "@/app/actions/review";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { COPY_LANGUAGES, type CopyLanguage, type OverlaySpec } from "@/lib/composition/types";
import type { Aspect } from "@/lib/image/runware";
import { PreviewStage, clampLogoDraft, type LogoDraft } from "./preview-stage";

type Lang = CopyLanguage;
type CopyBlock = { eyebrow: string | null; headline: string; subhead: string | null; cta: string | null };
export type EditorCopy = Record<Lang, CopyBlock>;

const ALL_ASPECTS: Aspect[] = ["1:1", "4:5", "9:16", "16:9"];
const DEFAULT_LOGO_RATIO = 0.085 / 0.22; // computeLogoBox default box shape

const ROLE_LABEL: Record<string, string> = {
  eyebrow: "Kicker / offer",
  headline: "Headline",
  subhead: "Subline",
  cta: "Button text",
};

const LOGO_PRESETS: Array<{ id: "TL" | "TC" | "TR" | "BL" | "BR"; label: string }> = [
  { id: "TL", label: "Top left" },
  { id: "TC", label: "Top centre" },
  { id: "TR", label: "Top right" },
  { id: "BL", label: "Bottom left" },
  { id: "BR", label: "Bottom right" },
];

const CAUSE_LABEL: Record<string, string> = {
  text_edit: "Text edit",
  language_switch: "Language switch",
  logo_edit: "Logo preset",
  logo_free_placement: "Logo placement",
  brand_block_edit: "Contact line",
  regen_instruction: "Scene edit",
  revert: "Restored",
};

const versionDate = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function CreativeEditor(props: {
  creativeId: string;
  brandName: string;
  approved: boolean;
  baked: boolean;
  copy: EditorCopy | null;
  bigIdea: string;
  insightRationale: string;
  hasContactLine: boolean;
  costs: { regen: string; enhance: string };
  renders: Array<{ aspectRatio: string; url: string | null; spec: OverlaySpec }>;
  versions: Array<{
    index: number;
    cause: { type: string; note?: string; language?: string };
    thumbUrl: string | null;
    createdAt: string;
  }>;
}) {
  const router = useRouter();
  const id = props.creativeId;

  const [aspect, setAspect] = useState(props.renders[0]?.aspectRatio ?? "4:5");
  const active = props.renders.find((r) => r.aspectRatio === aspect) ?? props.renders[0];
  const lang = (active?.spec.language ?? "en") as Lang;
  const canvas = active?.spec.canvas ?? { width: 1080, height: 1350 };

  // Independent pending lanes so one slow mutation doesn't lock the whole panel.
  const [langTransition, startLang] = useTransition();
  const [textTransition, startText] = useTransition();
  const [logoPending, startLogo] = useTransition();
  const [sceneTransition, startScene] = useTransition();
  const [enhancePending, startEnhance] = useTransition();
  const [historyPending, startHistory] = useTransition();
  const [aspectTransition, startAspect] = useTransition();
  const [approvePending, startApprove] = useTransition();

  // Paid edits (scene regen, baked text/language) run as a Trigger.dev task —
  // the action returns {pending, runId, publicToken} and we watch the run here.
  // A lane stays "pending" until its task finishes, so buttons gate correctly.
  type AsyncLane = "lang" | "text" | "scene" | "aspect";
  const [pendingEdit, setPendingEdit] = useState<{
    runId: string;
    publicToken: string | null;
    success: string;
    after?: () => void;
    lane: AsyncLane;
  } | null>(null);
  const langPending = langTransition || pendingEdit?.lane === "lang";
  const textPending = textTransition || pendingEdit?.lane === "text";
  const scenePending = sceneTransition || pendingEdit?.lane === "scene";
  const aspectPending = aspectTransition || pendingEdit?.lane === "aspect";
  const busy = langPending || textPending || logoPending || scenePending || historyPending;

  const { run: editRun } = useRealtimeRun(pendingEdit?.runId, {
    accessToken: pendingEdit?.publicToken ?? undefined,
    enabled: Boolean(pendingEdit?.runId && pendingEdit?.publicToken),
  });

  useEffect(() => {
    if (!pendingEdit) return;
    // No realtime token (mint failed): the task still runs — fall back to a
    // one-shot refresh after the typical edit duration.
    if (!pendingEdit.publicToken) {
      const t = setTimeout(() => {
        setPendingEdit(null);
        router.refresh();
      }, 60_000);
      return () => clearTimeout(t);
    }
    const meta = editRun?.metadata as { status?: string; error?: string } | undefined;
    const status = editRun?.status;
    if (meta?.status === "failed") {
      toast.error(meta.error ?? "Edit failed — credits refunded");
      setPendingEdit(null);
      router.refresh();
      return;
    }
    if (meta?.status === "done" || status === "COMPLETED") {
      toast.success(pendingEdit.success);
      pendingEdit.after?.();
      setPendingEdit(null);
      router.refresh();
      return;
    }
    if (status && ["FAILED", "CRASHED", "CANCELED", "SYSTEM_FAILURE", "EXPIRED", "TIMED_OUT"].includes(status)) {
      toast.error("Edit failed — credits refunded");
      setPendingEdit(null);
      router.refresh();
    }
  }, [editRun?.status, editRun?.metadata, pendingEdit, router]);

  function mutate(
    start: TransitionStartFunction,
    action: () => Promise<{ error?: string; ok?: boolean; pending?: boolean; runId?: string; publicToken?: string | null }>,
    success: string,
    after?: () => void,
    lane?: AsyncLane,
  ) {
    start(async () => {
      const res = await action();
      if (res && "error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      if (res && "pending" in res && res.pending && res.runId) {
        setPendingEdit({
          runId: res.runId,
          publicToken: res.publicToken ?? null,
          success,
          after,
          lane: lane ?? "scene",
        });
        return;
      }
      toast.success(success);
      after?.();
      // No router.refresh() here: every action called through mutate() runs
      // revalidatePath, so the action response already carries the fresh page.
    });
  }

  // ----- text & language ---------------------------------------------------
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [confirmLang, setConfirmLang] = useState<Lang | null>(null);

  const fields = useMemo(() => {
    const copy = props.copy?.[lang] ?? props.copy?.en;
    const layer = (role: string) => active?.spec.textLayers.find((l) => l.role === role);
    const value = (role: keyof CopyBlock) => {
      // Overlay creatives: the spec layer is the saved truth (free edits land
      // there); concept copy is the fallback. Baked creatives: headline/CTA
      // never live in layers, so read concept copy — always populated.
      const fromLayer = layer(role)?.textByLang[lang];
      const fromCopy = copy?.[role] ?? "";
      return (props.baked ? fromCopy || fromLayer : fromLayer || fromCopy) ?? "";
    };
    const roles: Array<keyof CopyBlock> = props.baked
      ? ["headline", "cta"]
      : (["eyebrow", "headline", "subhead", "cta"] as const).filter(
          (r) => layer(r) || (r === "headline" || r === "cta"),
        );
    return roles.map((role) => ({ role, value: value(role) }));
  }, [props.copy, props.baked, active, lang]);

  const changedTexts = useMemo(() => {
    const out: Record<string, string> = {};
    for (const f of fields) {
      const draft = drafts[f.role];
      if (draft !== undefined && draft !== f.value) out[f.role] = draft;
    }
    return out;
  }, [fields, drafts]);
  const textDirty = Object.keys(changedTexts).length > 0;

  function selectLanguage(next: Lang) {
    if (next === lang || langPending) return;
    if (props.baked) {
      setConfirmLang(next);
      return;
    }
    mutate(
      startLang,
      () => switchCreativeLanguage(id, next),
      `Switched to ${COPY_LANGUAGES.find((l) => l.id === next)?.label}`,
      () => setDrafts({}),
      "lang",
    );
  }

  function saveTexts() {
    mutate(
      startText,
      () => updateCreativeText({ creativeId: id, language: lang, texts: changedTexts }),
      props.baked ? "Headline re-set on the image" : "Text updated",
      () => setDrafts({}),
      "text",
    );
  }

  // ----- logo ---------------------------------------------------------------
  const logo = active?.spec.logo;
  const logoRatio = logo && logo.w > 0 ? logo.h / logo.w : DEFAULT_LOGO_RATIO;
  const [logoDraft, setLogoDraft] = useState<LogoDraft | null>(null);

  function beginLogoAdjust() {
    if (!logo) return;
    setLogoDraft({
      fx: logo.x / canvas.width,
      fy: logo.y / canvas.height,
      fw: logo.w / canvas.width,
    });
  }

  function setLogoField(field: keyof LogoDraft, pct: number) {
    if (!logoDraft) return;
    setLogoDraft(clampLogoDraft({ ...logoDraft, [field]: pct / 100 }, logoRatio, canvas));
  }

  function applyLogoPlacement() {
    if (!logoDraft) return;
    mutate(
      startLogo,
      () => updateLogoPlacementFree(id, logoDraft),
      "Logo placement applied to all formats",
      () => setLogoDraft(null),
    );
  }

  function applyLogoPreset(pos: "TL" | "TC" | "TR" | "BL" | "BR") {
    // Preserve the current logo size when snapping to a preset corner.
    const scale = logo ? Math.min(2, Math.max(0.5, logo.w / canvas.width / 0.22)) : 1;
    mutate(startLogo, () => updateLogoPlacement(id, pos, scale), "Logo moved", () => setLogoDraft(null));
  }

  // ----- motto / contact -----------------------------------------------------
  const mottoLayer = active?.spec.textLayers.find((l) => l.role === "motto");
  const contactShown = Boolean(active?.spec.textLayers.some((l) => l.role === "contact"));

  // ----- scene ----------------------------------------------------------------
  const [note, setNote] = useState("");
  const [showAbout, setShowAbout] = useState(false);

  // ----- layouts (free remix) -------------------------------------------------
  type LayoutOption = { templateId: string; label: string; score: number; reason: string; dataUri: string; current: boolean };
  const [layoutOptions, setLayoutOptions] = useState<LayoutOption[] | null>(null);
  const [layoutLoading, startLayoutLoad] = useTransition();
  const [layoutApply, startLayoutApply] = useTransition();

  function loadLayouts() {
    startLayoutLoad(async () => {
      const res = await listLayoutVariants(id);
      if (res.error) toast.error(res.error);
      else setLayoutOptions(res.options ?? []);
    });
  }

  function enhance() {
    startEnhance(async () => {
      const res = await enhanceUserPrompt({ text: note, mode: "instruction" });
      if ("error" in res) toast.error(res.error);
      else {
        setNote(res.enhanced);
        toast.success("Instruction enhanced");
      }
    });
  }

  // ----- derived ---------------------------------------------------------------
  const missingAspects = ALL_ASPECTS.filter((a) => !props.renders.some((r) => r.aspectRatio === a));
  const busyLabel = langPending
    ? props.baked
      ? "Re-setting the headline — takes 20–40s…"
      : "Switching language…"
    : textPending
      ? props.baked
        ? "Applying text to the image — takes 20–40s…"
        : "Saving text…"
      : scenePending
        ? "Regenerating the scene…"
        : logoPending
          ? "Re-compositing…"
          : historyPending
            ? "Restoring version…"
            : undefined;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_384px]">
      <PreviewStage
        creativeId={id}
        brandName={props.brandName}
        aspect={aspect}
        onAspectChange={setAspect}
        renders={props.renders}
        missingAspects={missingAspects}
        addAspectPending={aspectPending}
        aspectCostLabel={props.costs.regen}
        onAddAspect={(a) =>
          mutate(startAspect, () => renderNewAspect(id, a), `${a} format rendered`, undefined, "aspect")
        }
        busy={busy}
        busyLabel={busyLabel}
        approved={props.approved}
        logoDraft={logoDraft}
        logoRatio={logoRatio}
        onLogoDraftChange={setLogoDraft}
      />

      <aside className="space-y-4">
        {/* Approve / export */}
        <section
          className={cn(
            "rounded-xl border border-border bg-card p-4",
            props.approved && "border-primary/40",
          )}
        >
          {props.approved ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Check className="size-4 text-primary" /> Approved — ready to share
              </span>
              <Button
                size="xs"
                variant="ghost"
                disabled={approvePending}
                className="ml-auto text-muted-foreground"
                onClick={() => mutate(startApprove, () => unapproveCreative(id), "Approval removed")}
              >
                Unapprove
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Button
                disabled={approvePending}
                className="w-full"
                onClick={() => mutate(startApprove, () => approveCreative(id), "Creative approved")}
              >
                {approvePending ? <Loader2 className="animate-spin" /> : <Check data-icon="inline-start" />}
                Approve creative
              </Button>
              <p className="text-xs text-muted-foreground">Approving unlocks download.</p>
            </div>
          )}
        </section>

        {/* Text & language */}
        <Section
          icon={<Type className="size-4" />}
          title="Text & language"
          badge={props.baked ? `${props.costs.regen} credits` : "Free"}
          badgeAccent={props.baked}
        >
          <div className="flex flex-wrap gap-1.5">
            {COPY_LANGUAGES.map((l) => (
              <button
                key={l.id}
                type="button"
                disabled={langPending}
                onClick={() => selectLanguage(l.id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50",
                  lang === l.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {props.baked
              ? `Switching language re-sets the headline on the image · ${props.costs.regen} credits`
              : "Switching language is instant and free."}
          </p>

          {props.baked && (
            <Badge variant="secondary" className="mt-3 gap-1">
              <Lock className="size-3" /> Typography is baked into the image
            </Badge>
          )}

          <div className="mt-4 space-y-3">
            {fields.map(({ role, value }) => (
              <div key={role} className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {ROLE_LABEL[role] ?? role}
                </Label>
                <Input
                  value={drafts[role] ?? value}
                  maxLength={160}
                  onChange={(e) => setDrafts((d) => ({ ...d, [role]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <Button
            disabled={textPending || !textDirty}
            className="mt-4 w-full"
            variant={props.baked ? "default" : "secondary"}
            onClick={saveTexts}
          >
            {textPending ? <Loader2 className="animate-spin" /> : null}
            {props.baked ? `Apply to image · ${props.costs.regen} credits` : "Save · free"}
          </Button>
        </Section>

        {/* Logo & brand */}
        <Section icon={<ImageIcon className="size-4" />} title="Logo & brand" badge="Free">
          {logo ? (
            <>
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Quick position
              </Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {LOGO_PRESETS.map((p) => (
                  <Button
                    key={p.id}
                    size="xs"
                    variant="outline"
                    disabled={logoPending}
                    onClick={() => applyLogoPreset(p.id)}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>

              <Separator className="my-4" />

              {logoDraft ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Drag the box on the preview, or fine-tune below. Arrow keys nudge 0.5%, Shift+arrow 2%.
                  </p>
                  <LogoControl
                    label="X"
                    min={0}
                    max={100}
                    value={logoDraft.fx * 100}
                    onChange={(v) => setLogoField("fx", v)}
                  />
                  <LogoControl
                    label="Y"
                    min={0}
                    max={100}
                    value={logoDraft.fy * 100}
                    onChange={(v) => setLogoField("fy", v)}
                  />
                  <LogoControl
                    label="Width"
                    min={5}
                    max={50}
                    value={logoDraft.fw * 100}
                    onChange={(v) => setLogoField("fw", v)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" disabled={logoPending} onClick={applyLogoPlacement}>
                      {logoPending ? <Loader2 className="animate-spin" /> : null}
                      Apply placement · free
                    </Button>
                    <Button size="sm" variant="ghost" disabled={logoPending} onClick={() => setLogoDraft(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button size="sm" variant="outline" className="w-full" disabled={logoPending} onClick={beginLogoAdjust}>
                  <Move data-icon="inline-start" /> Adjust position &amp; size
                </Button>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">This creative has no logo layer.</p>
          )}

          {mottoLayer && (
            <>
              <Separator className="my-4" />
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Motto</Label>
                <div className="flex gap-2">
                  <Input
                    value={drafts.motto ?? mottoLayer.textByLang[lang] ?? ""}
                    maxLength={160}
                    onChange={(e) => setDrafts((d) => ({ ...d, motto: e.target.value }))}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={
                      textPending ||
                      drafts.motto === undefined ||
                      drafts.motto === (mottoLayer.textByLang[lang] ?? "")
                    }
                    onClick={() =>
                      mutate(
                        startText,
                        () =>
                          updateCreativeText({ creativeId: id, language: lang, texts: { motto: drafts.motto ?? "" } }),
                        "Motto updated",
                        () =>
                          setDrafts((d) => {
                            const next = { ...d };
                            delete next.motto;
                            return next;
                          }),
                      )
                    }
                  >
                    Save
                  </Button>
                </div>
              </div>
            </>
          )}

          <Separator className="my-4" />
          <div className="flex items-center gap-3">
            <Toggle
              variant="outline"
              size="sm"
              pressed={contactShown}
              disabled={logoPending || (!props.hasContactLine && !contactShown)}
              onPressedChange={(next) =>
                mutate(startLogo, () => toggleContactLine(id, next), next ? "Contact line shown" : "Contact line hidden")
              }
            >
              Contact line {contactShown ? "on" : "off"}
            </Toggle>
            <p className="text-xs text-muted-foreground">
              {props.hasContactLine ? "Free · content set in Brand settings." : "Add a contact line in Brand settings first."}
            </p>
          </div>
        </Section>

        {/* Scene */}
        <Section
          icon={<Wand2 className="size-4" />}
          title="Scene"
          badge={`${props.costs.regen} credits`}
          badgeAccent
        >
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={400}
            placeholder="e.g. warmer evening light, add more diyas in the background"
            className="resize-none"
          />
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={enhancePending || scenePending || note.trim().length < 8}
              onClick={enhance}
              title="Rewrite into an art-directed instruction"
            >
              {enhancePending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Sparkles data-icon="inline-start" />}
              Enhance · {props.costs.enhance} cr
            </Button>
            <Button
              size="sm"
              className="flex-1"
              disabled={scenePending || enhancePending || note.trim().length < 4}
              onClick={() =>
                mutate(startScene, () => regenerateWithInstruction(id, note), "Scene regenerated", () => setNote(""), "scene")
              }
            >
              {scenePending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
              Regenerate · {props.costs.regen} credits
            </Button>
          </div>
          {scenePending && (
            <p className="mt-2 text-xs text-muted-foreground">
              Re-imagining the scene — this can take up to a minute. Credits are refunded if it fails.
            </p>
          )}

          <button
            type="button"
            onClick={() => setShowAbout((s) => !s)}
            className="mt-4 flex w-full items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronDown className={cn("size-3.5 transition-transform", showAbout && "rotate-180")} />
            About this concept
          </button>
          {showAbout && (
            <div className="mt-2 space-y-2 rounded-lg bg-muted/50 p-3 text-xs">
              <Badge variant="secondary">
                {props.baked ? "Baked typography" : "Overlay text"}
              </Badge>
              {props.bigIdea && <p className="font-medium text-foreground">{props.bigIdea}</p>}
              {props.insightRationale && <p className="text-muted-foreground">{props.insightRationale}</p>}
            </div>
          )}
        </Section>

        {/* Layouts — free design remix */}
        <Section icon={<LayoutGrid className="size-4" />} title="Layouts" badge="Free">
          <p className="text-xs text-muted-foreground">
            Swap the design while keeping your scene and copy. We score each layout for fit.
          </p>
          {layoutOptions === null ? (
            <Button size="sm" variant="outline" className="mt-3 w-full" disabled={layoutLoading} onClick={loadLayouts}>
              {layoutLoading ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Sparkles data-icon="inline-start" />}
              Show layout options
            </Button>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {layoutOptions.map((o) => (
                <button
                  key={o.templateId}
                  type="button"
                  disabled={layoutApply}
                  title={`${o.label} · ${o.reason}`}
                  onClick={() =>
                    mutate(startLayoutApply, () => applyLayout(id, o.templateId), `Layout: ${o.label}`, () => setLayoutOptions(null))
                  }
                  className={cn(
                    "group relative overflow-hidden rounded-lg border bg-muted transition-all",
                    o.current ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-foreground/40",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={o.dataUri} alt={o.label} className="aspect-[4/5] w-full object-cover" />
                  <span className="absolute right-1 top-1 rounded bg-black/60 px-1 text-[9px] font-semibold text-white">{o.score}</span>
                  {o.current && (
                    <span className="absolute bottom-1 left-1 rounded bg-primary px-1 text-[9px] font-semibold text-primary-foreground">Current</span>
                  )}
                </button>
              ))}
              {layoutApply && (
                <p className="col-span-3 text-xs text-muted-foreground">Re-compositing all formats…</p>
              )}
            </div>
          )}
        </Section>

        {/* History */}
        <Section icon={<History className="size-4" />} title={`History · ${props.versions.length}`}>
          {props.versions.length === 0 ? (
            <p className="text-xs text-muted-foreground">No versions yet.</p>
          ) : (
            <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {props.versions.map((v, i) => (
                <li key={v.index} className="flex items-center gap-3 rounded-lg border border-border/60 p-2">
                  {v.thumbUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={v.thumbUrl} alt="" className="size-11 rounded-md border border-border object-cover" />
                  ) : (
                    <span className="size-11 rounded-md bg-muted" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">
                      v{v.index} · {CAUSE_LABEL[v.cause.type] ?? v.cause.type.replaceAll("_", " ")}
                      {i === 0 && (
                        <Badge variant="secondary" className="ml-1.5 px-1 py-0 text-[10px]">
                          Current
                        </Badge>
                      )}
                    </p>
                    {v.cause.note && <p className="truncate text-[11px] text-muted-foreground">{v.cause.note}</p>}
                    <p className="text-[11px] text-muted-foreground" suppressHydrationWarning>
                      {versionDate.format(new Date(v.createdAt))}
                    </p>
                  </div>
                  {i !== 0 && (
                    <Button
                      size="xs"
                      variant="ghost"
                      disabled={historyPending}
                      className="text-primary"
                      onClick={() =>
                        mutate(startHistory, () => revertToVersion(id, v.index), `Restored version ${v.index}`)
                      }
                    >
                      <RotateCcw data-icon="inline-start" /> Revert
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>
      </aside>

      {/* Baked language-switch confirmation */}
      <Dialog open={confirmLang !== null} onOpenChange={(open) => !open && setConfirmLang(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Languages className="size-4 text-primary" />
              Switch to {COPY_LANGUAGES.find((l) => l.id === confirmLang)?.label}?
            </DialogTitle>
            <DialogDescription>
              The headline is baked into the image, so switching re-sets the typography in{" "}
              {COPY_LANGUAGES.find((l) => l.id === confirmLang)?.label} on the artwork. Takes about 20–40 seconds ·{" "}
              {props.costs.regen} credits (refunded if it fails quality checks).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmLang(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const next = confirmLang;
                setConfirmLang(null);
                if (!next) return;
                mutate(
                  startLang,
                  () => switchCreativeLanguage(id, next),
                  `Headline re-set in ${COPY_LANGUAGES.find((l) => l.id === next)?.label}`,
                  () => setDrafts({}),
                  "lang",
                );
              }}
            >
              Switch · {props.costs.regen} credits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section(props: {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  badgeAccent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <header className="mb-3 flex items-center gap-2">
        <span className="text-muted-foreground">{props.icon}</span>
        <h2 className="text-sm font-semibold tracking-tight">{props.title}</h2>
        {props.badge && (
          <Badge variant={props.badgeAccent ? "default" : "secondary"} className="ml-auto">
            {props.badge}
          </Badge>
        )}
      </header>
      {props.children}
    </section>
  );
}

function LogoControl(props: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (pct: number) => void;
}) {
  const rounded = Math.round(props.value * 10) / 10;
  return (
    <div className="flex items-center gap-3">
      <span className="w-10 text-xs text-muted-foreground">{props.label}</span>
      <Slider
        value={[rounded]}
        min={props.min}
        max={props.max}
        step={0.5}
        onValueChange={(v) => props.onChange(Array.isArray(v) ? (v[0] ?? rounded) : v)}
        className="flex-1"
      />
      <div className="relative">
        <Input
          type="number"
          value={rounded}
          min={props.min}
          max={props.max}
          step={0.5}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isNaN(n)) props.onChange(n);
          }}
          className="h-7 w-[72px] pr-5 text-right text-xs"
        />
        <span className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center text-[10px] text-muted-foreground">
          %
        </span>
      </div>
    </div>
  );
}
