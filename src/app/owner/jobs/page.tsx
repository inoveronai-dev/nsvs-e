"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { RequireRole } from "@/components/demo/require-role";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useOpsStore } from "@/lib/store/ops-store";
import { formatDateTimeSk, formatEur } from "@/lib/utils";
import { visitStatusClass, visitStatusLabel } from "@/lib/visits/labels";
import type { VisitStatus } from "@/types/ops";

type SortDir = "desc" | "asc";

const ORDER_STATUSES: VisitStatus[] = [
  "pending_pricing",
  "waiting_for_client",
  "accepted_job",
];

function JobsOverviewInner() {
  const siteVisits = useOpsStore((s) => s.siteVisits);
  const quotes = useOpsStore((s) => s.quotes);
  const jobs = useOpsStore((s) => s.jobs);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filter, setFilter] = useState<"all" | VisitStatus>("all");

  const rows = useMemo(() => {
    let list = siteVisits.filter((v) => ORDER_STATUSES.includes(v.status));
    if (filter !== "all") {
      list = list.filter((v) => v.status === filter);
    }
    list = [...list].sort((a, b) => {
      const ta = new Date(a.updatedAt).getTime();
      const tb = new Date(b.updatedAt).getTime();
      return sortDir === "desc" ? tb - ta : ta - tb;
    });
    return list;
  }, [siteVisits, sortDir, filter]);

  return (
    <AppShell role="owner" title="Zákazky">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "Všetky"],
              ["pending_pricing", "Na ocenenie"],
              ["waiting_for_client", "Čaká"],
              ["accepted_job", "Schválené"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                filter === value
                  ? "bg-[#0D5C63] text-white"
                  : "bg-white text-muted ring-1 ring-black/10"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">{rows.length} zákaziek</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              setSortDir((d) => (d === "desc" ? "asc" : "desc"))
            }
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            {sortDir === "desc" ? "Najnovšie" : "Najstaršie"}
          </Button>
        </div>

        {rows.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">Žiadne zákazky v tomto filtri.</p>
          </Card>
        ) : (
          rows.map((v) => {
            const quote = quotes.find((q) => q.siteVisitId === v.id);
            const job = jobs.find(
              (j) =>
                j.siteVisitId === v.id &&
                (j.status === "scheduled" || j.status === "in_progress"),
            );
            const href =
              v.status === "accepted_job" && job
                ? `/owner/jobs/${job.id}`
                : `/owner/visits/${v.id}`;

            return (
              <Link key={v.id} href={href} prefetch={false} className="block">
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
                    <p className="text-xs text-muted">
                      {formatDateTimeSk(v.updatedAt)}
                      {quote ? ` · ${formatEur(quote.priceEur)}` : ""}
                      {job
                        ? ` · termín ${formatDateTimeSk(job.startsAt)}`
                        : ""}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </AppShell>
  );
}

export default function OwnerJobsPage() {
  return (
    <RequireRole role="owner">
      <JobsOverviewInner />
    </RequireRole>
  );
}
