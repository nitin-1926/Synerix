import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OnboardingWizard } from "./wizard";

export const metadata = { title: "Set up your brand — Synerix Studio" };

export default async function OnboardingPage() {
  const auth = await requireAuth();
  const brand = await prisma.brand.findFirst({ where: { workspaceId: auth.workspaceId } });
  if (brand?.ingestStatus === "READY") {
    const productCount = await prisma.product.count({ where: { brandId: brand.id } });
    if (productCount > 0) redirect("/dashboard");
    redirect("/products?onboarding=1");
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="flex items-center gap-3">
        <span className="h-1.5 w-8 rounded-full bg-primary" />
        <span className="h-1.5 w-8 rounded-full bg-muted" />
      </div>
      <p className="mt-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Step 1 of 2
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
        Tell us about your business
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Paste your website and we&apos;ll learn your brand — colors, logo, voice, products. No
        website? Add the basics by hand, it takes a minute.
      </p>
      <div className="mt-8">
        <OnboardingWizard
          initialStatus={brand?.ingestStatus ?? "NONE"}
          initialError={brand?.ingestError ?? null}
          initialUrl={brand?.websiteUrl ?? ""}
        />
      </div>
    </div>
  );
}
