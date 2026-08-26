"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "../../lib/format";
import {
  CHART_COLORS,
  PANEL_HEADING,
  PANEL_MUTED,
  PANEL_SURFACE,
} from "../../lib/ui";

const MONTH_LABELS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

type MonthlyPoint = { month: string; receivable: number; payable: number };
type DailyPoint = { date: string; receivable: number; payable: number; balance: number };

interface CashflowChartCardProps {
  monthly: MonthlyPoint[];
  daily: DailyPoint[];
}

function monthLabel(key: string): string {
  const monthIndex = parseInt(key.slice(5, 7), 10) - 1;
  return MONTH_LABELS[monthIndex] ?? key;
}

function compactCurrency(cents: number): string {
  const reais = cents / 100;
  if (Math.abs(reais) >= 1000) return `R$ ${Math.round(reais / 1000)}k`;
  return `R$ ${Math.round(reais)}`;
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-[#475467] dark:text-muted-foreground">
      <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

export function CashflowChartCard({ monthly, daily }: CashflowChartCardProps) {
  const [granularity, setGranularity] = useState<"monthly" | "daily">("monthly");

  // Despesas entram negativas pro gráfico espelhar entradas acima e saídas
  // abaixo da linha do zero, com o saldo cruzando os dois lados.
  let runningBalance = 0;
  const points =
    granularity === "monthly"
      ? monthly.map((point) => {
          runningBalance += point.receivable - point.payable;
          return {
            name: monthLabel(point.month),
            Receitas: point.receivable,
            Despesas: -point.payable,
            Saldo: runningBalance,
          };
        })
      : daily.map((point) => ({
          name: point.date.slice(8, 10),
          Receitas: point.receivable,
          Despesas: -point.payable,
          Saldo: point.balance,
        }));

  return (
    <section className={`${PANEL_SURFACE} p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <h2 className={PANEL_HEADING}>Fluxo de Caixa</h2>
          <Info
            className={`size-3.5 ${PANEL_MUTED}`}
            aria-label="Entradas acima da linha, saídas abaixo e o saldo acumulado como linha azul"
          />
        </div>
        <Select
          value={granularity}
          onValueChange={(value) => setGranularity(value as "monthly" | "daily")}
        >
          <SelectTrigger className="h-8 w-[104px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Mensal</SelectItem>
            <SelectItem value="daily">Diário</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-3 flex items-center gap-4">
        <LegendDot color={CHART_COLORS.revenue} label="Receitas" />
        <LegendDot color={CHART_COLORS.expense} label="Despesas" />
        <LegendDot color={CHART_COLORS.balance} label="Saldo" />
      </div>

      {points.length === 0 ? (
        <p className={`py-16 text-center text-sm ${PANEL_MUTED}`}>
          Sem movimentação no período.
        </p>
      ) : (
        <div className="mt-4">
          <ResponsiveContainer width="100%" height={248}>
            <ComposedChart data={points} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={62}
                tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
                tickFormatter={compactCurrency}
              />
              <Tooltip
                cursor={{ fill: "rgba(37,99,235,0.05)" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #E8EDF5",
                  fontSize: 12,
                  boxShadow: "0 8px 24px rgba(16,24,40,0.10)",
                }}
                formatter={(value: number, name: string) => [
                  formatCurrency(Math.abs(value)),
                  name,
                ]}
              />
              <Bar dataKey="Receitas" fill={CHART_COLORS.revenue} radius={[4, 4, 0, 0]} barSize={18} />
              <Bar dataKey="Despesas" fill={CHART_COLORS.expense} radius={[0, 0, 4, 4]} barSize={18} />
              <Line
                type="linear"
                dataKey="Saldo"
                stroke={CHART_COLORS.balance}
                strokeWidth={2}
                dot={{ r: 4, fill: "#FFFFFF", stroke: CHART_COLORS.balance, strokeWidth: 2 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
