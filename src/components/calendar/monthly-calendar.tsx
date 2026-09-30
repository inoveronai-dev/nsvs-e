"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addDays,
  addMonths,
  addWeeks,
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
  CalendarDays,
  CalendarRange,
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

type CalendarView = "month" | "week" | "day";

const WEEKDAYS = ["Po", "Ut", "St", "Št", "Pi", "So", "Ne"];
const DAY_START_HOUR = 8;
const DAY_END_HOUR = 18;
const HOUR_PX = 56;
const HOURS = Array.from(
  { length: DAY_END_HOUR - DAY_START_HOUR + 1 },
  (_, i) => DAY_START_HOUR + i,
);

const CHIP_COLORS = [
  "bg-[#0D5C63] text-white",
  "bg-[#F5D400] text-charcoal",
  "bg-teal/20 text-teal",
] as const;

const VIEW_OPTIONS: {
  id: CalendarView;
  label: string;
  icon: typeof CalendarDays;
}[] = [
  { id: "month", label: "Mesiac", icon: CalendarDays },
  { id: "week", label: "Týždeň", icon: CalendarRange },
  { id: "day", label: "Deň", icon: Clock },
];

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

function minutesFromMidnight(isoOrTime: string): number {
  if (/^\d{2}:\d{2}$/.test(isoOrTime)) {
    const [h, m] = isoOrTime.split(":").map(Number);
    return h * 60 + m;
  }
  const d = parseISO(isoOrTime);
  if (Number.isNaN(d.getTime())) return DAY_START_HOUR * 60;
  return d.getHours() * 60 + d.getMinutes();
}

function jobBlockStyle(job: Job): { top: number; height: number } {
  const startMin = minutesFromMidnight(job.startsAt);
  const endMin = Math.max(
    startMin + 30,
    minutesFromMidnight(job.endsAt),
  );
  const gridStart = DAY_START_HOUR * 60;
  const gridEnd = (DAY_END_HOUR + 1) * 60;
  const clampedStart = Math.max(gridStart, Math.min(gridEnd, startMin));
  const clampedEnd = Math.max(clampedStart + 20, Math.min(gridEnd, endMin));
  const top = ((clampedStart - gridStart) / 60) * HOUR_PX;
  const height = ((clampedEnd - clampedStart) / 60) * HOUR_PX;
  return { top, height };
}

