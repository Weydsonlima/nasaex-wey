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

interface MemberCard {
  nodeId:      string;
  userId:      string;
  displayName: string;
  image:       string | null;
  jobTitle:    string;
}

interface PyramidRow {
  depth:   number;
  members: MemberCard[];
}

/** Constrói pirâmide hierárquica: cada linha = profundidade no organograma. */
function buildPyramid(nodes: ChartNode[]): PyramidRow[] {
  const map = new Map<string, ChartNode>();
  nodes.forEach((n) => map.set(n.id, n));

  // Calcula profundidade subindo até a raiz
  const depthOf = (id: string, seen = new Set<string>()): number => {
    if (seen.has(id)) return 0;
    seen.add(id);
    const node = map.get(id);
    if (!node?.parentId || !map.has(node.parentId)) return 0;
    return 1 + depthOf(node.parentId, seen);
  };

  const grouped = new Map<number, MemberCard[]>();
  for (const n of nodes) {
    if (n.isOpenPosition || !n.user) continue;
    const d = depthOf(n.id);
    if (!grouped.has(d)) grouped.set(d, []);
    grouped.get(d)!.push({
      nodeId:      n.id,
      userId:      n.user.id,
      displayName: n.user.displayName ?? "Sem nome",
      image:       n.user.image,
      jobTitle:    n.customLabel || n.jobTitle.title,
    });
  }

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a - b)
    .map(([depth, members]) => ({ depth, members }));
}

/**
 * Tripulação no canto superior direito do banner — pirâmide hierárquica
 * onde cada linha representa um nível do organograma (topo = liderança,
 * descendo até as bases). Visual seguindo o mockup do usuário:
 * avatares grandes circulares com borda branca, nome em destaque e cargo
 * compacto logo abaixo.
 */
export function HeaderMembersHierarchy({ nick }: { nick: string }) {
  const { data, isLoading } = useQuery(
    orpc.public.space.getOrgChart.queryOptions({ input: { nick } }),
  );

  const rows = useMemo(() => buildPyramid(data?.nodes ?? []), [data]);
  const [openProfile, setOpenProfile] = useState<string | null>(null);

  if (isLoading || rows.length === 0) return null;

  return (
    <>
      <div
        className="hidden md:flex absolute right-6 top-6 max-w-[60%] flex-col items-end gap-5 pointer-events-auto"
        aria-label="Tripulação da empresa"
      >
        {rows.map((row) => (
          <div key={row.depth} className="flex flex-wrap justify-end gap-x-5 gap-y-3">
            {row.members.slice(0, 16).map((m) => (
              <CrewMember
                key={m.nodeId}
                member={m}
                onClick={() => setOpenProfile(m.userId)}
              />
            ))}
            {row.members.length > 16 && (
              <div className="flex h-12 w-12 items-center justify-center self-start rounded-full border border-white/20 bg-white/5 text-xs font-bold text-white/70">
                +{row.members.length - 16}
              </div>
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

function CrewMember({ member, onClick }: { member: MemberCard; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${member.displayName} — ${member.jobTitle}`}
      className="group flex flex-col items-center gap-1 transition-transform hover:scale-105 focus:outline-none"
    >
      <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-white/90 bg-slate-800 shadow-lg ring-0 transition group-hover:border-orange-300 group-hover:ring-2 group-hover:ring-orange-300/40">
        {member.image ? (
          <Image
            src={member.image}
            alt={member.displayName}
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white/80">
            {member.displayName[0]?.toUpperCase()}
          </div>
        )}
      </div>
      <span className="text-[12px] font-bold leading-tight text-white drop-shadow">
        {member.displayName.split(" ")[0]}
      </span>
      <span className="-mt-0.5 text-[10px] leading-tight text-white/70 drop-shadow">
        {member.jobTitle}
      </span>
    </button>
  );
}
