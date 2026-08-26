"use client";

import { ReceiptText } from "lucide-react";
import { formatCurrency, formatDate, isOverdue } from "../../lib/format";
import {
  PANEL_DIVIDER,
  PANEL_HEADING,
  PANEL_LINK,
  PANEL_MUTED,
  PANEL_SURFACE,
  TONE_STYLES,
} from "../../lib/ui";

export type EntryPreview = {
  id: string;
  description: string;
  amount: number;
  dueDate: Date | string;
  status: string;
  contact: { name: string } | null;
  category: { name: string } | null;
};

interface EntriesPreviewCardProps {
  title: string;
  tone: "green" | "red";
  entries: EntryPreview[];
  isLoading: boolean;
  totalLabel: string;
  totalValue: number;
  upcomingLabel: string;
  upcomingValue: number;
  onSeeAll: () => void;
}

export function EntriesPreviewCard({
  title,
  tone,
  entries,
  isLoading,
  totalLabel,
  totalValue,
  upcomingLabel,
  upcomingValue,
  onSeeAll,
}: EntriesPreviewCardProps) {
  const styles = TONE_STYLES[tone];

  return (
    <section className={`${PANEL_SURFACE} flex flex-col p-5`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className={PANEL_HEADING}>{title}</h2>
        <button type="button" onClick={onSeeAll} className={PANEL_LINK}>
          Ver todas
        </button>
      </div>

      <ul className="mt-3 flex-1 divide-y divide-[#F2F5F9] dark:divide-border/40">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <li key={index} className="h-[52px] animate-pulse py-3">
              <div className="h-full rounded-lg bg-[#F2F5F9] dark:bg-muted/40" />
            </li>
          ))
        ) : entries.length === 0 ? (
          <li className={`py-10 text-center text-sm ${PANEL_MUTED}`}>
            Nenhum lançamento em aberto.
          </li>
        ) : (
          entries.map((entry) => {
            const overdue = isOverdue(entry.dueDate, entry.status);
            return (
              <li key={entry.id} className="flex items-center gap-3 py-2.5">
                <div
                  className={`size-8 shrink-0 rounded-lg flex items-center justify-center ${styles.tile}`}
                >
                  <ReceiptText className={`size-4 ${styles.icon}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-[#101828] dark:text-foreground">
                    {entry.contact?.name ?? entry.description}
                  </p>
                  <p className={`truncate text-xs ${PANEL_MUTED}`}>
                    {entry.contact
                      ? entry.description
                      : (entry.category?.name ?? "Sem categoria")}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[13px] font-semibold text-[#101828] dark:text-foreground">
                    {formatCurrency(entry.amount)}
                  </p>
                  <p
                    className={`text-xs ${
                      overdue
                        ? "font-medium text-[#EF4444] dark:text-red-400"
                        : styles.icon
                    }`}
                  >
                    Venc. {formatDate(entry.dueDate)}
                  </p>
                </div>
              </li>
            );
          })
        )}
      </ul>

      <div className={`mt-3 flex items-end justify-between gap-3 border-t pt-3 ${PANEL_DIVIDER}`}>
        <div>
          <p className="text-[13px] font-semibold text-[#101828] dark:text-foreground">
            {totalLabel}
          </p>
          <p className={`text-xs ${PANEL_MUTED}`}>
            {upcomingLabel} · {formatCurrency(upcomingValue)}
          </p>
        </div>
        <p className={`text-[15px] font-bold ${styles.value}`}>
          {formatCurrency(totalValue)}
        </p>
      </div>
    </section>
  );
}
