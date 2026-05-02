"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin", label: "Workspaces" },
  { href: "/admin/costs", label: "Costs" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/tests", label: "Tests" },
];

export function AdminTabs() {
  const pathname = usePathname();
  return (
    <div className="overflow-x-auto">
      <nav className="flex w-max min-w-full gap-1 border-b border-border">
        {TABS.map(({ href, label }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
