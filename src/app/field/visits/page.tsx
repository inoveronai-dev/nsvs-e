"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { RequireRole } from "@/components/demo/require-role";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useOpsStore } from "@/lib/store/ops-store";
import { formatDateTimeSk } from "@/lib/utils";
import { visitStatusClass, visitStatusLabel } from "@/lib/visits/labels";

function FieldVisitsInner() {
  const currentUserId = useOpsStore((s) => s.currentUserId);
  const siteVisits = useOpsStore((s) => s.siteVisits);
  const visits = useMemo(
    () => siteVisits.filter((v) => v.createdById === currentUserId),
    [siteVisits, currentUserId],
  );

  return (
    <AppShell role="field" title="Moje obhliadky">
      <div className="space-y-3">
        <Link
          href="/field/visits/new"
          className="flex h-12 items-center justify-center rounded-xl bg-teal text-sm font-semibold text-white shadow-sm"
        >
          + Nová obhliadka
        </Link>

        {visits.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">Zatiaľ žiadne obhliadky.</p>
          </Card>
        ) : (
          visits.map((v) => (
            <Card key={v.id} className="space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-charcoal">{v.customerName}</p>
                <Badge className={visitStatusClass(v.status)}>
                  {visitStatusLabel(v.status)}
                </Badge>
              </div>
              <p className="text-sm text-muted">
                {v.addressFrom} → {v.addressTo}
              </p>
              <p className="text-xs text-muted">
                {formatDateTimeSk(v.createdAt)} · {v.media.length} médií
              </p>
            </Card>
          ))
        )}
      </div>
    </AppShell>
  );
}

export default function FieldVisitsPage() {
  return (
    <RequireRole role="field">
      <FieldVisitsInner />
    </RequireRole>
  );
}
