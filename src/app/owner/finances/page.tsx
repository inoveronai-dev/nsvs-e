"use client";

import { useMemo } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { RequireRole } from "@/components/demo/require-role";
import { Card } from "@/components/ui/card";
import { useOpsStore } from "@/lib/store/ops-store";
import { formatDateSk, formatEur } from "@/lib/utils";

function FinancesInner() {
  const jobs = useOpsStore((s) => s.jobs);
  const completed = useMemo(
    () => jobs.filter((j) => j.status === "completed"),
    [jobs],
  );
  const total = useMemo(
    () => completed.reduce((sum, j) => sum + j.finalAmountEur, 0),
    [completed],
  );

  return (
    <AppShell role="owner" title="Financie">
      <div className="space-y-3">
        <Card className="bg-charcoal text-white border-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-yellow">
            Dokončené zákazky
          </p>
          <p className="mt-2 text-3xl font-bold">{formatEur(total)}</p>
          <p className="mt-1 text-sm text-white/60">
            {completed.length} zákaziek v demo dátach
          </p>
        </Card>

        <Card className="border-2 border-dashed border-brand-yellow/50 bg-brand-yellow/10">
          <p className="text-xs font-semibold uppercase tracking-wider text-charcoal">
            Epic 4 — pripravuje sa
          </p>
          <p className="mt-1 text-sm text-muted">
            Mesačný graf tržieb pribudne neskôr. Tabuľka nižšie už číta z
            localStorage.
          </p>
        </Card>

        {completed.map((job) => (
          <Card key={job.id} className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-charcoal">
                {formatDateSk(job.completedAt ?? job.endsAt)}
              </p>
              <p className="text-xs text-muted">{job.id}</p>
            </div>
            <p className="font-bold text-teal">
              {formatEur(job.finalAmountEur)}
            </p>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

export default function FinancesPage() {
  return (
    <RequireRole role="owner">
      <FinancesInner />
    </RequireRole>
  );
}
