"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { RequireRole } from "@/components/demo/require-role";
import { MonthlyCalendar } from "@/components/calendar/monthly-calendar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useOpsStore } from "@/lib/store/ops-store";
import { formatDateTimeSk } from "@/lib/utils";
import {
  specialItemsLabels,
  visitStatusClass,
  visitStatusLabel,
} from "@/lib/visits/labels";

function OwnerHomeInner() {
  const siteVisits = useOpsStore((s) => s.siteVisits);
  const pending = useMemo(
    () => siteVisits.filter((v) => v.status === "pending_pricing"),
    [siteVisits],
  );
  const waiting = useMemo(
    () => siteVisits.filter((v) => v.status === "waiting_for_client"),
    [siteVisits],
  );

  return (
    <AppShell role="owner" title="Prehľad">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <p className="text-xs font-semibold uppercase text-muted">Čaká</p>
            <p className="mt-1 text-3xl font-bold text-charcoal">
              {pending.length}
            </p>
          </Card>
          <Card>
            <p className="text-xs font-semibold uppercase text-muted">
              Na schválenie
            </p>
            <p className="mt-1 text-3xl font-bold text-charcoal">
              {waiting.length}
            </p>
          </Card>
        </div>

        <MonthlyCalendar role="owner" />

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-charcoal">Fronta na ocenenie</h2>
          {pending.length === 0 ? (
            <Card>
              <p className="text-sm text-muted">
                Žiadne nové obhliadky. Keď terén odošle formulár, objavia sa
                tu.
              </p>
            </Card>
          ) : (
            pending.map((v) => {
              const specials = specialItemsLabels(v.specialItems);
              return (
                <Link
                  key={v.id}
                  href={`/owner/visits/${v.id}`}
                  prefetch={false}
                  className="mb-2 block"
                >
                  <Card className="flex items-center justify-between gap-3 transition hover:border-teal/30">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-charcoal">
                          {v.customerName}
                        </p>
                        <Badge className={visitStatusClass(v.status)}>
                          {visitStatusLabel(v.status)}
                        </Badge>
                      </div>
                      <p className="truncate text-sm text-muted">
                        {v.addressFrom} → {v.addressTo}
                      </p>
                      {specials.length > 0 ? (
                        <p className="text-xs font-medium text-teal">
                          {specials.join(" · ")}
                        </p>
                      ) : null}
                      <p className="text-xs text-muted">
                        {v.createdByName} · {formatDateTimeSk(v.createdAt)} ·{" "}
                        {v.media.length} médií
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
                  </Card>
                </Link>
              );
            })
          )}
        </section>
      </div>
    </AppShell>
  );
}

export default function OwnerHomePage() {
  return (
    <RequireRole role="owner">
      <OwnerHomeInner />
    </RequireRole>
  );
}
