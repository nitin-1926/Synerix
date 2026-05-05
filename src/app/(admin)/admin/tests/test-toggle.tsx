"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { adminToggleTestActive } from "@/app/actions/admin";
import { cn } from "@/lib/utils";

export function TestActiveToggle(props: { testId: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      try {
        await adminToggleTestActive(props.testId, !props.isActive);
        toast.success(props.isActive ? "Test deactivated" : "Test activated");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={props.isActive}
      aria-label={props.isActive ? "Deactivate test" : "Activate test"}
      disabled={pending}
      onClick={toggle}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50",
        props.isActive ? "bg-primary" : "bg-muted-foreground/30",
      )}
    >
      <span
        className={cn(
          "inline-block size-4 transform rounded-full bg-background shadow-sm transition-transform",
          props.isActive ? "translate-x-[18px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
