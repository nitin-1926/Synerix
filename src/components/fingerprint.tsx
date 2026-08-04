"use client";

import { createContext, useContext } from "react";
import { FingerprintProvider, useVisitorData } from "@fingerprint/react";

/**
 * Fingerprint device identification for the marketing surface.
 * Same workspace/key/region as nexus; identifies on load (`immediate: true`).
 */

const API_KEY = process.env.NEXT_PUBLIC_FINGERPRINT_API_KEY ?? "";
const REGION = (process.env.NEXT_PUBLIC_FINGERPRINT_REGION ?? "ap") as "us" | "eu" | "ap";

type VisitorData = ReturnType<typeof useVisitorData>;

const FingerprintCtx = createContext<VisitorData | null>(null);

function Identifier({ children }: { children: React.ReactNode }) {
  const visitor = useVisitorData({ immediate: true });
  return <FingerprintCtx.Provider value={visitor}>{children}</FingerprintCtx.Provider>;
}

export function FingerprintIdentity({ children }: { children: React.ReactNode }) {
  return (
    <FingerprintProvider apiKey={API_KEY} region={REGION}>
      <Identifier>{children}</Identifier>
    </FingerprintProvider>
  );
}

/** Visitor id for the current device, or null while loading / if blocked. */
export function useFingerprint() {
  const ctx = useContext(FingerprintCtx);
  return {
    visitorId: ctx?.data?.visitor_id ?? null,
    eventId: ctx?.data?.event_id ?? null,
    isLoading: ctx?.isLoading ?? false,
  };
}
