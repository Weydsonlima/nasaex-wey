import { STATUS_LABELS } from "../lib/format";

export type ExportableEntry = {
  type: "RECEIVABLE" | "PAYABLE";
  status: string;
  description: string;
  amount: number;
  paidAmount: number;
  dueDate: Date | string;
  paidAt: Date | string | null;
  documentNumber: string | null;
  contact: { name: string } | null;
  category: { name: string } | null;
  account: { name: string } | null;
};

const COLUMNS = [
  "Tipo",
  "Descrição",
  "Contato",
  "Categoria",
  "Conta",
  "Documento",
  "Vencimento",
  "Pagamento",
  "Status",
  "Valor",
  "Valor pago",
];

function toBrDate(value: Date | string | null): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("pt-BR");
}

/** Centavos → "1234,56" (sem separador de milhar, pra planilha ler como número). */
function toBrAmount(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function escapeCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function buildEntriesCsv(entries: ExportableEntry[]): string {
  const rows = entries.map((entry) =>
    [
      entry.type === "RECEIVABLE" ? "A receber" : "A pagar",
      entry.description,
      entry.contact?.name ?? "",
      entry.category?.name ?? "",
      entry.account?.name ?? "",
      entry.documentNumber ?? "",
      toBrDate(entry.dueDate),
      toBrDate(entry.paidAt),
      STATUS_LABELS[entry.status] ?? entry.status,
      toBrAmount(entry.amount),
      toBrAmount(entry.paidAmount),
    ]
      .map(escapeCell)
      .join(";"),
  );
  return [COLUMNS.map(escapeCell).join(";"), ...rows].join("\r\n");
}

/** Dispara o download no browser. O BOM mantém os acentos corretos no Excel. */
export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([`﻿${content}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
