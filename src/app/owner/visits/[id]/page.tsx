"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { RequireRole } from "@/components/demo/require-role";
import { VisitDetailView } from "@/components/visits/visit-detail-view";

export default function OwnerVisitPage() {
  const params = useParams<{ id: string }>();

  return (
    <RequireRole role="owner">
      <AppShell role="owner" title="Detail obhliadky">
        <VisitDetailView visitId={params.id} />
      </AppShell>
    </RequireRole>
  );
}
