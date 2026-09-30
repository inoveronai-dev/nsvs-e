"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { RequireRole } from "@/components/demo/require-role";
import { Card } from "@/components/ui/card";
import { useOpsStore } from "@/lib/store/ops-store";
import { formatDateTimeSk, formatEur } from "@/lib/utils";

function JobDetailInner() {
  const params = useParams<{ id: string }>();
  const jobs = useOpsStore((s) => s.jobs);
  const visits = useOpsStore((s) => s.siteVisits);
  const workers = useOpsStore((s) => s.workers);

  const job = useMemo(
    () => jobs.find((j) => j.id === params.id),
    [jobs, params.id],
  );
  const visit = useMemo(
    () => visits.find((v) => v.id === job?.siteVisitId),
    [visits, job?.siteVisitId],
  );
  const crew = useMemo(
    () => workers.filter((w) => job?.assignedWorkerIds.includes(w.id)),
    [workers, job?.assignedWorkerIds],
  );

  return (
    <AppShell role="owner" title="Detail zákazky">
      {!job || !visit ? (
        <Card>
          <p className="text-sm text-muted">Zákazka sa nenašla.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          <Card className="space-y-2">
            <h2 className="text-lg font-bold text-charcoal">
              {visit.customerName}
            </h2>
            <p className="text-sm font-medium text-teal">
              {formatDateTimeSk(job.startsAt)} – {formatDateTimeSk(job.endsAt)}
            </p>
            <p className="text-sm text-muted">{formatEur(job.finalAmountEur)}</p>
          </Card>
          <Card className="space-y-2 text-sm">
            <p>
              <span className="text-xs font-semibold uppercase text-muted">
                Odkiaľ
              </span>
              <br />
              {visit.addressFrom}
            </p>
            <p>
              <span className="text-xs font-semibold uppercase text-muted">
                Kam
              </span>
              <br />
              {visit.addressTo}
            </p>
            <p>
              <span className="text-xs font-semibold uppercase text-muted">
                Posádka
              </span>
              <br />
              {crew.map((w) => w.name).join(", ") || "—"}
            </p>
            <p>
              <span className="text-xs font-semibold uppercase text-muted">
                Pokyny
              </span>
              <br />
              {job.crewInstructions || "—"}
            </p>
            <p>
              <span className="text-xs font-semibold uppercase text-muted">
                Poznámky z obhliadky
              </span>
              <br />
              {visit.specialRequests || "—"}
            </p>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

export default function JobDetailPage() {
  return (
    <RequireRole role="owner">
      <JobDetailInner />
    </RequireRole>
  );
}
