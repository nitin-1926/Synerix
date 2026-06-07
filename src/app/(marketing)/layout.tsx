import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { ChatWidget } from "@/components/marketing/chat-widget";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT", "WONK"],
});

export const metadata: Metadata = {
  title: {
    default: "Synerix | Business consulting for Indian MSMEs",
    template: "%s | Synerix",
  },
  description:
    "Synerix is a hands-on consulting practice for Indian MSMEs: a free Business Health Check, practical counsel on cash flow, operations and growth, and Synerix Studio, its AI tool for ad creatives.",
  metadataBase: new URL(process.env.WEBSITE_URL ?? "https://www.synerix.in"),
  openGraph: {
    siteName: "Synerix",
    type: "website",
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    // Marketing pages own their palette — always light, independent of the
    // app's theme toggle (the `light` class wins over the app's dark mode).
    <div className={`${fraunces.variable} light bg-mk-paper text-mk-ink`}>
      <MarketingNav />
      {children}
      <MarketingFooter />
      <ChatWidget />
    </div>
  );
}
