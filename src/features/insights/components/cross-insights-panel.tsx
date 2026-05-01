"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangleIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  MinusIcon,
  SparklesIcon,
  TrendingUpIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { orpc } from "@/lib/orpc";
import { useDashboardStore } from "@/features/insights/hooks/use-dashboard-store";

function formatValue(
  value: number,
  unit?: "count" | "percent" | "currency",
): string {
  if (unit === "currency") {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(value);
  }
  if (unit === "percent") return `${value.toFixed(1)}%`;
  return new Intl.NumberFormat("pt-BR").format(value);
}

const SEVERITY_STYLES = {
  good: {
    border: "border-emerald-200 dark:border-emerald-900",
    bg: "bg-emerald-50/60 dark:bg-emerald-950/20",
    icon: "text-emerald-600",
    label: "Destaque",
  },
  warn: {
    border: "border-amber-200 dark:border-amber-900",
    bg: "bg-amber-50/60 dark:bg-amber-950/20",
    icon: "text-amber-600",
    label: "Atenção",
  },
  bad: {
    border: "border-red-200 dark:border-red-900",
    bg: "bg-red-50/60 dark:bg-red-950/20",
    icon: "text-red-600",
    label: "Alerta",
  },
  neutral: {
    border: "",
    bg: "",
    icon: "text-muted-foreground",
    label: "",
  },
} as const;

export function CrossInsightsPanel() {
  const { dateRange } = useDashboardStore();

  const { data, isLoading } = useQuery(
    orpc.insights.getCrossInsights.queryOptions({
      input: {
        dateRange: {
          from: dateRange.from?.toISOString(),
          to: dateRange.to?.toISOString(),
        },
      },
    }),
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Cruzamentos inteligentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.tiles.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Cruzamentos inteligentes</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Indicadores cruzados com variação vs período anterior e narrativa
            operacional
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.tiles.map((t) => {
          const sev = SEVERITY_STYLES[t.severity];
          const trendIcon =
            t.trend === "up" ? (
              <ArrowUpIcon className="size-3" />
            ) : t.trend === "down" ? (
              <ArrowDownIcon className="size-3" />
            ) : (
              <MinusIcon className="size-3" />
            );
          const trendColor =
            t.trend === "up"
              ? "text-emerald-600"
              : t.trend === "down"
                ? "text-red-600"
                : "text-muted-foreground";

          return (
            <Card
              key={t.tileId}
              className={cn("border", sev.border, sev.bg)}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    {t.title}
                  </span>
                  {t.severity !== "neutral" && (
                    <span
                      className={cn(
                        "flex items-center gap-1 text-[11px] font-medium",
                        sev.icon,
                      )}
                    >
                      {t.severity === "good" ? (
                        <SparklesIcon className="size-3" />
                      ) : (
                        <AlertTriangleIcon className="size-3" />
                      )}
                      {sev.label}
                    </span>
                  )}
                </div>
                <div className="flex items-end justify-between gap-2">
                  <span className="text-3xl font-bold tracking-tight">
                    {formatValue(t.primaryValue, t.unit)}
                  </span>
                  <span
                    className={cn(
                      "flex items-center gap-1 text-xs font-medium",
                      trendColor,
                    )}
                  >
                    {trendIcon}
                    {t.delta == null
                      ? "—"
                      : `${t.delta > 0 ? "+" : ""}${t.delta.toFixed(1)}%`}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-snug">
                  {t.narrative}
                </p>
                {t.secondaryValue != null && (
                  <p className="text-[11px] text-muted-foreground/70 flex items-center gap-1">
                    <TrendingUpIcon className="size-3" />
                    Anterior: {formatValue(t.secondaryValue, t.unit)}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
