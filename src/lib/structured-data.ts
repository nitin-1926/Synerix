import { SITE, SITE_URL, url } from "@/lib/site";

/**
 * JSON-LD for search engines and answer engines. Answer engines resolve an
 * entity ("what is Synerix?") far more reliably from structured data than from
 * marketing prose, and this is what makes a knowledge panel, a product rich
 * result and an FAQ rich result possible at all.
 */

const ORG_ID = `${SITE_URL}/#organization`;
const SITE_ID = `${SITE_URL}/#website`;

export const organizationLd = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: SITE.name,
  legalName: SITE.legalName,
  url: SITE_URL,
  logo: url("/images/SynergyLogoCropped.png"),
  email: SITE.email,
  description: SITE.tagline,
  address: {
    "@type": "PostalAddress",
    addressLocality: SITE.city,
    addressRegion: SITE.region,
    addressCountry: SITE.country,
  },
  areaServed: { "@type": "Country", name: "India" },
  knowsAbout: [
    "AI advertising creative generation",
    "e-commerce apparel photography",
    "MSME business consulting",
    "festival campaign creatives",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "sales",
    email: SITE.email,
    areaServed: "IN",
    availableLanguage: ["English", "Hindi", "Punjabi"],
  },
};

export const websiteLd = {
  "@type": "WebSite",
  "@id": SITE_ID,
  url: SITE_URL,
  name: SITE.name,
  publisher: { "@id": ORG_ID },
  inLanguage: "en-IN",
};

export const studioProductLd = {
  "@type": "SoftwareApplication",
  "@id": `${SITE_URL}/synerix-studio#software`,
  name: "Synerix Studio",
  applicationCategory: "DesignApplication",
  operatingSystem: "Web",
  url: url("/synerix-studio"),
  publisher: { "@id": ORG_ID },
  description:
    "Synerix Studio turns a product photo into finished ad creatives and e-commerce apparel shots: it researches the brand, writes the concept, renders the photograph and sets the headline typography in English, Hindi, Hinglish and Punjabi.",
  featureList: [
    "On-model apparel photography from a garment photo",
    "Festival and occasion campaign creatives",
    "Multi-language headline typography (English, Hindi, Hinglish, Punjabi)",
    "Brand kit, product library and creative editor",
  ],
  offers: {
    "@type": "Offer",
    priceCurrency: "INR",
    availability: "https://schema.org/InStock",
    url: url("/synerix-studio"),
    description: "Credit-based pricing; two credits per generated creative. Access is invite-only.",
  },
};

/** Question-shaped answers, kept short and factual so an answer engine can
 * quote them verbatim. These mirror the on-site assistant's knowledge. */
export const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "What is Synerix Studio?",
    a: "Synerix Studio is an AI creative studio for Indian brands. You add a product or garment photo once, then generate finished ad creatives and e-commerce product shots from it: the tool writes the concept, renders the photograph and sets the headline typography in your brand's colours.",
  },
  {
    q: "How much does an AI ad creative cost on Synerix Studio?",
    a: "Pricing is credit based. Each generated creative costs two credits, and prompt enhancement costs a quarter credit. Bulk e-commerce apparel catalogues are quoted per image because they run on a lighter pipeline than campaign creatives.",
  },
  {
    q: "Can Synerix Studio put my clothing on a model without a photoshoot?",
    a: "Yes. Upload a photo of the garment and choose an AI model, and Studio renders that model wearing that exact garment as a clean e-commerce product-page shot. Colour, print, cut, neckline, sleeve and hem are checked against your original photo before the image is delivered.",
  },
  {
    q: "Which languages can the ad copy be in?",
    a: "English, Hindi (Devanagari), Hinglish (Latin script) and Punjabi (Gurmukhi). Headline type is composited with real fonts rather than drawn by the image model, so every script is spelled correctly.",
  },
  {
    q: "Who is Synerix for?",
    a: "Indian MSMEs and D2C brands: FMCG and packaged-goods brands running festival and product campaigns, e-commerce apparel sellers who need catalogue images at volume, and premium fashion labels who need campaign photography.",
  },
  {
    q: "How do I get access to Synerix Studio?",
    a: `Access is invite only today. Email ${SITE.email} with your brand and what you sell, and the team will set up your workspace.`,
  },
];

export const faqLd = {
  "@type": "FAQPage",
  "@id": `${SITE_URL}/#faq`,
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export function breadcrumbLd(trail: Array<{ name: string; path: string }>) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: url(t.path),
    })),
  };
}

/** Wrap any set of nodes into a single @graph document. */
export function graph(...nodes: object[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}
