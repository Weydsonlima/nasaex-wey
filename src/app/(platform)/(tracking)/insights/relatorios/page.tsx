import { HeaderTracking } from "@/features/leads/components/header-tracking";
import { InsightsTabsNav } from "@/features/insights/components/insights-tabs-nav";
import { FileBarChart2 } from "lucide-react";

export default function RelatoriosPage() {
  return (
    <div className="flex flex-col h-full w-full">
      <HeaderTracking title="Insights" />
      <InsightsTabsNav />
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-24 text-center max-w-xl mx-auto">
        <div className="size-14 rounded-full bg-violet-100 flex items-center justify-center">
          <FileBarChart2 className="size-7 text-violet-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Relatórios salvos</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Em breve você poderá criar relatórios personalizados, salvar
            snapshots, compartilhar via link, baixar em PDF e cruzar dados
            entre relatórios diferentes.
          </p>
        </div>
      </div>
    </div>
  );
}
