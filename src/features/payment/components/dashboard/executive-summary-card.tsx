"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { formatCurrency } from "../../lib/format";
import {
  PANEL_HEADING,
  PANEL_LABEL,
  PANEL_MUTED,
  PANEL_SURFACE,
  computeDelta,
  formatPercent,
  type MetricDelta,
  type MetricDirection,
} from "../../lib/ui";

interface ExecutiveSummaryCardProps {
  totalReceived: number;
  netResult: number;
  paidReceivableCount: number;
  overdueReceivable: number;
  totalReceivable: number;
  balanceTotal: number;
  previous: {
    totalReceived: number;
    netResult: number;
    paidReceivableCount: number;
  };
}

const SEMICIRCLE_LENGTH = 157.08;

function DeltaLine({ delta }: { delta: MetricDelta | null }) {
  if (!delta) {
    return <p className={`mt-1 text-xs ${PANEL_MUTED}`}>Sem base de comparação</p>;
  }
  return (
    <p className="mt-1 flex items-center gap-1 text-xs">
      <span
        className={
          delta.isGood
            ? "text-[#16A34A] dark:text-emerald-400"
            : "text-[#EF4444] dark:text-red-400"
        }
      >
        {delta.isUp ? (
          <ArrowUp className="size-3 inline" />
        ) : (
          <ArrowDown className="size-3 inline" />
        )}
        <span className="ml-0.5 font-semibold">{delta.label}</span>
      </span>
      <span className={PANEL_MUTED}>vs período anterior</span>
    </p>
  );
}

function SummaryMetric({
  label,
  value,
  current,
  previous,
  direction,
  hint,
}: {
  label: string;
  value: string;
  current?: number;
  previous?: number;
  direction?: MetricDirection;
  hint?: string;
}) {
  return (
    <div className="min-w-0">
      <p className={PANEL_LABEL}>{label}</p>
      <p className="mt-1.5 truncate text-[22px] font-bold leading-tight text-[#101828] dark:text-foreground">
        {value}
      </p>
      {hint ? (
        <p className={`mt-1 text-xs ${PANEL_MUTED}`}>{hint}</p>
      ) : (
        <DeltaLine delta={computeDelta(current ?? 0, previous ?? 0, direction)} />
      )}
    </div>
  );
}

export function ExecutiveSummaryCard({
  totalReceived,
  netResult,
  paidReceivableCount,
  overdueReceivable,
  totalReceivable,
  balanceTotal,
  previous,
}: ExecutiveSummaryCardProps) {
  const averageTicket = paidReceivableCount
    ? Math.round(totalReceived / paidReceivableCount)
    : 0;
  const previousAverageTicket = previous.paidReceivableCount
    ? Math.round(previous.totalReceived / previous.paidReceivableCount)
    : 0;

  const expectedRevenue = totalReceivable + overdueReceivable;
  const defaultRate = expectedRevenue
    ? (overdueReceivable / expectedRevenue) * 100
    : 0;

  // Medidor: quanto do previsto do período já entrou em caixa.
  const forecast = totalReceived + totalReceivable;
  const collectedRatio = forecast ? Math.min(totalReceived / forecast, 1) : 0;

  return (
    <section className={`${PANEL_SURFACE} p-5`}>
      <h2 className={PANEL_HEADING}>Resumo Executivo</h2>

      <div className="mt-5 flex flex-col gap-8 xl:flex-row xl:items-center">
        <div className="grid flex-1 grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-5">
          <SummaryMetric
            label="Faturamento"
            value={formatCurrency(totalReceived)}
            current={totalReceived}
            previous={previous.totalReceived}
          />
          <SummaryMetric
            label="Lucro líquido"
            value={formatCurrency(netResult)}
            current={netResult}
            previous={previous.netResult}
          />
          <SummaryMetric
            label="Ticket médio"
            value={formatCurrency(averageTicket)}
            current={averageTicket}
            previous={previousAverageTicket}
          />
          <SummaryMetric
            label="Inadimplência"
            value={formatPercent(defaultRate)}
            hint={`${formatCurrency(overdueReceivable)} vencidos`}
          />
          <SummaryMetric
            label="Reservas"
            value={formatCurrency(balanceTotal)}
            hint="Disponível em contas"
          />
        </div>

        <div className="flex shrink-0 flex-col items-center xl:w-[190px]">
          <div className="relative">
            <svg viewBox="0 0 120 68" className="w-[150px]" role="img" aria-hidden>
              <path
                d="M 10 60 A 50 50 0 0 1 110 60"
                fill="none"
                stroke="#EEF2F7"
                strokeWidth={10}
                strokeLinecap="round"
                className="dark:stroke-muted"
              />
              <path
                d="M 10 60 A 50 50 0 0 1 110 60"
                fill="none"
                stroke="#16A34A"
                strokeWidth={10}
                strokeLinecap="round"
                strokeDasharray={`${collectedRatio * SEMICIRCLE_LENGTH} ${SEMICIRCLE_LENGTH}`}
              />
            </svg>
            <span className="absolute inset-x-0 bottom-1 text-center text-[22px] font-bold text-[#101828] dark:text-foreground">
              {formatPercent(collectedRatio * 100, 0)}
            </span>
          </div>
          <p className={`mt-1 text-xs ${PANEL_MUTED}`}>Recebido do previsto</p>
          <p className={`text-xs ${PANEL_MUTED}`}>
            {formatCurrency(totalReceived)} / {formatCurrency(forecast)}
          </p>
        </div>
      </div>
    </section>
  );
}
