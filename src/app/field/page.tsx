"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Camera, CheckCircle2, Clock } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { RequireRole } from "@/components/demo/require-role";
import { MonthlyCalendar } from "@/components/calendar/monthly-calendar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useOpsStore } from "@/lib/store/ops-store";
import { formatDateTimeSk } from "@/lib/utils";
import { visitStatusClass, visitStatusLabel } from "@/lib/visits/labels";

function FieldHomeInner() {
  const currentUserId = useOpsStore((s) => s.currentUserId);
  const visits = useOpsStore((s) => s.siteVisits);
  const mine = useMemo(
    () => visits.filter((v) => v.createdById === currentUserId),
    [visits, currentUserId],
  );
  const pending = useMemo(
    () => mine.filter((v) => v.status === "pending_pricing").length,
    [mine],
  );
  const recent = mine.slice(0, 3);

  return (
    <AppShell role="field" title="Prehľad">
      <div className="space-y-4">
        <Card className="bg-gradient-to-br from-teal to-teal-hover text-white border-0">
          <p className="text-sm text-white/80">Rýchla akcia</p>
          <h2 className="mt-1 text-xl font-bold">Nová obhliadka na mieste</h2>
          <p className="mt-2 text-sm text-white/75">
            Adresy, poschodia, fotky — odošlite majiteľovi na ocenenie.
          </p>
          <Link
            href="/field/visits/new"
            className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-brand-yellow px-5 text-sm font-semibold text-charcoal shadow-sm transition hover:brightness-95 active:scale-[0.98]"
          >
            Začať obhliadku
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <div className="flex items-center gap-2 text-muted">
              <Camera className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase">Moje</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-charcoal">{mine.length}</p>
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-muted">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase">Čaká</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-charcoal">{pending}</p>
          </Card>
        </div>

        <MonthlyCalendar role="field" />

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-charcoal">
              Posledné obhliadky
            </h3>
            <Link
              href="/field/visits"
              className="text-xs font-semibold text-teal"
            >
              Všetky
            </Link>
          </div>
          {recent.length === 0 ? (
            <Card>
              <p className="text-sm text-muted">Zatiaľ žiadne obhliadky.</p>
            </Card>
          ) : (
            recent.map((v) => (
              <Card key={v.id} className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-charcoal">{v.customerName}</p>
                  <Badge className={visitStatusClass(v.status)}>
                    {visitStatusLabel(v.status)}
                  </Badge>
                </div>
                <p className="line-clamp-1 text-sm text-muted">
                  {v.addressFrom}
                </p>
                <p className="text-xs text-muted">
                  {formatDateTimeSk(v.createdAt)}
                </p>
              </Card>
            ))
          )}
        </section>

        <p className="flex items-center gap-2 text-xs text-muted">
          <CheckCircle2 className="h-3.5 w-3.5 text-teal" />
          Odoslané obhliadky sa okamžite zobrazia majiteľovi
        </p>
      </div>
    </AppShell>
  );
}

export default function FieldHomePage() {
  return (
    <RequireRole role="field">
      <FieldHomeInner />
    </RequireRole>
  );
}
