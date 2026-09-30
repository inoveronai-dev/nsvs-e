import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-black/6 bg-white p-4 shadow-sm shadow-black/5",
        className,
      )}
    >
      {children}
    </div>
  );
}
