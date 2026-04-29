"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { ChevronLeft, Sparkles, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function SalesTable() {
  const { data, isLoading } = useQuery({
    ...orpc.nasaRoute.creatorListSales.queryOptions(),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link
        href="/nasa-route/criador"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Voltar para o painel
      </Link>

      <h1 className="text-3xl font-bold tracking-tight">Vendas</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Histórico de créditos recebidos pelas vendas dos seus cursos.
      </p>

      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800/40 dark:bg-amber-900/20">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-amber-500 text-white">
            <TrendingUp className="size-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300">
              Total recebido
            </p>
            {isLoading ? (
              <Skeleton className="mt-1 h-8 w-32" />
            ) : (
              <p className="text-3xl font-bold tabular-nums text-amber-900 dark:text-amber-100">
                {(data?.totalEarned ?? 0).toLocaleString("pt-BR")} ★
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Data</th>
              <th className="px-4 py-3 text-left font-semibold">Descrição</th>
              <th className="px-4 py-3 text-right font-semibold">Valor</th>
              <th className="px-4 py-3 text-right font-semibold">Saldo após</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading
              ? [1, 2, 3].map((i) => (
                  <tr key={i}>
                    <td className="px-4 py-3" colSpan={4}>
                      <Skeleton className="h-4 w-full" />
                    </td>
                  </tr>
                ))
              : (data?.transactions ?? []).map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(t.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">{t.description ?? "Venda de curso"}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        <Sparkles className="size-3" />+{t.amount.toLocaleString("pt-BR")} ★
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs tabular-nums text-muted-foreground">
                      {t.balanceAfter.toLocaleString("pt-BR")} ★
                    </td>
                  </tr>
                ))}
            {!isLoading && (data?.transactions.length ?? 0) === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  Nenhuma venda ainda. Publique seus cursos para começar a vender.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
