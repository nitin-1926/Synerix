import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

/** Share card for every marketing route. WhatsApp is the primary channel for
 * Indian MSME outreach and a link with no image renders as a blank grey card,
 * so this is a conversion fix as much as an SEO one. */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Synerix — AI ad creatives and consulting for Indian brands";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0B1020",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 20, height: 20, borderRadius: 999, background: "#3BE8E0" }} />
          <div style={{ color: "#3BE8E0", fontSize: 26, letterSpacing: 6, textTransform: "uppercase" }}>
            {SITE.name}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ color: "#FFFFFF", fontSize: 68, lineHeight: 1.1, fontWeight: 700, maxWidth: 900 }}>
            Ad creatives that look shot, not generated.
          </div>
          <div style={{ color: "#C7D0E0", fontSize: 30, maxWidth: 860, lineHeight: 1.35 }}>
            Product and apparel photography, festival campaigns and headline typography in English, Hindi and Punjabi.
          </div>
        </div>
        <div style={{ color: "#7E8AA3", fontSize: 24 }}>www.synerix.in</div>
      </div>
    ),
    size,
  );
}
