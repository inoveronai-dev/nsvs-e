"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { sk } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AddJobDialog } from "@/components/calendar/add-job-dialog";
import {
  jobCalendarDayKey,
  jobChipLabel,
  normalizeJobSchedule,
  splitSchedule,
} from "@/lib/calendar/schedule";
import { useOpsStore } from "@/lib/store/ops-store";
import { cn, formatEur } from "@/lib/utils";
import type { Job, Role } from "@/types/ops";

const WEEKDAYS = ["Po", "Ut", "St", "Št", "Pi", "So", "Ne"];

const CHIP_COLORS = [
  "bg-[#0D5C63] text-white",
  "bg-[#F5D400] text-charcoal",
  "bg-teal/20 text-teal",
] as const;

function jobTimeLabel(job: Job) {
  return job.scheduledTime || splitSchedule(job.startsAt).scheduledTime;
}

function parseFocusDay(day: string | null | undefined): Date | null {
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  try {
    const d = parseISO(`${day}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export function MonthlyCalendar({
  role,
  focusDay = null,
}: {
  role: Role;
  /** yyyy-MM-dd — jump to this day after accept → calendar sync */
  focusDay?: string | null;
}) {
  const router = useRouter();
  const jobs = useOpsStore((s) => s.jobs);
  const visits = useOpsStore((s) => s.siteVisits);
  const workers = useOpsStore((s) => s.workers);

  const [month, setMonth] = useState(() => {
    const focused = parseFocusDay(focusDay);
    return focused ? startOfMonth(focused) : startOfMonth(new Date());
  });
  const [selected, setSelected] = useState<Date>(() => {
    return parseFocusDay(focusDay) ?? new Date();
  });
  const [addOpen, setAddOpen] = useState(false);
  const [addDate, setAddDate] = useState<Date>(() => new Date());

  useEffect(() => {
    const d = parseFocusDay(focusDay);
    if (!d) return;
    setSelected(d);
    setMonth(startOfMonth(d));
  }, [focusDay]);

  /**
   * Calendar source of truth:
   * - active job records (scheduled / in_progress)
   * - plus any job linked to an accepted_job visit (ensures accept → calendar sync)
   */
  const calendarJobs = useMemo(() => {
    const acceptedVisitIds = new Set(
      visits
        .filter((v) => v.status === "accepted_job")
        .map((v) => v.id),
    );
    return jobs
      .filter((j) => {
        if (j.status === "cancelled" || j.status === "completed") return false;
        if (j.status === "scheduled" || j.status === "in_progress") return true;
        return acceptedVisitIds.has(j.siteVisitId);
      })
      .map((j) => normalizeJobSchedule(j));
  }, [jobs, visits]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const jobsByDay = useMemo(() => {
    const map = new Map<string, Job[]>();
    for (const job of calendarJobs) {
      const key = jobCalendarDayKey(job);
      const list = map.get(key) ?? [];
      list.push(job);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) =>
        jobTimeLabel(a).localeCompare(jobTimeLabel(b)),
      );
    }
    return map;
  }, [calendarJobs]);

  const selectedKey = format(selected, "yyyy-MM-dd");
  const dayJobs = jobsByDay.get(selectedKey) ?? [];

  function openAdd(day: Date) {
    setSelected(day);
    setAddDate(day);
    setAddOpen(true);
  }

  function chipText(job: Job) {
    const name =
      visits.find((v) => v.id === job.siteVisitId)?.customerName ?? "Zákazka";
    return jobChipLabel(job, name);
  }

  return (
    <div className="w-full min-w-0 space-y-3">
      <Card className="w-full min-w-0 space-y-3 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal">
              Kalendár zákaziek
            </p>
            <h2 className="truncate text-lg font-bold capitalize text-charcoal">
              {format(month, "LLLL yyyy", { locale: sk })}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="accent"
              aria-label="Pridať zákazku"
              onClick={() => openAdd(selected)}
            >
              <Plus className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              aria-label="Predchádzajúci mesiac"
              onClick={() => setMonth((m) => addMonths(m, -1))}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              aria-label="Nasledujúci mesiac"
              onClick={() => setMonth((m) => addMonths(m, 1))}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="w-full min-w-0">
          <div className="grid w-full grid-cols-7 gap-1">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="py-1 text-center text-[10px] font-bold uppercase tracking-wide text-muted"
              >
                {d}
              </div>
            ))}

            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayList = jobsByDay.get(key) ?? [];
              const inMonth = isSameMonth(day, month);
              const selectedDay = isSameDay(day, selected);
              const today = isToday(day);

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSelected(day);
                    if (role === "owner") {
                      router.replace(`/owner/calendar?day=${key}`, {
                        scroll: false,
                      });
                    }
                  }}
                  className={cn(
                    "relative flex min-h-[68px] w-full min-w-0 flex-col items-stretch rounded-xl p-1 transition sm:min-h-[84px]",
                    inMonth ? "bg-surface" : "bg-transparent opacity-35",
                    selectedDay && "ring-2 ring-teal ring-offset-1",
                    !selectedDay && "hover:bg-teal/10",
                    today && !selectedDay && "border border-brand-yellow",
                  )}
                >
                  <span
                    className={cn(
                      "mx-auto flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                      today ? "bg-[#F5D400] text-charcoal" : "text-charcoal",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {dayList.length > 0 ? (
                    <div className="mt-0.5 flex w-full min-w-0 flex-col gap-0.5">
                      {dayList.slice(0, 2).map((job, i) => (
                        <span
                          key={job.id}
                          title={chipText(job)}
                          className={cn(
                            "truncate rounded px-0.5 py-px text-left text-[8px] font-bold leading-tight sm:text-[9px]",
                            i % 2 === 0
                              ? "bg-[#0D5C63] text-white"
                              : "bg-[#F5D400] text-charcoal",
                          )}
                        >
                          {chipText(job)}
                        </span>
                      ))}
                      {dayList.length > 2 ? (
                        <span className="text-center text-[8px] font-semibold text-teal">
                          +{dayList.length - 2}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-black/5 pt-3 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#0D5C63]" /> Schválené
            zákazky
          </span>
          <button
            type="button"
            className="ml-auto font-semibold text-teal underline-offset-2 hover:underline"
            onClick={() => openAdd(selected)}
          >
            + Pridať na {format(selected, "d. M.")}
          </button>
        </div>
      </Card>

      <Card className="w-full min-w-0 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-charcoal">
            {format(selected, "EEEE d. MMMM", { locale: sk })}
          </h3>
          <Badge className="bg-teal/15 text-teal">
            {dayJobs.length}{" "}
            {dayJobs.length === 1
              ? "zákazka"
              : dayJobs.length > 1 && dayJobs.length < 5
                ? "zákazky"
                : "zákaziek"}
          </Badge>
        </div>

        {dayJobs.length === 0 ? (
          <div className="rounded-xl bg-surface px-4 py-6 text-center">
            <p className="text-sm text-muted">Žiadne naplánované zákazky.</p>
            <Button
              type="button"
              variant="primary"
              className="mt-3"
              onClick={() => openAdd(selected)}
            >
              <Plus className="h-4 w-4" />
              Naplánovať zákazku
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {dayJobs.map((job, index) => {
              const visit = visits.find((v) => v.id === job.siteVisitId);
              const crew = workers
                .filter((w) => job.assignedWorkerIds.includes(w.id))
                .map((w) => w.name)
                .join(", ");

              const content = (
                <>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-[11px] font-bold",
                          CHIP_COLORS[index % CHIP_COLORS.length],
                        )}
                      >
                        {jobTimeLabel(job)}
                      </span>
                      <p className="truncate font-semibold text-charcoal">
                        {visit?.customerName ?? "Zákazka"}
                      </p>
                    </div>
                    <p className="flex items-start gap-1.5 text-sm text-muted">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" />
                      <span className="line-clamp-2">
                        {visit?.addressFrom} → {visit?.addressTo}
                      </span>
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-muted">
                      <Users className="h-3.5 w-3.5 text-teal" />
                      {crew || "Bez posádky"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-teal">
                      {formatEur(job.finalAmountEur)}
                    </p>
                    {role === "owner" ? (
                      <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted">
                        <Clock className="h-3 w-3" />
                        detail
                      </p>
                    ) : null}
                  </div>
                </>
              );

              return (
                <li key={job.id}>
                  {role === "owner" ? (
                    <Link
                      href={`/owner/jobs/${job.id}`}
                      prefetch={false}
                      className="flex gap-2 rounded-2xl border border-black/5 bg-white p-3 shadow-sm transition hover:border-teal/30"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div className="flex gap-2 rounded-2xl border border-black/5 bg-white p-3 shadow-sm">
                      {content}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <AddJobDialog
        date={addDate}
        open={addOpen}
        onOpenChange={setAddOpen}
      />
    </div>
  );
}
