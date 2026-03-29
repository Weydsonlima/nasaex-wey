"use client";

import { useState, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import type { AppModule } from "./app-selector";

// ─── Types ───────────────────────────────────────────────────────────────────

type ChartType = "bar" | "bar-horizontal" | "line" | "area" | "pie" | "pictogram";

interface DataPoint { name: string; value: number; color?: string }

interface Dataset {
  id: string;
  label: string;
  module: AppModule | "meta";
  data: DataPoint[];
}

interface CustomizableChartProps {
  selectedModules: AppModule[];
  tracking?: { totalLeads: number; wonLeads: number; activeLeads: number };
  chat?: { totalConversations: number; totalMessages: number; attendedConversations: number; unattendedConversations: number };
  forge?: { totalProposals: number; rascunho: number; enviadas: number; visualizadas: number; pagas: number; expiradas: number; canceladas: number; revenueTotal: number; revenuePipeline: number };
  spacetime?: { total: number; pending: number; confirmed: number; done: number; cancelled: number; noShow: number };
  nasaPost?: { total: number; draft: number; published: number; scheduled: number };
  metaAds?: { spend?: number; roas?: number; leads?: number; clicks?: number; impressions?: number };
}

// ─── Colors ──────────────────────────────────────────────────────────────────

const PALETTE = [
  "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6",
  "#ec4899", "#8b5cf6", "#14b8a6", "#f97316", "#84cc16",
];

// ─── Chart Type Buttons ───────────────────────────────────────────────────────

const CHART_TYPES: { id: ChartType; label: string; icon: string }[] = [
  { id: "bar", label: "Colunas", icon: "▐▐" },
  { id: "bar-horizontal", label: "Barras", icon: "═" },
  { id: "line", label: "Linhas", icon: "∿" },
  { id: "area", label: "Áreas", icon: "◿" },
  { id: "pie", label: "Pizza", icon: "◕" },
  { id: "pictogram", label: "Pictograma", icon: "⬛" },
];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill ?? p.color }}>
          {p.name}: <span className="font-bold">{Number(p.value).toLocaleString("pt-BR")}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Pictogram Chart ─────────────────────────────────────────────────────────

