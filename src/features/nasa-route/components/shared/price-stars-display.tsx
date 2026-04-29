import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceStarsDisplayProps {
  priceStars: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PriceStarsDisplay({ priceStars, size = "md", className }: PriceStarsDisplayProps) {
  if (priceStars === 0) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-medium text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-900/20 dark:text-emerald-300",
          size === "sm" && "text-[11px]",
          size === "md" && "text-xs",
          size === "lg" && "text-sm",
          className,
        )}
      >
        Gratuito
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 font-medium text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300",
        size === "sm" && "text-[11px]",
        size === "md" && "text-xs",
        size === "lg" && "text-base",
        className,
      )}
    >
      <Sparkles className={cn(size === "lg" ? "size-4" : "size-3")} />
      {priceStars.toLocaleString("pt-BR")} ★
    </span>
  );
}
