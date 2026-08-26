"use client";

import { ArrowDown, ArrowUp, ArrowRight } from "lucide-react";
import { formatCurrency } from "../../lib/format";
import {
  PANEL_DIVIDER,
  PANEL_HEADING,
  PANEL_LINK,
  PANEL_MUTED,
  PANEL_SURFACE,
  TONE_STYLES,
} from "../../lib/ui";

export type TransactionPreview = {
  id: string;
  type: "RECEIVABLE" | "PAYABLE";
  description: string;
  paidAmount: number;
  paidAt: Date | string | null;
  contact: { name: string } | null;
  category: { name: string } | null;
};

interface RecentTransactionsCardProps {
  transactions: TransactionPreview[];
  isLoading: boolean;
  onSeeAll: () => void;
}

function formatMoment(value: Date | string | null): string {
  if (!value) return "—";
  const moment = typeof value === "string" ? new Date(value) : value;
  const time = moment.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (first: Date, second: Date) =>
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate();

  if (sameDay(moment, today)) return `Hoje, ${time}`;
  if (sameDay(moment, yesterday)) return `Ontem, ${time}`;
  return moment.toLocaleDateString("pt-BR");
}

export function RecentTransactionsCard({
  transactions,
  isLoading,
  onSeeAll,
}: RecentTransactionsCardProps) {
  return (
    <section className={`${PANEL_SURFACE} flex flex-col p-5`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className={PANEL_HEADING}>Últimas Transações</h2>
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
        ) : transactions.length === 0 ? (
          <li className={`py-10 text-center text-sm ${PANEL_MUTED}`}>
            Nenhuma baixa registrada no período.
          </li>
        ) : (
          transactions.map((transaction) => {
            const isInflow = transaction.type === "RECEIVABLE";
            const styles = TONE_STYLES[isInflow ? "green" : "red"];
            const Icon = isInflow ? ArrowDown : ArrowUp;
            return (
              <li key={transaction.id} className="flex items-center gap-3 py-2.5">
                <div
                  className={`size-8 shrink-0 rounded-full flex items-center justify-center ${styles.tile}`}
                >
                  <Icon className={`size-4 ${styles.icon}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-[#101828] dark:text-foreground">
                    {transaction.description}
                  </p>
                  <p className={`truncate text-xs ${PANEL_MUTED}`}>
                    {transaction.contact?.name ??
                      transaction.category?.name ??
                      "Sem contato"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-[13px] font-semibold ${styles.value}`}>
                    {isInflow ? "+" : "-"} {formatCurrency(transaction.paidAmount)}
                  </p>
                  <p className={`text-xs ${PANEL_MUTED}`}>
                    {formatMoment(transaction.paidAt)}
                  </p>
                </div>
              </li>
            );
          })
        )}
      </ul>

      <div className={`mt-3 border-t pt-3 text-right ${PANEL_DIVIDER}`}>
        <button
          type="button"
          onClick={onSeeAll}
          className={`${PANEL_LINK} inline-flex items-center gap-1.5`}
        >
          Ver todas as transações
          <ArrowRight className="size-3.5" />
        </button>
      </div>
    </section>
  );
}
