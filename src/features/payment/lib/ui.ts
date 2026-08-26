/**
 * Tokens visuais do Painel Financeiro. Centralizados aqui pra que os cards do
 * dashboard compartilhem exatamente a mesma superfície, borda e tipografia.
 * As classes trazem par claro/escuro porque o app roda com tema `system`.
 */

export const PANEL_SURFACE =
  "rounded-2xl border border-[#E8EDF5] bg-white shadow-[0_1px_3px_rgba(16,24,40,0.04)] dark:border-border/60 dark:bg-card dark:shadow-none";

export const PANEL_HEADING =
  "text-[15px] font-semibold tracking-tight text-[#101828] dark:text-foreground";

export const PANEL_LABEL =
  "text-[11px] font-semibold uppercase tracking-wider text-[#8A94A6] dark:text-muted-foreground";

export const PANEL_MUTED = "text-[#667085] dark:text-muted-foreground";

export const PANEL_DIVIDER = "border-[#EEF2F7] dark:border-border/50";

export const PANEL_LINK =
  "text-[13px] font-medium text-[#2563EB] hover:text-[#1D4ED8] dark:text-[#60A5FA] dark:hover:text-[#93C5FD]";

/** Fundo da área de conteúdo — cinza-azulado bem claro, como no design. */
export const PANEL_BACKGROUND = "bg-[#F6F8FB] dark:bg-background";

export type PanelTone = "green" | "red" | "blue" | "purple" | "amber" | "slate";

/** Quadrado pastel do ícone + cor do valor, por tom do indicador. */
export const TONE_STYLES: Record<PanelTone, { tile: string; icon: string; value: string }> = {
  green: {
    tile: "bg-[#E6F7EE] dark:bg-emerald-500/10",
    icon: "text-[#16A34A] dark:text-emerald-400",
    value: "text-[#16A34A] dark:text-emerald-400",
  },
  red: {
    tile: "bg-[#FDECEC] dark:bg-red-500/10",
    icon: "text-[#EF4444] dark:text-red-400",
    value: "text-[#EF4444] dark:text-red-400",
  },
  blue: {
    tile: "bg-[#E8F0FE] dark:bg-blue-500/10",
    icon: "text-[#2563EB] dark:text-blue-400",
    value: "text-[#2563EB] dark:text-blue-400",
  },
  purple: {
    tile: "bg-[#F1EAFD] dark:bg-violet-500/10",
    icon: "text-[#8B5CF6] dark:text-violet-400",
    value: "text-[#8B5CF6] dark:text-violet-400",
  },
  amber: {
    tile: "bg-[#FEF3E2] dark:bg-amber-500/10",
    icon: "text-[#F59E0B] dark:text-amber-400",
    value: "text-[#B45309] dark:text-amber-400",
  },
  slate: {
    tile: "bg-[#EEF2F7] dark:bg-muted",
    icon: "text-[#667085] dark:text-muted-foreground",
    value: "text-[#101828] dark:text-foreground",
  },
};

export const CHART_COLORS = {
  revenue: "#22C55E",
  expense: "#EF4444",
  balance: "#2563EB",
  grid: "#EEF2F7",
  axis: "#98A2B3",
};

export const CATEGORY_COLORS = [
  "#3B82F6",
  "#22C55E",
  "#F59E0B",
  "#8B5CF6",
  "#94A3B8",
  "#06B6D4",
  "#EC4899",
  "#14B8A6",
];

export type MetricDirection = "higherIsBetter" | "lowerIsBetter";

export type MetricDelta = {
  label: string;
  isUp: boolean;
  isGood: boolean;
};

/**
 * Variação percentual contra o período anterior. Devolve null quando não há
 * base de comparação — o card mostra um texto neutro nesse caso, em vez de
 * inventar 100%.
 */
export function computeDelta(
  current: number,
  previous: number,
  direction: MetricDirection = "higherIsBetter",
): MetricDelta | null {
  if (!previous) return null;
  const change = ((current - previous) / Math.abs(previous)) * 100;
  const isUp = change >= 0;
  return {
    label: `${Math.abs(change).toFixed(1).replace(".", ",")}%`,
    isUp,
    isGood: direction === "higherIsBetter" ? isUp : !isUp,
  };
}

/** Percentual simples formatado no padrão pt-BR (ex.: "26,5%"). */
export function formatPercent(value: number, fractionDigits = 1): string {
  return `${value.toFixed(fractionDigits).replace(".", ",")}%`;
}
