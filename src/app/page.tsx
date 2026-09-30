"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RolePicker } from "@/components/demo/role-picker";
import { useOpsStore } from "@/lib/store/ops-store";

export default function HomePage() {
  const router = useRouter();
  const role = useOpsStore((s) => s.role);

  useEffect(() => {
    if (!role) return;
    router.replace(role === "owner" ? "/owner" : "/field");
  }, [role, router]);

  if (role) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-pulse rounded-full bg-brand-yellow" />
      </div>
    );
  }

  return <RolePicker />;
}
