"use client";

import { useRouter } from "next/navigation";
import { ClipboardCheck, HardHat } from "lucide-react";
import { BrandLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { useOpsStore } from "@/lib/store/ops-store";
import type { Role } from "@/types/ops";

export function RolePicker() {
  const router = useRouter();
  const setRole = useOpsStore((s) => s.setRole);
  const resetDemo = useOpsStore((s) => s.resetDemo);

  function enter(role: Role) {
    setRole(role);
    router.push(role === "owner" ? "/owner" : "/field");
  }

  return (
    <div className="relative min-h-dvh bg-surface">
      {/* Soft brand atmosphere — not a marketing hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% 0%, rgba(245,212,0,0.18), transparent 55%), radial-gradient(ellipse 70% 40% at 50% 100%, rgba(13,92,99,0.08), transparent 50%)",
        }}
      />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-sm flex-col items-center justify-center px-6 py-12">
        <div className="flex w-full flex-col items-center text-center">
          <BrandLogo priority className="h-14 w-auto" />
          <h1 className="mt-5 text-base font-semibold tracking-tight text-charcoal">
            Interný systém zamestnancov
          </h1>
          <p className="mt-1.5 text-sm text-muted">Vyberte svoju rolu</p>
        </div>

        <div className="mt-10 flex w-full flex-col gap-3">
          <Button
            size="lg"
            variant="accent"
            className="h-14 w-full justify-center gap-3 text-base"
            onClick={() => enter("field")}
          >
            <HardHat className="h-5 w-5 shrink-0" />
            Vstúpiť ako terén
          </Button>
          <Button
            size="lg"
            className="h-14 w-full justify-center gap-3 bg-[#0D5C63] text-base hover:bg-[#0A4A50]"
            onClick={() => enter("owner")}
          >
            <ClipboardCheck className="h-5 w-5 shrink-0" />
            Vstúpiť ako majiteľ
          </Button>
        </div>

        <button
          type="button"
          onClick={() => resetDemo()}
          className="mt-8 text-center text-xs text-muted underline-offset-2 hover:text-charcoal hover:underline"
        >
          Obnoviť demo dáta
        </button>
      </div>
    </div>
  );
}
