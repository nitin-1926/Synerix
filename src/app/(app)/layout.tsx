import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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
