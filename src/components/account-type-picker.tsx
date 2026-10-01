"use client";

import { WORKSPACE_TYPES, type WorkspaceTypeId } from "@/lib/workspace-type";

/**
 * Radio-card picker for the workspace account type. Controlled; pass `name`
 * so the checked radio also lands in plain FormData submits (onboarding).
 */
export function AccountTypePicker(props: {
  value: WorkspaceTypeId | "";
  onChange: (id: WorkspaceTypeId) => void;
  name?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      {WORKSPACE_TYPES.map((t) => (
        <label
          key={t.id}
          className={`flex items-start gap-2.5 rounded-lg border p-3 text-sm transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50 ${
            props.disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
          } ${props.value === t.id ? "border-primary bg-primary/5" : "border-border" + (props.disabled ? "" : " hover:bg-muted/50")}`}
        >
          <input
            type="radio"
            name={props.name ?? "accountType"}
            value={t.id}
            checked={props.value === t.id}
            onChange={() => props.onChange(t.id)}
            required={props.required}
            disabled={props.disabled}
            className="mt-0.5 accent-primary"
          />
          <span>
            <span className="font-medium">{t.label}</span>
            <span className="block text-xs text-muted-foreground">{t.hint}</span>
          </span>
        </label>
      ))}
    </div>
  );
}
