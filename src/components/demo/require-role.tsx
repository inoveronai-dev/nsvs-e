"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useOpsStore } from "@/lib/store/ops-store";
import type { Role } from "@/types/ops";

function Spinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface">
      <div className="h-8 w-8 animate-pulse rounded-full bg-brand-yellow" />
    </div>
  );
}

/**
 * Gate store-backed screens until after mount so soft navigations
 * don't hydrate server HTML (empty role) against client role.
 */
export function RequireRole({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const current = useOpsStore((s) => s.role);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!current) {
      router.replace("/");
      return;
    }
    if (current !== role) {
      router.replace(current === "owner" ? "/owner" : "/field");
    }
  }, [mounted, current, role, router]);

  if (!mounted || current !== role) {
    return <Spinner />;
  }

  return children;
}
