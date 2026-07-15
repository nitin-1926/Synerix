"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Check,
  ChevronsUpDown,
  Images,
  LayoutDashboard,
  LogOut,
  Palette,
  Settings,
  Sparkles,
} from "lucide-react";
import { setActiveWorkspace, signOutAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, match: ["/dashboard"] },
  { href: "/studio", label: "Create", icon: Sparkles, match: ["/studio"] },
  { href: "/library", label: "Creatives", icon: Images, match: ["/library"] },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, match: ["/calendar"] },
  { href: "/brand", label: "Brand Kit", icon: Palette, match: ["/brand", "/products", "/models"] },
  { href: "/settings", label: "Settings", icon: Settings, match: ["/settings"] },
];

export function AppNav(props: {
  workspaceName: string;
  brandName: string | null;
  creditBalance: number;
  email: string;
  isSuperAdmin?: boolean;
  workspaces?: Array<{ id: string; name: string; active: boolean }>;
}) {
  const pathname = usePathname();
  const canSwitchWorkspace = (props.workspaces?.length ?? 0) >= 2;

  async function signOut() {
    await signOutAction();
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center justify-between px-6 pt-6 pb-5">
          {canSwitchWorkspace ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="min-w-0 rounded-lg text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                  Synerix
                </p>
                <span className="mt-0.5 flex items-center gap-1">
                  <span className="truncate text-xl font-semibold tracking-tight">
                    {props.brandName ?? "Studio"}
                  </span>
                  <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Switch workspace</DropdownMenuLabel>
                  {props.workspaces!.map((w) => (
                    <DropdownMenuItem key={w.id} onClick={() => void setActiveWorkspace(w.id)}>
                      <span className="truncate">{w.name}</span>
                      {w.active && <Check className="ml-auto" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                Synerix
              </p>
              <p className="mt-0.5 truncate text-xl font-semibold tracking-tight">
                {props.brandName ?? "Studio"}
              </p>
            </div>
          )}
          <ThemeToggle />
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV.map(({ href, label, icon: Icon, match }) => {
            const active = match.some((m) => pathname?.startsWith(m));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="size-[18px]" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-sidebar-border p-4">
          <Link
            href="/settings/credits"
            className="flex items-center justify-between rounded-xl bg-primary/10 px-3.5 py-2.5 transition-colors hover:bg-primary/15"
          >
            <span className="text-xs font-medium text-primary/80">Credits</span>
            <span className="text-base font-semibold text-primary">{props.creditBalance}</span>
          </Link>
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="min-w-0 truncate text-xs text-muted-foreground">{props.email}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={signOut}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/85 px-4 py-3 backdrop-blur-md md:hidden">
        <div className="min-w-0">
          <span className="text-[9px] font-semibold uppercase tracking-widest text-primary">
            Synerix
          </span>
          <p className="-mt-0.5 truncate text-lg font-semibold leading-tight tracking-tight">
            {props.brandName ?? "Studio"}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {props.creditBalance} credits
          </span>
          <ThemeToggle />
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        {NAV.slice(0, 5).map(({ href, label, icon: Icon, match }) => {
          const active = match.some((m) => pathname?.startsWith(m));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-lg transition-colors",
                  active && "bg-primary/12",
                )}
              >
                <Icon className="size-[18px]" />
              </span>
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
