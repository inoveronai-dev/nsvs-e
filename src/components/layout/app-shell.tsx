"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Briefcase,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Wallet,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { useOpsStore } from "@/lib/store/ops-store";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/ops";

const fieldLinks = [
  { href: "/field", label: "Prehľad", icon: LayoutDashboard },
  { href: "/field/visits/new", label: "Nová", icon: PlusCircle },
  { href: "/field/visits", label: "Moje", icon: ClipboardList },
];

const ownerLinks = [
  { href: "/owner", label: "Prehľad", icon: LayoutDashboard },
  { href: "/owner/jobs", label: "Zákazky", icon: Briefcase },
  { href: "/owner/calendar", label: "Kalendár", icon: CalendarDays },
  { href: "/owner/finances", label: "Financie", icon: Wallet },
];

export function AppShell({
  role,
  title,
  children,
}: {
  role: Role;
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const clearRole = useOpsStore((s) => s.clearRole);
  const resetDemo = useOpsStore((s) => s.resetDemo);
  const workers = useOpsStore((s) => s.workers);
  const currentUserId = useOpsStore((s) => s.currentUserId);
  const user = workers.find((w) => w.id === currentUserId);
  const links = role === "field" ? fieldLinks : ownerLinks;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-surface md:max-w-3xl">
      <header className="sticky top-0 z-20 border-b border-black/5 bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <BrandLogo className="h-8" />
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted sm:inline">
              {user?.name}
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Odhlásiť"
              onClick={() => {
                clearRole();
                router.push("/");
              }}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="flex items-end justify-between px-4 pb-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal">
              {role === "field" ? "Terén" : "Majiteľ"}
            </p>
            <h1 className="text-xl font-bold tracking-tight text-charcoal">
              {title}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => resetDemo()}
            className="shrink-0 text-[11px] font-medium text-muted underline-offset-2 hover:underline"
          >
            Obnoviť demo
          </button>
        </div>
      </header>

      <main className="w-full min-w-0 flex-1 px-4 py-4 pb-28">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-black/5 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg justify-around px-2 py-2 md:max-w-3xl">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/owner"
                ? pathname === "/owner"
                : href === "/field" || href === "/owner"
                  ? pathname === href
                  : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex min-w-[64px] flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition-colors",
                  isActive
                    ? "bg-teal/10 text-teal"
                    : "text-muted hover:text-charcoal",
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
