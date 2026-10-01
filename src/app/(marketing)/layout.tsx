import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { StructuredData } from "@/components/structured-data";
import { graph, organizationLd, websiteLd } from "@/lib/structured-data";
import { Fraunces } from "next/font/google";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { ChatWidget } from "@/components/marketing/chat-widget";
import { FingerprintIdentity } from "@/components/fingerprint";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT", "WONK"],
});

export const metadata: Metadata = {
  title: {
    // Pages set full titles themselves; the template only brands the ones that
    // set a bare segment name. Double-branding pushed real titles past the
    // ~60-char SERP truncation point.
    default: "Synerix | Business consulting for Indian MSMEs",
    template: "%s | Synerix",
  },
  description:
    "Synerix is a hands-on consulting practice for Indian MSMEs: a free Business Health Check, practical counsel on cash flow, operations and growth, and Synerix Studio, its AI tool for ad creatives.",
  metadataBase: new URL(SITE_URL),
  // No canonical/og:url here: a layout-level "/" is INHERITED by every page that
  // doesn't set its own, which told Google /tests/business-health was a
  // duplicate of the homepage. Each page declares its own canonical.
  openGraph: {
    siteName: "Synerix",
    type: "website",
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    // Marketing pages own their palette — always light, independent of the
    // app's theme toggle (the `light` class wins over the app's dark mode).
    // Focus rings: the app's base outline colour (ring/50, dark navy) vanishes
    // on the ink sections; cyan-deep clears 3:1 on both paper and ink.
    <div className={`${fraunces.variable} light bg-mk-paper text-mk-ink [&_:focus-visible]:outline-mk-cyan-deep`}>
      <StructuredData data={graph(organizationLd, websiteLd)} />
      <FingerprintIdentity>
        <MarketingNav />
        {children}
        <MarketingFooter />
        <ChatWidget />
      </FingerprintIdentity>
    </div>
  );
}
