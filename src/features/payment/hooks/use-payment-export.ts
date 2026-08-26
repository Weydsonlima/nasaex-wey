"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import {
  buildEntriesCsv,
  downloadCsv,
  type ExportableEntry,
} from "../utils/export-entries-csv";

const EXPORT_PAGE_SIZE = 1000;

/**
 * Exporta os lançamentos do período aberto no painel em CSV. Busca sob demanda
 * (fetchQuery) pra não manter uma query extra viva em toda renderização.
 */
export function usePaymentEntriesExport() {
  const queryClient = useQueryClient();
  const [isExporting, setIsExporting] = useState(false);

  async function exportEntries(range: { dateFrom?: string; dateTo?: string }) {
    setIsExporting(true);
    try {
      const result = await queryClient.fetchQuery(
        orpc.payment.entries.list.queryOptions({
          input: {
            dateFrom: range.dateFrom,
            dateTo: range.dateTo,
            perPage: EXPORT_PAGE_SIZE,
            orderBy: "dueDateAsc",
          },
        }),
      );
      const entries = result.entries as ExportableEntry[];
      if (entries.length === 0) return { exported: 0 };

      const stamp = new Date().toISOString().slice(0, 10);
      downloadCsv(buildEntriesCsv(entries), `financeiro-${stamp}.csv`);
      return { exported: entries.length };
    } finally {
      setIsExporting(false);
    }
  }

  return { exportEntries, isExporting };
}
