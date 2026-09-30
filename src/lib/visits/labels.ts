import type { JobStatus, VisitStatus } from "@/types/ops";

const VISIT_LABELS: Record<VisitStatus, string> = {
  draft: "Koncept",
  pending_pricing: "Na ocenenie",
  waiting_for_client: "Čaká na schválenie",
  accepted_job: "Schválená zákazka",
  rejected: "Zamietnuté",
};

const VISIT_STYLES: Record<VisitStatus, string> = {
  draft: "bg-black/5 text-muted",
  pending_pricing: "bg-brand-yellow/40 text-charcoal",
  waiting_for_client: "bg-amber-100 text-amber-900",
  accepted_job: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
};

const JOB_LABELS: Record<JobStatus, string> = {
  scheduled: "Naplánované",
  in_progress: "Prebieha",
  completed: "Dokončené",
  cancelled: "Zrušené",
};

const JOB_STYLES: Record<JobStatus, string> = {
  scheduled: "bg-teal/15 text-teal",
  in_progress: "bg-brand-yellow/40 text-charcoal",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-black/5 text-muted",
};

export function visitStatusLabel(status: VisitStatus) {
  return VISIT_LABELS[status] ?? status;
}

export function visitStatusClass(status: VisitStatus) {
  return VISIT_STYLES[status] ?? "bg-black/5 text-muted";
}

export function jobStatusLabel(status: JobStatus) {
  return JOB_LABELS[status] ?? status;
}

export function jobStatusClass(status: JobStatus) {
  return JOB_STYLES[status] ?? "bg-black/5 text-muted";
}

export function specialItemsLabels(items: {
  piano: boolean;
  safe: boolean;
  fragile: boolean;
  assembly: boolean;
}) {
  const labels: string[] = [];
  if (items.piano) labels.push("Klavír");
  if (items.safe) labels.push("Trezor");
  if (items.fragile) labels.push("Krehké");
  if (items.assembly) labels.push("Montáž/demontáž");
  return labels;
}
