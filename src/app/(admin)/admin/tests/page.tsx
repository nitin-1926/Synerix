import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TestActiveToggle } from "./test-toggle";

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function AdminTestsPage() {
  const tests = await prisma.test.findMany({
    include: { _count: { select: { testResults: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {tests.length} test{tests.length === 1 ? "" : "s"}
        </p>
        <Button nativeButton={false} render={<Link href="/admin/tests/new" />}>
          <Plus className="mr-1.5 size-4" />
          New test
        </Button>
      </div>

      <ul className="divide-y divide-border rounded-lg border border-border">
        {tests.map((test) => {
          const questionCount = Array.isArray(test.questions) ? test.questions.length : 0;
          return (
            <li key={test.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{test.name}</p>
                <p className="text-xs text-muted-foreground">
                  {questionCount} questions · {test._count.testResults} results · created{" "}
                  {dateFmt.format(test.createdAt)}
                </p>
              </div>
              <Badge variant="outline">{test.type}</Badge>
              <Button
                size="sm"
                variant="outline"
                nativeButton={false}
                render={<Link href={`/admin/tests/${test.id}`} />}
              >
                Edit
              </Button>
              <TestActiveToggle testId={test.id} isActive={test.isActive} />
            </li>
          );
        })}
      </ul>

      {tests.length === 0 && <p className="text-sm text-muted-foreground">No tests yet.</p>}
    </div>
  );
}
