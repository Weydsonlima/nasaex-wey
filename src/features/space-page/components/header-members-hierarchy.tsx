"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { UserProfileDropdown } from "./user-profile-dropdown";

interface ChartNode {
  id:             string;
  parentId:       string | null;
  department:     string | null;
  customLabel:    string | null;
  jobTitle:       { id: string; title: string; category: string; level: number };
  user:           { id: string; displayName: string | null; image: string | null } | null;
  isOpenPosition: boolean;
}

interface MemberLevel {
  depth:   number;
  members: ChartNode[];
}

/** Calcula a profundidade de cada nó e agrupa por nível para renderizar pirâmide. */
function buildLevels(nodes: ChartNode[]): MemberLevel[] {
  const map = new Map<string, ChartNode>();
  nodes.forEach((n) => map.set(n.id, n));

  const depthOf = (id: string, seen = new Set<string>()): number => {
    if (seen.has(id)) return 0;
    seen.add(id);
    const node = map.get(id);
    if (!node || !node.parentId || !map.has(node.parentId)) return 0;
    return 1 + depthOf(node.parentId, seen);
  };

  const grouped = new Map<number, ChartNode[]>();
  for (const n of nodes) {
    if (n.isOpenPosition || !n.user) continue; // só mostra avatares reais
    const d = depthOf(n.id);
    if (!grouped.has(d)) grouped.set(d, []);
    grouped.get(d)!.push(n);
  }

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a - b)
    .map(([depth, members]) => ({ depth, members }));
}

/**
 * Renderiza a hierarquia de membros no canto superior direito do banner
 * da Spacehome (modelo pirâmide: topo = CEOs/fundadores, descendo até as
 * pontas operacionais). Cada avatar abre o profile dropdown ao clicar.
 */
export function HeaderMembersHierarchy({ nick }: { nick: string }) {
  const { data, isLoading } = useQuery(
    orpc.public.space.getOrgChart.queryOptions({ input: { nick } }),
  );

  const levels = useMemo(() => buildLevels(data?.nodes ?? []), [data]);
  const [openProfile, setOpenProfile] = useState<string | null>(null);

  if (isLoading || levels.length === 0) return null;

  return (
    <>
      <div
        className="hidden md:flex absolute right-4 top-4 max-w-[55%] flex-col items-end gap-2 pointer-events-auto"
        aria-label="Hierarquia de membros da empresa"
      >
        {levels.map((level) => (
          <div key={level.depth} className="flex flex-wrap justify-end gap-2">
            {level.members.slice(0, 12).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => m.user && setOpenProfile(m.user.id)}
                className="group flex flex-col items-center gap-0.5 transition-transform hover:scale-105"
                title={`${m.user?.displayName ?? ""} — ${m.jobTitle.title}`}
              >
                <div className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-white/40 bg-white/10 shadow-md group-hover:border-orange-400">
                  {m.user?.image ? (
                    <Image
                      src={m.user.image}
                      alt={m.user.displayName ?? ""}
                      fill
                      className="object-cover"
                      sizes="36px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[11px] font-bold text-white/80">
                      {m.user?.displayName?.[0] ?? "?"}
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-semibold leading-tight text-white drop-shadow">
                  {m.user?.displayName?.split(" ")[0] ?? ""}
                </span>
                <span className="text-[9px] leading-tight text-white/60 drop-shadow">
                  {m.jobTitle.title.length > 16
                    ? m.jobTitle.title.slice(0, 14) + "…"
                    : m.jobTitle.title}
                </span>
              </button>
            ))}
            {level.members.length > 12 && (
              <span className="self-center text-[10px] text-white/60">
                +{level.members.length - 12}
              </span>
            )}
          </div>
        ))}
      </div>

      {openProfile && (
        <UserProfileDropdown
          userId={openProfile}
          onClose={() => setOpenProfile(null)}
        />
      )}
    </>
  );
}
