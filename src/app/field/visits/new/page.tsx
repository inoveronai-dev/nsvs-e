"use client";

import { AppShell } from "@/components/layout/app-shell";
import { RequireRole } from "@/components/demo/require-role";
import { SiteVisitForm } from "@/components/visits/site-visit-form";

export default function NewVisitPage() {
  return (
    <RequireRole role="field">
      <AppShell role="field" title="Nová obhliadka">
        <SiteVisitForm />
      </AppShell>
    </RequireRole>
  );
}
