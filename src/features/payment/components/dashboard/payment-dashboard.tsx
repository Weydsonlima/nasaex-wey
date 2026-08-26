"use client";

import { BarChart3, Wallet, WalletMinimal, PiggyBank } from "lucide-react";
import { usePaymentDashboard, useCashflow, usePaymentEntries } from "../../hooks/use-payment";
import { formatCurrency } from "../../lib/format";
import { PANEL_SURFACE } from "../../lib/ui";
import type { PaymentTab } from "../../lib/tabs";
import { KpiCard } from "./kpi-card";
import { CashflowChartCard } from "./cashflow-chart-card";
import { CategoryDonutCard } from "./category-donut-card";
import { EntriesPreviewCard } from "./entries-preview-card";
import { RecentTransactionsCard } from "./recent-transactions-card";
import { ExecutiveSummaryCard } from "./executive-summary-card";

const OPEN_STATUSES = ["PENDING", "PARTIAL", "OVERDUE"] as const;
const PREVIEW_SIZE = 5;

interface PaymentDashboardProps {
  dateFrom?: string;
  dateTo?: string;
  onNavigate: (tab: PaymentTab) => void;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className={`${PANEL_SURFACE} h-[132px] animate-pulse`} />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-5">
        <div className={`${PANEL_SURFACE} h-[360px] animate-pulse lg:col-span-3`} />
        <div className={`${PANEL_SURFACE} h-[360px] animate-pulse lg:col-span-2`} />
      </div>
    </div>
  );
}

export function PaymentDashboard({ dateFrom, dateTo, onNavigate }: PaymentDashboardProps) {
  const { data, isLoading } = usePaymentDashboard({ dateFrom, dateTo });
  const { data: cashflowData } = useCashflow({ dateFrom, dateTo });

  const receivables = usePaymentEntries({
    type: "RECEIVABLE",
    statuses: [...OPEN_STATUSES],
    dateFrom,
    dateTo,
    perPage: PREVIEW_SIZE,
    orderBy: "dueDateAsc",
  });
  const payables = usePaymentEntries({
    type: "PAYABLE",
    statuses: [...OPEN_STATUSES],
    dateFrom,
    dateTo,
    perPage: PREVIEW_SIZE,
    orderBy: "dueDateAsc",
  });
  const settled = usePaymentEntries({
    statuses: ["PAID"],
    paidFrom: dateFrom,
    paidTo: dateTo,
    perPage: PREVIEW_SIZE,
    orderBy: "paidAtDesc",
  });

  if (isLoading) return <DashboardSkeleton />;
  if (!data) return null;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="A receber"
          value={formatCurrency(data.totalReceivable)}
          icon={Wallet}
          tone="green"
          current={data.totalReceivable}
          previous={data.previous.totalReceivable}
          filter={{
            type: "RECEIVABLE",
            statuses: [...OPEN_STATUSES],
            dateFrom,
            dateTo,
          }}
        />
        <KpiCard
          title="A pagar"
          value={formatCurrency(data.totalPayable)}
          icon={WalletMinimal}
          tone="red"
          current={data.totalPayable}
          previous={data.previous.totalPayable}
          direction="lowerIsBetter"
          filter={{
            type: "PAYABLE",
            statuses: [...OPEN_STATUSES],
            dateFrom,
            dateTo,
          }}
        />
        <KpiCard
          title="Gastos do período"
          value={formatCurrency(data.totalPaid)}
          icon={BarChart3}
          tone="blue"
          current={data.totalPaid}
          previous={data.previous.totalPaid}
          direction="lowerIsBetter"
          filter={{
            type: "PAYABLE",
            statuses: ["PAID", "PARTIAL"],
            paidFrom: dateFrom,
            paidTo: dateTo,
          }}
          useSumOfPaid
        />
        <KpiCard
          title="Saldo do período"
          value={formatCurrency(data.netResult)}
          icon={PiggyBank}
          tone="purple"
          current={data.netResult}
          previous={data.previous.netResult}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <CashflowChartCard monthly={data.monthlyChart} daily={cashflowData?.rows ?? []} />
        </div>
        <div className="lg:col-span-2">
          <CategoryDonutCard breakdown={data.categoryBreakdown} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <EntriesPreviewCard
          title="Contas a Receber"
          tone="green"
          entries={receivables.data?.entries ?? []}
          isLoading={receivables.isLoading}
          totalLabel="Total a receber"
          totalValue={data.totalReceivable}
          upcomingLabel="Próximos 7 dias"
          upcomingValue={data.upcoming7Days.receivable}
          onSeeAll={() => onNavigate("receivables")}
        />
        <EntriesPreviewCard
          title="Contas a Pagar"
          tone="red"
          entries={payables.data?.entries ?? []}
          isLoading={payables.isLoading}
          totalLabel="Total a pagar"
          totalValue={data.totalPayable}
          upcomingLabel="Próximos 30 dias"
          upcomingValue={data.upcoming30Days.payable}
          onSeeAll={() => onNavigate("payables")}
        />
        <RecentTransactionsCard
          transactions={settled.data?.entries ?? []}
          isLoading={settled.isLoading}
          onSeeAll={() => onNavigate("cashflow")}
        />
      </div>

      <ExecutiveSummaryCard
        totalReceived={data.totalReceived}
        netResult={data.netResult}
        paidReceivableCount={data.paidReceivableCount}
        overdueReceivable={data.overdueReceivable}
        totalReceivable={data.totalReceivable}
        balanceTotal={data.balanceTotal}
        previous={data.previous}
      />
    </div>
  );
}
