import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth";
import { signOutAction } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { AdminTabs } from "./admin/admin-tabs";
import { LogOut, ShieldCheck } from "lucide-react";

export const metadata = { title: "Admin — Synerix" };

export default async function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireSuperAdmin();

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="size-4.5" />
            </span>
            <span>
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-primary">Synerix</span>
              <span className="block text-sm font-semibold leading-none tracking-tight">Admin</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">{auth.email}</span>
            <ThemeToggle />
            <form action={signOutAction}>
              <Button variant="ghost" size="icon-sm" type="submit" title="Sign out" aria-label="Sign out">
                <LogOut />
              </Button>
            </form>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AdminTabs />
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
