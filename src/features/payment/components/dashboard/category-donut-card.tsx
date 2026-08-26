"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "../../lib/format";
import {
  CATEGORY_COLORS,
  PANEL_HEADING,
  PANEL_MUTED,
  PANEL_SURFACE,
  formatPercent,
} from "../../lib/ui";

type CategorySlice = { categoryName: string; type: string; total: number };

interface CategoryDonutCardProps {
  breakdown: CategorySlice[];
}

const MAX_SLICES = 5;

export function CategoryDonutCard({ breakdown }: CategoryDonutCardProps) {
  const [entryType, setEntryType] = useState<"PAYABLE" | "RECEIVABLE">("PAYABLE");

  const ranked = breakdown
    .filter((slice) => slice.type === entryType && slice.total > 0)
    .sort((first, second) => second.total - first.total);

  // Da sexta categoria em diante tudo vira "Outros" — o design mostra no
  // máximo cinco linhas na legenda.
  const visible = ranked.slice(0, MAX_SLICES);
  const rest = ranked.slice(MAX_SLICES);
  const restTotal = rest.reduce((sum, slice) => sum + slice.total, 0);
  const slices = restTotal
    ? [...visible, { categoryName: "Outros", type: entryType, total: restTotal }]
    : visible;

  const total = slices.reduce((sum, slice) => sum + slice.total, 0);

  return (
    <section className={`${PANEL_SURFACE} p-5`}>
      <div className="flex items-start justify-between gap-3">
        <h2 className={PANEL_HEADING}>
          {entryType === "PAYABLE" ? "Gastos por Categoria" : "Receitas por Categoria"}
        </h2>
        <Select
          value={entryType}
          onValueChange={(value) => setEntryType(value as "PAYABLE" | "RECEIVABLE")}
        >
          <SelectTrigger className="h-8 w-[112px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PAYABLE">Despesas</SelectItem>
            <SelectItem value="RECEIVABLE">Receitas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {total === 0 ? (
        <p className={`py-16 text-center text-sm ${PANEL_MUTED}`}>
          Nada quitado no período.
        </p>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row">
          <div className="relative size-[188px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="total"
                  nameKey="categoryName"
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={92}
                  paddingAngle={1.5}
                  stroke="none"
                >
                  {slices.map((slice, index) => (
                    <Cell
                      key={slice.categoryName}
                      fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #E8EDF5",
                    fontSize: 12,
                    boxShadow: "0 8px 24px rgba(16,24,40,0.10)",
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[15px] font-bold text-[#101828] dark:text-foreground">
                {formatCurrency(total)}
              </span>
              <span className={`text-[11px] ${PANEL_MUTED}`}>Total</span>
            </div>
          </div>

          <ul className="w-full flex-1 space-y-3">
            {slices.map((slice, index) => (
              <li key={slice.categoryName} className="flex items-center gap-2.5 text-[13px]">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                />
                <span className="min-w-0 flex-1 truncate text-[#344054] dark:text-foreground">
                  {slice.categoryName}
                </span>
                <span className="font-medium text-[#101828] dark:text-foreground">
                  {formatCurrency(slice.total)}
                </span>
                <span className={`w-11 text-right ${PANEL_MUTED}`}>
                  {formatPercent((slice.total / total) * 100)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
