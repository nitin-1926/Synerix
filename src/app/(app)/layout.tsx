import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Server actions POST to the page that hosts the form, so the function limit
// for every app-shell action lives here. The Vercel default (10s) killed the
// generate action mid-flight on cold starts (auth + ~8 Supabase round-trips +
// Trigger enqueue) — the run was already enqueued, so the user saw the crash
// page while the generation kept going. 60s absorbs the worst cold path; all
// genuinely slow work already lives in Trigger tasks, not actions.
export const maxDuration = 60;
import { requireAuth, ADMIN_ACTING_COOKIE } from "@/lib/auth";
import { getBalance } from "@/lib/credits";
import { prisma } from "@/lib/db";
import { AppNav } from "@/components/app-nav";
import { AdminViewingBanner } from "@/components/admin-viewing-banner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireAuth();
  // Super-admins live in the dedicated admin home; they only reach the product
  // UI by "entering" a customer (which sets the acting cookie). Otherwise bounce.
  const acting = (await cookies()).get(ADMIN_ACTING_COOKIE)?.value === "1";
  if (auth.isSuperAdmin && !acting) redirect("/admin");

  const [balance, brand] = await Promise.all([
    getBalance(auth.workspaceId),
    prisma.brand.findFirst({ where: { workspaceId: auth.workspaceId }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="flex min-h-dvh flex-col bg-background md:flex-row">
      <AppNav
        workspaceName={auth.workspaceName}
        brandName={brand?.name ?? null}
        creditBalance={balance}
        email={auth.email}
        isSuperAdmin={auth.isSuperAdmin}
        workspaces={auth.memberships.map((m) => ({
          id: m.workspaceId,
          name: m.workspaceName,
          active: m.workspaceId === auth.workspaceId,
        }))}
      />
      <main className="min-w-0 flex-1 pb-20 md:pb-0">
        {auth.isSuperAdmin && acting && <AdminViewingBanner workspaceName={auth.workspaceName} />}
        {/* One shell-owned container: consistent max width + padding for every
            page. Pages render their content directly — no per-page wrappers. */}
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