function PictogramChart({ data }: { data: DataPoint[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const ICONS_PER_ROW = 10;
  const MAX_ICONS = 50;

  return (
    <div className="flex flex-col gap-4 py-4">
      {data.map((d, i) => {
        const icons = Math.max(1, Math.round((d.value / max) * MAX_ICONS));
        return (
          <div key={d.name} className="flex items-center gap-3">
            <span className="text-xs font-medium w-28 text-right shrink-0 text-muted-foreground">{d.name}</span>
            <div className="flex flex-wrap gap-0.5 flex-1">
              {Array.from({ length: Math.min(icons, MAX_ICONS) }).map((_, j) => (
                <div
                  key={j}
                  className="w-4 h-4 rounded-sm"
                  style={{ backgroundColor: d.color ?? PALETTE[i % PALETTE.length] }}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-right w-14 shrink-0">
              {d.value.toLocaleString("pt-BR")}
            </span>
          </div>
        );
      })}
      <p className="text-[10px] text-muted-foreground text-right">Cada ■ = {Math.ceil(max / MAX_ICONS).toLocaleString("pt-BR")} unidades</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CustomizableChart({
  selectedModules,
  tracking,
  chat,
  forge,
  spacetime,
  nasaPost,
  metaAds,
}: CustomizableChartProps) {
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [datasetId, setDatasetId] = useState<string>("");

  // Build available datasets based on selected modules + data
  const datasets = useMemo<Dataset[]>(() => {
    const result: Dataset[] = [];

    if (selectedModules.includes("tracking") && tracking) {
      result.push({
        id: "tracking-leads",
        label: "Tracking — Leads",
        module: "tracking",
        data: [
          { name: "Total", value: tracking.totalLeads, color: "#6366f1" },
          { name: "Ativos", value: tracking.activeLeads, color: "#10b981" },
          { name: "Ganhos", value: tracking.wonLeads, color: "#f59e0b" },
        ],
      });
    }

    if (selectedModules.includes("chat") && chat) {
      result.push({
        id: "chat-conversas",
        label: "Chat — Atendimento",
        module: "chat",
        data: [
          { name: "Mensagens", value: chat.totalMessages, color: "#8b5cf6" },
          { name: "Conversas", value: chat.totalConversations, color: "#6366f1" },
          { name: "Atendidas", value: chat.attendedConversations, color: "#10b981" },
          { name: "Não atendidas", value: chat.unattendedConversations, color: "#ef4444" },
        ],
      });
    }

    if (selectedModules.includes("forge") && forge) {
      result.push({
        id: "forge-status",
        label: "Forge — Status das Propostas",
        module: "forge",
        data: [
          { name: "Rascunho", value: forge.rascunho, color: "#94a3b8" },
          { name: "Enviadas", value: forge.enviadas, color: "#3b82f6" },
          { name: "Visualizadas", value: forge.visualizadas, color: "#6366f1" },
          { name: "Pagas", value: forge.pagas, color: "#10b981" },
          { name: "Expiradas", value: forge.expiradas, color: "#f59e0b" },
          { name: "Canceladas", value: forge.canceladas, color: "#ef4444" },
        ],
      });
      result.push({
        id: "forge-receita",
        label: "Forge — Receita (R$)",
        module: "forge",
        data: [
          { name: "Receita fechada", value: forge.revenueTotal, color: "#10b981" },
          { name: "Pipeline", value: forge.revenuePipeline, color: "#3b82f6" },
        ],
      });
    }

    if (selectedModules.includes("spacetime") && spacetime) {
      result.push({
        id: "spacetime-status",
        label: "SpaceTime — Agendamentos",
        module: "spacetime",
        data: [
          { name: "Total", value: spacetime.total, color: "#3b82f6" },
          { name: "Realizados", value: spacetime.done, color: "#10b981" },
          { name: "Confirmados", value: spacetime.confirmed, color: "#6366f1" },
          { name: "Pendentes", value: spacetime.pending, color: "#f59e0b" },
          { name: "Cancelados", value: spacetime.cancelled, color: "#ef4444" },
          { name: "No-show", value: spacetime.noShow, color: "#f97316" },
        ],
      });
    }

    if (selectedModules.includes("nasa-post") && nasaPost) {
      result.push({
        id: "nasapost-status",
        label: "NASA Post — Conteúdo",
        module: "nasa-post",
        data: [
          { name: "Total", value: nasaPost.total, color: "#ec4899" },
          { name: "Publicados", value: nasaPost.published, color: "#10b981" },
          { name: "Agendados", value: nasaPost.scheduled, color: "#3b82f6" },
          { name: "Rascunhos", value: nasaPost.draft, color: "#94a3b8" },
        ],
      });
    }

    if (selectedModules.includes("integrations") && metaAds?.spend !== undefined) {
      result.push({
        id: "meta-ads",
        label: "Meta Ads — Performance",
        module: "tracking",
        data: [
          { name: "Leads", value: metaAds.leads ?? 0, color: "#0082FB" },
          { name: "Cliques", value: metaAds.clicks ?? 0, color: "#3b82f6" },
        ],
      });
    }

    return result;
  }, [selectedModules, tracking, chat, forge, spacetime, nasaPost, metaAds]);

  // Pick first dataset if none selected
  const activeId = datasetId || datasets[0]?.id || "";
  const activeDataset = datasets.find((d) => d.id === activeId) ?? datasets[0];
  const chartData = activeDataset?.data ?? [];

  if (datasets.length === 0) return null;

  // Recharts needs objects with named keys for bar/line/area
  const rechartsData = chartData.map((d) => ({ name: d.name, value: d.value, fill: d.color }));

  const renderChart = () => {
    const h = 300;

    if (chartType === "pie") {
      return (
        <ResponsiveContainer width="100%" height={h}>
          <PieChart>
            <Pie data={rechartsData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine>
              {rechartsData.map((entry, i) => (
                <Cell key={i} fill={entry.fill ?? PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === "pictogram") {
      return <PictogramChart data={chartData} />;
    }

    if (chartType === "bar-horizontal") {
      return (
        <ResponsiveContainer width="100%" height={Math.max(h, chartData.length * 52)}>
          <BarChart data={rechartsData} layout="vertical" margin={{ left: 80, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="Valor" radius={[0, 6, 6, 0]}>
              {rechartsData.map((entry, i) => (
                <Cell key={i} fill={entry.fill ?? PALETTE[i % PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === "line") {
      return (
        <ResponsiveContainer width="100%" height={h}>
          <LineChart data={rechartsData} margin={{ left: 0, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={{ r: 5, fill: "#6366f1" }} name="Valor" />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === "area") {
      return (
        <ResponsiveContainer width="100%" height={h}>
          <AreaChart data={rechartsData} margin={{ left: 0, right: 20 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} fill="url(#areaGrad)" name="Valor" />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    // default: bar (colunas)
    return (
      <ResponsiveContainer width="100%" height={h}>
        <BarChart data={rechartsData} margin={{ left: 0, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" name="Valor" radius={[6, 6, 0, 0]}>
            {rechartsData.map((entry, i) => (
              <Cell key={i} fill={entry.fill ?? PALETTE[i % PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="w-full rounded-2xl border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold">Gráfico Personalizado</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Visualize e cruze indicadores dos apps selecionados</p>
        </div>

        {/* Dataset selector */}
        <select
          className="text-xs border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring max-w-xs"
          value={activeId}
          onChange={(e) => setDatasetId(e.target.value)}
        >
          {datasets.map((d) => (
            <option key={d.id} value={d.id}>{d.label}</option>
          ))}
        </select>
      </div>

      {/* Chart type pills */}
      <div className="flex flex-wrap gap-1.5">
        {CHART_TYPES.map((ct) => (
          <button
            key={ct.id}
            onClick={() => setChartType(ct.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium transition-colors",
              chartType === ct.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/40 text-muted-foreground hover:bg-muted",
            )}
          >
            <span className="font-mono">{ct.icon}</span>
            {ct.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="w-full">
        {renderChart()}
      </div>
    </div>
  );
}
