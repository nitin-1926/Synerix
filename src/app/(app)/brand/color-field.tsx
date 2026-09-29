"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

/** Compact swatch + live hex readout. The readout used to be server-rendered,
 * so it kept showing the saved value while a new colour was being picked. */
export function ColorField({ id, defaultValue }: { id: string; defaultValue: string }) {
  const [hex, setHex] = useState(defaultValue);
  return (
    <div className="flex items-center gap-3">
      <Input
        id={id}
        name={id}
        type="color"
        defaultValue={defaultValue}
        onChange={(e) => setHex(e.target.value)}
        className="size-10 shrink-0 cursor-pointer rounded-lg p-1"
      />
      <span className="font-mono text-sm uppercase text-muted-foreground">{hex}</span>
    </div>
  );
}
