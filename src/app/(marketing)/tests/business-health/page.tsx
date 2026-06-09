import { prisma } from "@/lib/db";
import { businessDiagnosticQuestions } from "@/data/website/questions";
import { BusinessHealthWizard, type WizardQuestion } from "./wizard";

export const metadata = { title: "Business Health Check" };

// The active test lives in the database — render per-request, not at build time.
export const dynamic = "force-dynamic";

export default async function BusinessHealthPage() {
  let testId: string | null = null;
  let questions: WizardQuestion[] = businessDiagnosticQuestions;

  try {
    const test = await prisma.test.findFirst({ where: { isActive: true } });
    if (test && Array.isArray(test.questions) && test.questions.length > 0) {
      testId = test.id;
      questions = test.questions as unknown as WizardQuestion[];
    }
  } catch {
    // Database unavailable — fall back to the static question set (testId stays null).
  }

  return (
    <main className="bg-mk-paper">
      {/* ====== Hero ====== */}
      <section className="mx-auto max-w-3xl px-5 pb-12 pt-32 text-center md:px-8 md:pb-16 md:pt-40">
        <p className="mk-mono text-[11px] text-mk-slate">
          Free diagnostic · {questions.length} questions · 5 minutes
        </p>
        <h1 className="mk-display mt-5 text-balance text-4xl font-medium leading-tight text-mk-ink md:text-5xl">
          The Business Health Check
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-mk-slate">
          Twenty sharp questions across finance, people, operations, market and
          strategy. Answer honestly, and your scored report, with concrete
          recommendations, lands straight in your inbox.
        </p>
      </section>

      {/* ====== Wizard ====== */}
      <section className="mx-auto max-w-2xl px-5 pb-24 md:px-8 md:pb-32">
        <BusinessHealthWizard testId={testId} questions={questions} />
      </section>
    </main>
  );
}
