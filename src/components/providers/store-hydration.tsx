"use client";

import { useEffect, useState } from "react";
import { useOpsStore } from "@/lib/store/ops-store";

/**
 * Renders children only after the browser mounts and localStorage
 * has been rehydrated. Prevents SSR/client Zustand mismatches.
 */
export function StoreHydration({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function prepare() {
      await useOpsStore.persist.rehydrate();
      if (!cancelled) {
        useOpsStore.getState().setHydrated(true);
        setReady(true);
      }
    }

    void prepare();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-pulse rounded-full bg-brand-yellow" />
      </div>
    );
  }

  return children;
}
