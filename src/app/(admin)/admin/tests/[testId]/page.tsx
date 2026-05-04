import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { TestBuilder, type BuilderQuestion } from "./test-builder";

export default async function AdminTestEditorPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;

  if (testId === "new") {
    return <TestBuilder test={null} resultCount={0} />;
  }

  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: { _count: { select: { testResults: true } } },
  });
  if (!test) notFound();

  const questions = (
    Array.isArray(test.questions) ? test.questions : []
  ) as unknown as BuilderQuestion[];

  return (
    <TestBuilder
      test={{
        id: test.id,
        name: test.name,
        type: test.type === "paid" ? "paid" : "free",
        description: test.description ?? "",
        questions,
        isActive: test.isActive,
      }}
      resultCount={test._count.testResults}
    />
  );
}
