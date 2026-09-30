import { format, parseISO } from "date-fns";
import type { Job } from "@/types/ops";

/** Derive local yyyy-MM-dd + HH:mm from an ISO timestamp. */
export function splitSchedule(iso: string): {
  scheduledDate: string;
  scheduledTime: string;
} {
  const d = parseISO(iso);
  if (Number.isNaN(d.getTime())) {
    const fallback = new Date();
    return {
      scheduledDate: format(fallback, "yyyy-MM-dd"),
      scheduledTime: format(fallback, "HH:mm"),
    };
  }
  return {
    scheduledDate: format(d, "yyyy-MM-dd"),
    scheduledTime: format(d, "HH:mm"),
  };
}

export function combineSchedule(
  scheduledDate: string,
  scheduledTime: string,
): Date {
  const [h, m] = scheduledTime.split(":").map(Number);
  const d = new Date(`${scheduledDate}T00:00:00`);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

/** Ensure every job has local scheduledDate / scheduledTime for calendar mapping. */
export function normalizeJobSchedule<T extends Partial<Job> & { startsAt: string }>(
  job: T,
): T & { scheduledDate: string; scheduledTime: string } {
  const fromIso = splitSchedule(job.startsAt);
  return {
    ...job,
    scheduledDate: job.scheduledDate || fromIso.scheduledDate,
    scheduledTime: job.scheduledTime || fromIso.scheduledTime,
  };
}

export function jobCalendarDayKey(job: {
  scheduledDate?: string;
  startsAt: string;
}): string {
  if (job.scheduledDate && /^\d{4}-\d{2}-\d{2}$/.test(job.scheduledDate)) {
    return job.scheduledDate;
  }
  return splitSchedule(job.startsAt).scheduledDate;
}

export function jobChipLabel(
  job: { scheduledTime?: string; startsAt: string },
  customerName: string,
): string {
  const time = job.scheduledTime || splitSchedule(job.startsAt).scheduledTime;
  const short =
    customerName.length > 12 ? `${customerName.slice(0, 11)}…` : customerName;
  return `${time} - ${short}`;
}
