import Image from "next/image";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  priority,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={brand.logoSrc}
      alt={brand.name}
      width={220}
      height={56}
      priority={priority}
      className={cn("h-10 w-auto object-contain", className)}
    />
  );
}
