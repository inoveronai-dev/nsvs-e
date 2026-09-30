"use client";

import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onCheckedChange,
  id,
  label,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id: string;
  label: string;
}) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-black/10 bg-white px-4">
      <label htmlFor={id} className="text-sm font-medium text-charcoal">
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative h-8 w-14 shrink-0 rounded-full transition-colors",
          checked ? "bg-teal" : "bg-black/15",
        )}
      >
        <span
          className={cn(
            "absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-6",
          )}
        />
      </button>
    </div>
  );
}
