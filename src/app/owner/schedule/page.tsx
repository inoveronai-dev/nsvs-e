"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { RequireRole } from "@/components/demo/require-role";
import { DirectScheduleForm } from "@/components/calendar/direct-schedule-form";

function ScheduleInner() {
  const params = useSearchParams();
  const day = params.get("day");
  return (
    <AppShell role="owner" title="Naplánovať">
      <DirectScheduleForm defaultDay={day} />
    </AppShell>
  );
}

export default function OwnerSchedulePage() {
  return (
    <RequireRole role="owner">
      <Suspense
        fallback={
          <div className="flex min-h-dvh items-center justify-center bg-surface">
            <div className="h-8 w-8 animate-pulse rounded-full bg-brand-yellow" />
          </div>
        }
      >
        <ScheduleInner />
      </Suspense>
    </RequireRole>
  );
}
