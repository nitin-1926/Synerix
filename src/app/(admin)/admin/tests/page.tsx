import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TestActiveToggle } from "./test-toggle";
import { requireSuperAdmin } from "@/lib/auth";
import { EmptyState, plural } from "../admin-ui";

export const metadata = { title: "Tests | Synerix Admin" };

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function AdminTestsPage() {
  // requireSuperAdmin() is the auth boundary — see its docstring.
  await requireSuperAdmin();
  const tests = await prisma.test.findMany({
    include: { _count: { select: { testResults: true } } },
    orderBy: { createdAt: "desc" },
  });

  const newTestButton = (
    <Button nativeButton={false} render={<Link href="/admin/tests/new" />}>
      <Plus className="mr-1.5 size-4" />
      New test
    </Button>
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground tabular-nums">{plural(tests.length, "test")}</p>
        {tests.length > 0 && newTestButton}
      </div>

      {tests.length === 0 ? (
        <EmptyState
          title="No tests yet"
          body="Tests are the questionnaires leads take on the marketing site. Create one to start collecting results."
          action={newTestButton}
        />
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {tests.map((test) => {
            const questionCount = Array.isArray(test.questions) ? test.questions.length : 0;
            return (
              <li key={test.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{test.name}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {plural(questionCount, "question")} · {plural(test._count.testResults, "result")} · created{" "}
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
      )}
    </div>
  );
}
