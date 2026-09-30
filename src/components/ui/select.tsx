import * as React from "react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-12 w-full appearance-none rounded-xl border border-black/10 bg-white bg-[length:1rem] bg-[right_1rem_center] bg-no-repeat px-4 pr-10 text-base text-charcoal shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/35",
      className,
    )}
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E")`,
    }}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";
