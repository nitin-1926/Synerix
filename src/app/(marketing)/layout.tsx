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
  alternates: { canonical: "/" },
  openGraph: {
    siteName: "Synerix",
    type: "website",
    locale: "en_IN",
    url: "/",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    // Marketing pages own their palette — always light, independent of the
    // app's theme toggle (the `light` class wins over the app's dark mode).
    <div className={`${fraunces.variable} light bg-mk-paper text-mk-ink`}>
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