export function MonthlyCalendar({
  role,
  focusDay = null,
}: {
  role: Role;
  focusDay?: string | null;
}) {
  const router = useRouter();
  const jobs = useOpsStore((s) => s.jobs);
  const visits = useOpsStore((s) => s.siteVisits);
  const workers = useOpsStore((s) => s.workers);

  const [view, setView] = useState<CalendarView>("month");
  const [cursor, setCursor] = useState(() => {
    return parseFocusDay(focusDay) ?? new Date();
  });
  const [addOpen, setAddOpen] = useState(false);
  const [addDate, setAddDate] = useState<Date>(() => new Date());

  useEffect(() => {
    const d = parseFocusDay(focusDay);
    if (!d) return;
    setCursor(d);
  }, [focusDay]);

  const calendarJobs = useMemo(() => {
    const acceptedVisitIds = new Set(
      visits.filter((v) => v.status === "accepted_job").map((v) => v.id),
    );
    return jobs
      .filter((j) => {
        if (j.status === "cancelled" || j.status === "completed") return false;
        if (j.status === "scheduled" || j.status === "in_progress") return true;
        return acceptedVisitIds.has(j.siteVisitId);
      })
      .map((j) => normalizeJobSchedule(j));
  }, [jobs, visits]);

  const jobsByDay = useMemo(() => {
    const map = new Map<string, Job[]>();
    for (const job of calendarJobs) {
      const key = jobCalendarDayKey(job);
      const list = map.get(key) ?? [];
      list.push(job);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => jobTimeLabel(a).localeCompare(jobTimeLabel(b)));
    }
    return map;
  }, [calendarJobs]);

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursor, { weekStartsOn: 1 });
    const end = endOfWeek(cursor, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const selectedKey = format(cursor, "yyyy-MM-dd");
  const dayJobs = jobsByDay.get(selectedKey) ?? [];
  const gridHeight = (DAY_END_HOUR - DAY_START_HOUR + 1) * HOUR_PX;

  const headerTitle = useMemo(() => {
    if (view === "month") {
      return format(cursor, "LLLL yyyy", { locale: sk });
    }
    if (view === "week") {
      const start = startOfWeek(cursor, { weekStartsOn: 1 });
      const end = endOfWeek(cursor, { weekStartsOn: 1 });
      return `${format(start, "d. M.", { locale: sk })} – ${format(end, "d. M. yyyy", { locale: sk })}`;
    }
    return format(cursor, "EEEE d. MMMM yyyy", { locale: sk });
  }, [cursor, view]);

  function navigate(delta: -1 | 1) {
    setCursor((d) => {
      if (view === "month") return addMonths(d, delta);
      if (view === "week") return addWeeks(d, delta);
      return addDays(d, delta);
    });
  }

  function selectDay(day: Date, options?: { switchToDay?: boolean }) {
    setCursor(day);
    if (options?.switchToDay) setView("day");
    if (role === "owner") {
      router.replace(`/owner/calendar?day=${format(day, "yyyy-MM-dd")}`, {
        scroll: false,
      });
    }
  }

  function openQuickAdd(day: Date) {
    setCursor(day);
    setAddDate(day);
    setAddOpen(true);
  }

  function chipText(job: Job) {
    const name =
      visits.find((v) => v.id === job.siteVisitId)?.customerName ?? "Zákazka";
    return jobChipLabel(job, name);
  }

  function visitName(job: Job) {
    return (
      visits.find((v) => v.id === job.siteVisitId)?.customerName ?? "Zákazka"
    );
  }

  function scheduleHref(day?: Date) {
    const d = day ?? cursor;
    return `/owner/schedule?day=${format(d, "yyyy-MM-dd")}`;
  }

  return (
    <div className="w-full min-w-0 space-y-3">
      {role === "owner" ? (
        <Link
          href={scheduleHref()}
          prefetch={false}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F5D400] px-4 py-3.5 text-sm font-bold text-charcoal shadow-sm transition hover:brightness-95"
        >
          <Plus className="h-5 w-5" />
          Naplánovať zákazku
        </Link>
      ) : null}

      <Card className="w-full min-w-0 space-y-3 p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal">
              Kalendár zákaziek
            </p>
            <h2 className="truncate text-lg font-bold capitalize text-charcoal">
              {headerTitle}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {role === "owner" ? (
              <Button
                type="button"
                size="icon"
                variant="accent"
                aria-label="Naplánovať zákazku"
                onClick={() => router.push(scheduleHref())}
              >
                <Plus className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                type="button"
                size="icon"
                variant="accent"
                aria-label="Pridať zákazku"
                onClick={() => openQuickAdd(cursor)}
              >
                <Plus className="h-5 w-5" />
              </Button>
            )}
            <Button
              type="button"
              size="icon"
              variant="secondary"
              aria-label="Predchádzajúce"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setCursor(new Date())}
            >
              Dnes
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              aria-label="Nasledujúce"
              onClick={() => navigate(1)}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Zobrazenie kalendára"
          className="grid grid-cols-3 gap-1 rounded-2xl bg-surface p-1"
        >
          {VIEW_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = view === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setView(opt.id)}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-bold transition sm:text-sm",
                  active
                    ? "bg-[#0D5C63] text-white shadow-sm"
                    : "text-muted hover:bg-white hover:text-charcoal",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {opt.label}
              </button>
            );
          })}
        </div>

        {view === "month" ? (
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
              {monthDays.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const dayList = jobsByDay.get(key) ?? [];
                const inMonth = isSameMonth(day, cursor);
                const selectedDay = isSameDay(day, cursor);
                const today = isToday(day);

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => selectDay(day)}
                    onDoubleClick={() => selectDay(day, { switchToDay: true })}
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
        ) : null}

        {view === "week" ? (
          <div className="w-full min-w-0 overflow-x-auto">
            <div className="min-w-[560px]">
              <div className="mb-1 grid grid-cols-[44px_repeat(7,minmax(0,1fr))] gap-1">
                <div />
                {weekDays.map((day) => {
                  const selectedDay = isSameDay(day, cursor);
                  const today = isToday(day);
                  return (
                    <button
                      key={format(day, "yyyy-MM-dd")}
                      type="button"
                      onClick={() => selectDay(day)}
                      className={cn(
                        "rounded-xl px-1 py-1.5 text-center transition",
                        selectedDay && "bg-teal/15 ring-1 ring-teal",
                        today && !selectedDay && "bg-[#F5D400]/40",
                      )}
                    >
                      <p className="text-[10px] font-bold uppercase text-muted">
                        {format(day, "EEE", { locale: sk })}
                      </p>
                      <p
                        className={cn(
                          "text-sm font-bold",
                          today ? "text-charcoal" : "text-charcoal",
                        )}
                      >
                        {format(day, "d")}
                      </p>
                    </button>
                  );
                })}
              </div>
              <div className="relative grid grid-cols-[44px_repeat(7,minmax(0,1fr))] gap-1">
                <div className="relative" style={{ height: gridHeight }}>
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="absolute right-1 text-[10px] font-semibold text-muted"
                      style={{ top: (hour - DAY_START_HOUR) * HOUR_PX - 6 }}
                    >
                      {String(hour).padStart(2, "0")}:00
                    </div>
                  ))}
                </div>
                {weekDays.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const dayList = jobsByDay.get(key) ?? [];
                  return (
                    <div
                      key={key}
                      className="relative rounded-xl border border-black/5 bg-surface"
                      style={{ height: gridHeight }}
                      onClick={() => selectDay(day)}
                    >
                      {HOURS.map((hour) => (
                        <div
                          key={hour}
                          className="absolute inset-x-0 border-t border-black/5"
                          style={{ top: (hour - DAY_START_HOUR) * HOUR_PX }}
                        />
                      ))}
                      {dayList.map((job, i) => {
                        const { top, height } = jobBlockStyle(job);
                        const content = (
                          <div
                            className={cn(
                              "absolute inset-x-0.5 overflow-hidden rounded-md px-1 py-0.5 text-[9px] font-bold leading-tight shadow-sm",
                              CHIP_COLORS[i % CHIP_COLORS.length],
                            )}
                            style={{ top, height: Math.max(height, 22) }}
                            title={chipText(job)}
                          >
                            <p className="truncate">{jobTimeLabel(job)}</p>
                            <p className="truncate opacity-90">
                              {visitName(job)}
                            </p>
                          </div>
                        );
                        return role === "owner" ? (
                          <Link
                            key={job.id}
                            href={`/owner/jobs/${job.id}`}
                            prefetch={false}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {content}
                          </Link>
                        ) : (
                          <div key={job.id}>{content}</div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {view === "day" ? (
          <div className="w-full min-w-0">
            <div className="relative grid grid-cols-[52px_minmax(0,1fr)] gap-2">
              <div className="relative" style={{ height: gridHeight }}>
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="absolute right-1 text-[11px] font-semibold text-muted"
                    style={{ top: (hour - DAY_START_HOUR) * HOUR_PX - 7 }}
                  >
                    {String(hour).padStart(2, "0")}:00
                  </div>
                ))}
              </div>
              <div
                className="relative rounded-2xl border border-black/5 bg-surface"
                style={{ height: gridHeight }}
              >
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="absolute inset-x-0 border-t border-black/5"
                    style={{ top: (hour - DAY_START_HOUR) * HOUR_PX }}
                  />
                ))}
                {dayJobs.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-muted">
                    Žiadne zákazky v tomto dni
                  </div>
                ) : null}
                {dayJobs.map((job, i) => {
                  const { top, height } = jobBlockStyle(job);
                  const visit = visits.find((v) => v.id === job.siteVisitId);
                  const block = (
                    <div
                      className={cn(
                        "absolute inset-x-2 overflow-hidden rounded-xl p-2 shadow-md",
                        i % 2 === 0
                          ? "bg-[#0D5C63] text-white"
                          : "bg-[#F5D400] text-charcoal",
                      )}
                      style={{ top, height: Math.max(height, 44) }}
                    >
                      <p className="text-xs font-bold">
                        {jobTimeLabel(job)} · {visit?.customerName ?? "Zákazka"}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] opacity-90">
                        {visit?.addressFrom} → {visit?.addressTo}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold opacity-90">
                        {formatEur(job.finalAmountEur)}
                      </p>
                    </div>
                  );
                  return role === "owner" ? (
                    <Link
                      key={job.id}
                      href={`/owner/jobs/${job.id}`}
                      prefetch={false}
                    >
                      {block}
                    </Link>
                  ) : (
                    <div key={job.id}>{block}</div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-black/5 pt-3 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#0D5C63]" /> Schválené
            zákazky
          </span>
          {role === "owner" ? (
            <Link
              href={scheduleHref()}
              prefetch={false}
              className="ml-auto font-semibold text-teal underline-offset-2 hover:underline"
            >
              + Naplánovať na {format(cursor, "d. M.")}
            </Link>
          ) : (
            <button
              type="button"
              className="ml-auto font-semibold text-teal underline-offset-2 hover:underline"
              onClick={() => openQuickAdd(cursor)}
            >
              + Pridať na {format(cursor, "d. M.")}
            </button>
          )}
        </div>
      </Card>

      {view === "month" ? (
        <Card className="w-full min-w-0 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-charcoal">
              {format(cursor, "EEEE d. MMMM", { locale: sk })}
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
              {role === "owner" ? (
                <Button
                  type="button"
                  variant="accent"
                  className="mt-3"
                  onClick={() => router.push(scheduleHref())}
                >
                  <Plus className="h-4 w-4" />
                  Naplánovať zákazku
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  className="mt-3"
                  onClick={() => openQuickAdd(cursor)}
                >
                  <Plus className="h-4 w-4" />
                  Naplánovať zákazku
                </Button>
              )}
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
      ) : null}

      <AddJobDialog date={addDate} open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
