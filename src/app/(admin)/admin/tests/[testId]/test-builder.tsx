"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronDown,
  Plus,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { adminDeleteTest, adminSaveTest } from "@/app/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface BuilderQuestion {
  id: string;
  question: string;
  category: string;
  options: { id: string; content: string; weightAge: string | number }[];
}

interface BuilderTest {
  id: string;
  name: string;
  type: "paid" | "free";
  description: string;
  questions: BuilderQuestion[];
  isActive: boolean;
}

const CATEGORIES = [
  "Financial Health",
  "People & Compliance",
  "Operational Efficiency",
  "Market & Growth",
  "Strategy & Resilience",
];

const CUSTOM_CATEGORY = "__custom__";
const WEIGHTAGES = ["2", "1", "0"];

/** Next id in the seed-data scheme: numeric strings ("1", "2", …). */
function nextId(ids: string[]) {
  const max = ids.reduce((acc, id) => {
    const n = Number(id);
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return String(max + 1);
}

function blankQuestion(existing: BuilderQuestion[]): BuilderQuestion {
  return {
    id: nextId(existing.map((q) => q.id)),
    question: "",
    category: "",
    options: [
      { id: "1", content: "", weightAge: "2" },
      { id: "2", content: "", weightAge: "1" },
      { id: "3", content: "", weightAge: "0" },
    ],
  };
}

function errorMessage(e: unknown) {
  return e instanceof Error ? e.message : "Something went wrong";
}

export function TestBuilder(props: { test: BuilderTest | null; resultCount: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(props.test?.name ?? "");
  const [type, setType] = useState<"paid" | "free">(props.test?.type ?? "free");
  const [description, setDescription] = useState(props.test?.description ?? "");
  const [isActive, setIsActive] = useState(props.test?.isActive ?? true);
  const [questions, setQuestions] = useState<BuilderQuestion[]>(
    () =>
      props.test?.questions.map((q) => ({
        ...q,
        options: q.options.map((o) => ({ ...o, weightAge: String(o.weightAge) })),
      })) ?? [],
  );
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [customCategoryIds, setCustomCategoryIds] = useState<Set<string>>(new Set());
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function mutateQuestions(fn: (qs: BuilderQuestion[]) => BuilderQuestion[]) {
    setQuestions((qs) => fn(qs));
    setDirty(true);
  }

  function updateQuestion(id: string, patch: Partial<BuilderQuestion>) {
    mutateQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  function updateOption(
    questionId: string,
    optionId: string,
    patch: Partial<BuilderQuestion["options"][number]>,
  ) {
    mutateQuestions((qs) =>
      qs.map((q) =>
        q.id === questionId
          ? { ...q, options: q.options.map((o) => (o.id === optionId ? { ...o, ...patch } : o)) }
          : q,
      ),
    );
  }

  function addQuestion() {
    const q = blankQuestion(questions);
    mutateQuestions((qs) => [...qs, q]);
    setOpenIds((ids) => new Set(ids).add(q.id));
  }

  function removeQuestion(id: string) {
    mutateQuestions((qs) => qs.filter((q) => q.id !== id));
  }

  function moveQuestion(id: string, delta: -1 | 1) {
    mutateQuestions((qs) => {
      const i = qs.findIndex((q) => q.id === id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= qs.length) return qs;
      const next = [...qs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function addOption(questionId: string) {
    mutateQuestions((qs) =>
      qs.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: [
                ...q.options,
                { id: nextId(q.options.map((o) => o.id)), content: "", weightAge: "0" },
              ],
            }
          : q,
      ),
    );
  }

  function removeOption(questionId: string, optionId: string) {
    mutateQuestions((qs) =>
      qs.map((q) =>
        q.id === questionId && q.options.length > 2
          ? { ...q, options: q.options.filter((o) => o.id !== optionId) }
          : q,
      ),
    );
  }

  function toggleOpen(id: string) {
    setOpenIds((ids) => {
      const next = new Set(ids);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function validate(): string | null {
    if (!name.trim()) return "Test name is required";
    for (const [i, q] of questions.entries()) {
      if (!q.question.trim()) return `Question ${i + 1} has no text`;
      if (!q.category.trim()) return `Question ${i + 1} has no category`;
      if (q.options.length < 2) return `Question ${i + 1} needs at least 2 options`;
      if (q.options.some((o) => !o.content.trim()))
        return `Question ${i + 1} has an empty option`;
    }
    return null;
  }

  function save() {
    const problem = validate();
    if (problem) {
      toast.error(problem);
      return;
    }
    startTransition(async () => {
      try {
        await adminSaveTest({
          id: props.test?.id,
          name: name.trim(),
          type,
          description: description.trim() || undefined,
          questions,
          isActive,
        });
        setDirty(false);
        if (props.test) {
          toast.success("Test saved");
          router.refresh();
        } else {
          toast.success("Test created");
          router.push("/admin/tests");
        }
      } catch (e) {
        toast.error(errorMessage(e));
      }
    });
  }

  function deleteTest() {
    if (!props.test) return;
    const id = props.test.id;
    startTransition(async () => {
      try {
        const res = await adminDeleteTest(id);
        if (res.error) {
          toast.error(res.error);
          return;
        }
        toast.success("Test deleted");
        router.push("/admin/tests");
      } catch (e) {
        toast.error(errorMessage(e));
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/tests"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          All tests
        </Link>
        <div className="flex items-center gap-3">
          {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
          <Button onClick={save} disabled={pending}>
            {pending ? "Saving…" : props.test ? "Save test" : "Create test"}
          </Button>
        </div>
      </div>

      {props.resultCount > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <p>
            This test has {props.resultCount} response{props.resultCount === 1 ? "" : "s"};
            changing or removing questions affects past analysis.
          </p>
        </div>
      )}

      {/* Test details */}
      <Card>
        <CardHeader>
          <CardTitle>{props.test ? "Edit test" : "New test"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="test-name">Test name</Label>
              <Input
                id="test-name"
                value={name}
                placeholder="e.g. Business Health Diagnostic"
                onChange={(e) => {
                  setName(e.target.value);
                  setDirty(true);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={type}
                onValueChange={(v) => {
                  if (v === "paid" || v === "free") {
                    setType(v);
                    setDirty(true);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="test-description">Description</Label>
            <Textarea
              id="test-description"
              rows={3}
              value={description}
              placeholder="Optional description shown to admins"
              onChange={(e) => {
                setDescription(e.target.value);
                setDirty(true);
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              aria-label={isActive ? "Deactivate test" : "Activate test"}
              onClick={() => {
                setIsActive((v) => !v);
                setDirty(true);
              }}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                isActive ? "bg-primary" : "bg-muted-foreground/30",
              )}
            >
              <span
                className={cn(
                  "inline-block size-4 transform rounded-full bg-background shadow-sm transition-transform",
                  isActive ? "translate-x-[18px]" : "translate-x-0.5",
                )}
              />
            </button>
            <span className="text-sm">Active (visible to users)</span>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Questions ({questions.length})</p>
          <Button size="sm" variant="outline" onClick={addQuestion}>
            <Plus className="mr-1 size-3.5" />
            Add question
          </Button>
        </div>

        {questions.length === 0 && (
          <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No questions yet — click “Add question” to get started.
          </p>
        )}

        {questions.map((q, index) => {
          const open = openIds.has(q.id);
          const isCustomCategory =
            customCategoryIds.has(q.id) || (q.category !== "" && !CATEGORIES.includes(q.category));
          const selectValue = isCustomCategory
            ? CUSTOM_CATEGORY
            : q.category === ""
              ? null
              : q.category;
          return (
            <Card key={q.id} className="gap-0 py-0">
              <div className="flex w-full items-center gap-2 px-4 py-3">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  aria-expanded={open}
                  onClick={() => toggleOpen(q.id)}
                >
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform",
                      !open && "-rotate-90",
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {index + 1}. {q.question.trim() || "Untitled question"}
                  </span>
                  {q.category && (
                    <Badge variant="secondary" className="hidden sm:inline-flex">
                      {q.category}
                    </Badge>
                  )}
                </button>
                <span className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Move up"
                    aria-label={`Move question ${index + 1} up`}
                    disabled={index === 0}
                    onClick={() => moveQuestion(q.id, -1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Move down"
                    aria-label={`Move question ${index + 1} down`}
                    disabled={index === questions.length - 1}
                    onClick={() => moveQuestion(q.id, 1)}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Remove question"
                    aria-label={`Remove question ${index + 1}`}
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeQuestion(q.id)}
                  >
                    <Trash2 />
                  </Button>
                </span>
              </div>

              {open && (
                <CardContent className="space-y-4 border-t border-border px-4 py-4">
                  <div className="space-y-1.5">
                    <Label htmlFor={`q-${q.id}-text`}>Question text</Label>
                    <Input
                      id={`q-${q.id}-text`}
                      value={q.question}
                      placeholder="Enter your question"
                      onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Select
                        value={selectValue}
                        onValueChange={(v) => {
                          if (typeof v !== "string") return;
                          setCustomCategoryIds((ids) => {
                            const next = new Set(ids);
                            if (v === CUSTOM_CATEGORY) next.add(q.id);
                            else next.delete(q.id);
                            return next;
                          });
                          updateQuestion(q.id, {
                            category: v === CUSTOM_CATEGORY ? "" : v,
                          });
                        }}
                      >
                        <SelectTrigger className="w-full sm:w-64">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                          <SelectItem value={CUSTOM_CATEGORY}>Custom…</SelectItem>
                        </SelectContent>
                      </Select>
                      {isCustomCategory && (
                        <Input
                          value={q.category}
                          placeholder="Custom category name"
                          onChange={(e) => updateQuestion(q.id, { category: e.target.value })}
                        />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Options (with weightage)</Label>
                    {q.options.map((o, optIndex) => (
                      <div key={o.id} className="flex items-center gap-2">
                        <span className="w-5 text-right text-sm text-muted-foreground">
                          {optIndex + 1}.
                        </span>
                        <Input
                          value={o.content}
                          placeholder="Option text"
                          aria-label={`Option ${optIndex + 1} text`}
                          onChange={(e) => updateOption(q.id, o.id, { content: e.target.value })}
                        />
                        <Select
                          value={String(o.weightAge)}
                          onValueChange={(v) => {
                            if (typeof v === "string" && WEIGHTAGES.includes(v)) {
                              updateOption(q.id, o.id, { weightAge: v });
                            }
                          }}
                        >
                          <SelectTrigger className="w-16" aria-label={`Option ${optIndex + 1} weightage`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {WEIGHTAGES.map((w) => (
                              <SelectItem key={w} value={w}>
                                {w}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Remove option"
                          aria-label={`Remove option ${optIndex + 1}`}
                          disabled={q.options.length <= 2}
                          onClick={() => removeOption(q.id, o.id)}
                        >
                          <X />
                        </Button>
                      </div>
                    ))}
                    <Button size="sm" variant="ghost" onClick={() => addOption(q.id)}>
                      <Plus className="mr-1 size-3.5" />
                      Add option
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        {props.test ? (
          <Dialog>
            <DialogTrigger render={<Button variant="destructive" disabled={pending} />}>
              <Trash2 className="mr-1.5 size-4" />
              Delete test
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete this test?</DialogTitle>
                <DialogDescription>
                  {props.resultCount > 0
                    ? `Deletion is blocked while ${props.resultCount} result${props.resultCount === 1 ? "" : "s"} exist — deactivate the test instead.`
                    : "This permanently removes the test and its questions."}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="destructive" disabled={pending} onClick={deleteTest}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
          <Button onClick={save} disabled={pending}>
            {pending ? "Saving…" : props.test ? "Save test" : "Create test"}
          </Button>
        </div>
      </div>
    </div>
  );
}
