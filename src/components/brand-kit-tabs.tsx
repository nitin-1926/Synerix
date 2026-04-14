"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/brand", label: "Brand" },
  { href: "/products", label: "Products" },
  { href: "/models", label: "AI Models" },
];

export function BrandKitTabs({ showModels = true }: { showModels?: boolean }) {
  const pathname = usePathname();
  const tabs = showModels ? TABS : TABS.filter((t) => t.href !== "/models");
  return (
    <nav className="flex gap-1 border-b border-border">
      {tabs.map(({ href, label }) => {
        const active = pathname?.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
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
  );
}
