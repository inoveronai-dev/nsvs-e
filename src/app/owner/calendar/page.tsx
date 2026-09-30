"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { RequireRole } from "@/components/demo/require-role";
import { MonthlyCalendar } from "@/components/calendar/monthly-calendar";

function CalendarWithFocus() {
  const params = useSearchParams();
  const day = params.get("day");
  return (
    <AppShell role="owner" title="Kalendár">
      <MonthlyCalendar role="owner" focusDay={day} />
    </AppShell>
  );
}

export default function CalendarPage() {
  return (
    <RequireRole role="owner">
      <Suspense
        fallback={
          <div className="flex min-h-dvh items-center justify-center bg-surface">
            <div className="h-8 w-8 animate-pulse rounded-full bg-brand-yellow" />
          </div>
        }
      >
        <CalendarWithFocus />
      </Suspense>
    </RequireRole>
  );
}
