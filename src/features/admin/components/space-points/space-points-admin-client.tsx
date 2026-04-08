"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Search, ChevronRight, Users, Settings, BarChart2 } from "lucide-react";
import { OrgUsersTab } from "./org-users-tab";
import { OrgRulesTab } from "./org-rules-tab";

interface TopOrg { orgId: string; orgName: string; orgLogo: string | null; totalPoints: number; userCount: number }
interface OrgOption { id: string; name: string; slug: string }

function OrgPanel({ orgId, orgName }: { orgId: string; orgName: string }) {
  const [tab, setTab] = useState<"users" | "rules">("users");

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-800/50">
        <p className="text-sm font-semibold text-white">{orgName}</p>
        <div className="flex gap-1 bg-zinc-900 rounded-lg p-0.5">
          {([
            { key: "users", icon: Users,    label: "Usuários" },
            { key: "rules", icon: Settings, label: "Regras"   },
          ] as const).map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                tab === key ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white")}>
              <Icon className="w-3 h-3" />{label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4">
        {tab === "users" ? <OrgUsersTab orgId={orgId} /> : <OrgRulesTab orgId={orgId} />}
      </div>
    </div>
  );
}

interface Props { topOrgs: TopOrg[]; allOrgs: OrgOption[] }

export function SpacePointsAdminClient({ topOrgs, allOrgs }: Props) {
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [search, setSearch]           = useState("");

  const filteredOrgs   = allOrgs.filter((o) => !search || o.name.toLowerCase().includes(search.toLowerCase()));
  const selectedOrgName = allOrgs.find((o) => o.id === selectedOrg)?.name ?? "";

  return (
    <div className="grid grid-cols-[280px_1fr] gap-6">
      {/* Left: top orgs + selector */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Top Empresas</h2>
          <div className="space-y-1.5">
            {topOrgs.slice(0, 10).map((org, idx) => (
              <button key={org.orgId} onClick={() => setSelectedOrg(org.orgId)}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all",
                  selectedOrg === org.orgId ? "bg-violet-600/20 border border-violet-500/40" : "bg-zinc-900 border border-zinc-800 hover:bg-zinc-800")}>
                <span className="text-xs text-zinc-500 w-4 shrink-0">#{idx + 1}</span>
                {org.orgLogo ? (
                  <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0"><Image src={org.orgLogo} alt={org.orgName} fill className="object-cover" /></div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-violet-900 flex items-center justify-center text-[9px] text-white font-bold shrink-0">{org.orgName[0]}</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{org.orgName}</p>
                  <p className="text-[9px] text-zinc-500">{org.userCount} usuários</p>
                </div>
                <span className="text-[10px] font-bold text-violet-300 shrink-0">{org.totalPoints.toLocaleString("pt-BR")}</span>
                <ChevronRight className="w-3 h-3 text-zinc-600 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Todas as empresas</h2>
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar empresa..."
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-violet-500" />
          </div>
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {filteredOrgs.map((org) => (
              <button key={org.id} onClick={() => setSelectedOrg(org.id)}
                className={cn("w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all",
                  selectedOrg === org.id ? "bg-violet-600/20 text-violet-300" : "text-zinc-400 hover:bg-zinc-800 hover:text-white")}>
                <span className="text-xs truncate">{org.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: org panel */}
      <div>
        {selectedOrg ? (
          <OrgPanel orgId={selectedOrg} orgName={selectedOrgName} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center py-20 bg-zinc-900 border border-zinc-800 rounded-xl">
            <BarChart2 className="w-10 h-10 text-zinc-700 mb-3" />
            <p className="text-sm font-semibold text-zinc-400">Selecione uma empresa</p>
            <p className="text-xs text-zinc-600 mt-1">para ver usuários, pontos e gerenciar regras</p>
          </div>
        )}
      </div>
    </div>
  );
}
