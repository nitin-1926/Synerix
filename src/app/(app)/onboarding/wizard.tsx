"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe, Loader2, PencilLine } from "lucide-react";
import { createBrandFromUrl, createBrandManual } from "@/app/actions/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PROFILE_CHANNELS } from "@/lib/workspace-profile";
import { AccountTypePicker } from "@/components/account-type-picker";
import type { WorkspaceTypeId } from "@/lib/workspace-type";

type Mode = "url" | "manual";
type Status = "NONE" | "PENDING" | "CRAWLING" | "EXTRACTING" | "READY" | "FAILED";

/** Business-profile answers, shared by both forms. The account type is the
 * one that matters — it sets the workspace's photography + concept style and
 * which surfaces it sees (e.g. AI models only for apparel businesses). */
function ProfileFields(props: {
  accountType: WorkspaceTypeId | "";
  onAccountType: (id: WorkspaceTypeId) => void;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          What kind of business is this? <span className="font-normal">— this sets your photography style</span>
        </p>
        <AccountTypePicker value={props.accountType} onChange={props.onAccountType} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-channel">
          You sell via <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Select name="salesChannel">
          <SelectTrigger id="profile-channel" className="w-full">
            <SelectValue placeholder="Choose…" />
          </SelectTrigger>
          <SelectContent>
            {PROFILE_CHANNELS.map((o) => (
              <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

const STAGE_COPY: Record<string, string> = {
  PENDING: "Queued…",
  CRAWLING: "Reading your website…",
  EXTRACTING: "Learning your brand — colors, voice, products…",
};

export function OnboardingWizard(props: {
  initialStatus: Status;
  initialError: string | null;
  initialUrl: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("url");
  const [accountType, setAccountType] = useState<WorkspaceTypeId | "">("");
  const [status, setStatus] = useState<Status>(props.initialStatus);
  const [error, setError] = useState<string | null>(props.initialError);
  const [pending, startTransition] = useTransition();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ingesting = ["PENDING", "CRAWLING", "EXTRACTING"].includes(status);

  // Escape hatch: stop polling and let the user fill in details manually if
  // ingest hangs.
  function skipToManual() {
    if (pollRef.current) clearInterval(pollRef.current);
    setStatus("NONE");
    setMode("manual");
  }

  useEffect(() => {
    if (!ingesting) return;
    pollRef.current = setInterval(async () => {
      // A transient fetch/parse failure just skips this tick — the next poll
      // retries; without the guard it becomes an unhandled rejection and the
      // wizard spins forever with stale status.
      let b: { ingestStatus?: string; ingestError?: string | null };
      try {
        const r = await fetch("/api/brand-status");
        b = await r.json();
      } catch {
        return;
      }
      setStatus((b.ingestStatus as Status | undefined) ?? "NONE");
      setError(b.ingestError ?? null);
      if (b.ingestStatus === "READY") {
        clearInterval(pollRef.current!);
        router.push("/products?onboarding=1");
        router.refresh();
      }
      if (b.ingestStatus === "FAILED") clearInterval(pollRef.current!);
    }, 2500);
    return () => clearInterval(pollRef.current!);
  }, [ingesting, router]);

  function submitUrl(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const res = await createBrandFromUrl(formData);
      if (res?.error) setError(res.error);
      else setStatus("PENDING");
    });
  }

  function submitManual(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const res = await createBrandManual(formData);
      if (res?.error) setError(res.error);
    });
  }

  if (ingesting) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Loader2 className="size-6 animate-spin" />
          </span>
          <p className="mt-4 font-medium text-foreground">{STAGE_COPY[status] ?? "Working…"}</p>
          <p className="mt-1 text-sm text-muted-foreground">This usually takes 1–2 minutes.</p>
          <button
            type="button"
            onClick={skipToManual}
            className="mt-6 text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Taking too long? Fill in details manually
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)}>
        <TabsList className="w-full">
          <TabsTrigger value="url">
            <Globe className="size-4" /> From website
          </TabsTrigger>
          <TabsTrigger value="manual">
            <PencilLine className="size-4" /> Enter manually
          </TabsTrigger>
        </TabsList>

        {status === "FAILED" && (
          <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            We couldn&apos;t read that website{error ? `: ${error}` : ""}. Try again or enter details
            manually.
          </div>
        )}

        <TabsContent value="url" className="mt-6">
          <Card>
            <CardContent>
              <form action={submitUrl} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">Your website or Instagram-linked site</Label>
                  <Input
                    id="websiteUrl"
                    name="websiteUrl"
                    placeholder="sharmasweets.in"
                    defaultValue={props.initialUrl}
                    required
                  />
                </div>
                <ProfileFields accountType={accountType} onAccountType={setAccountType} />
                <Button type="submit" disabled={pending} className="w-full" size="lg">
                  {pending ? "Starting…" : "Analyze my website"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="mt-6">
          <Card>
            <CardContent>
              <form action={submitManual} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Business name *</Label>
                    <Input id="name" name="name" placeholder="Sharma Sweets" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">What do you sell? *</Label>
                    <Input id="category" name="category" placeholder="Sweets & snacks" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" placeholder="Ludhiana" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primaryColorHex">Brand color</Label>
                    <Input
                      id="primaryColorHex"
                      name="primaryColorHex"
                      type="color"
                      defaultValue="#b83b5e"
                      className="h-9 p-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motto">Tagline / motto</Label>
                  <Input id="motto" name="motto" placeholder="Mithas ka doosra naam" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="oneLiner">One line about your business</Label>
                  <Input
                    id="oneLiner"
                    name="oneLiner"
                    placeholder="Fresh mithai in pure desi ghee since 1987"
                  />
                </div>
                <ProfileFields accountType={accountType} onAccountType={setAccountType} />
                <Button type="submit" disabled={pending} className="w-full" size="lg">
                  {pending ? "Saving…" : "Save & continue"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && status !== "FAILED" && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
