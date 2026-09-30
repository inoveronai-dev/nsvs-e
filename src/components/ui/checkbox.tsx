"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Checkbox({
  checked,
  onCheckedChange,
  id,
  label,
  className,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id: string;
  label: string;
  className?: string;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-black/10 bg-white px-3 py-2.5 transition hover:border-teal/30",
        checked && "border-teal/40 bg-teal/5",
        className,
      )}
    >
      <button
        id={id}
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition",
          checked
            ? "border-teal bg-teal text-white"
            : "border-black/20 bg-white",
        )}
      >
        {checked ? <Check className="h-4 w-4" strokeWidth={3} /> : null}
      </button>
      <span className="text-sm font-medium text-charcoal">{label}</span>
    </label>
  );
}
