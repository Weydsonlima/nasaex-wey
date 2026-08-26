"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { KpiEntriesDialog, type KpiEntriesFilter } from "./kpi-entries-dialog";
import {
  PANEL_DIVIDER,
  PANEL_LABEL,
  PANEL_MUTED,
  PANEL_SURFACE,
  TONE_STYLES,
  computeDelta,
  type MetricDirection,
  type PanelTone,
} from "../../lib/ui";

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  tone: PanelTone;
  current: number;
  previous: number;
  direction?: MetricDirection;
  /** Quando presente, o card inteiro abre o drill-down dos lançamentos. */
  filter?: KpiEntriesFilter;
  useSumOfPaid?: boolean;
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  tone,
  current,
  previous,
  direction = "higherIsBetter",
  filter,
  useSumOfPaid,
}: KpiCardProps) {
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const styles = TONE_STYLES[tone];
  const delta = computeDelta(current, previous, direction);

  const content = (
    <>
      <div className="flex items-center gap-3.5">
        <div
          className={`size-12 shrink-0 rounded-2xl flex items-center justify-center ${styles.tile}`}
        >
          <Icon className={`size-5 ${styles.icon}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={PANEL_LABEL}>{title}</p>
          <p className={`mt-1 text-[22px] font-bold leading-tight truncate ${styles.value}`}>
            {value}
          </p>
        </div>
      </div>
      <div className={`mt-4 border-t pt-3 ${PANEL_DIVIDER}`}>
        {delta ? (
          <p className="flex items-center gap-1 text-xs">
            <span
              className={
                delta.isGood
                  ? "text-[#16A34A] dark:text-emerald-400"
                  : "text-[#EF4444] dark:text-red-400"
              }
            >
              {delta.isUp ? (
                <ArrowUp className="size-3.5 inline" />
              ) : (
                <ArrowDown className="size-3.5 inline" />
              )}
              <span className="ml-0.5 font-semibold">{delta.label}</span>
            </span>
            <span className={PANEL_MUTED}>em relação ao período anterior</span>
          </p>
        ) : (
          <p className={`text-xs ${PANEL_MUTED}`}>Sem base de comparação</p>
        )}
      </div>
    </>
  );

  if (!filter) {
    return <div className={`${PANEL_SURFACE} p-5`}>{content}</div>;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setDrillDownOpen(true)}
        title="Ver lançamentos"
        className={`${PANEL_SURFACE} p-5 text-left transition-shadow hover:shadow-[0_4px_16px_rgba(16,24,40,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40`}
      >
        {content}
      </button>
      <KpiEntriesDialog
        open={drillDownOpen}
        onOpenChange={setDrillDownOpen}
        title={title}
        filter={filter}
        accentClassName={styles.value}
        useSumOfPaid={useSumOfPaid}
      />
    </>
  );
}
