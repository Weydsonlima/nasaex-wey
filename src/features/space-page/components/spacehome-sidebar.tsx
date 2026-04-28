"use client";

import Link from "next/link";
import { Rocket, type LucideIcon } from "lucide-react";

interface SidebarItem {
  key:      string;
  label:    string;
  icon:     LucideIcon;
  href?:    string;
  /** Quando true, item aparece esmaecido e sem ação (ex: visitante não pode entrar). */
  disabled?: boolean;
  /** Mensagem exibida no tooltip quando disabled. */
  disabledHint?: string;
}

interface Props {
  nick:                  string;
  isViewerAuthenticated: boolean;
  isViewerMember:        boolean;
}

/**
 * Menu lateral fixo da Spacehome — coluna estreita à esquerda com ícones de
 * acesso rápido. Por enquanto contém apenas o atalho para Space Station;
 * arquitetado para crescer (basta adicionar items na array `ITEMS`).
 */
export function SpacehomeSidebar({ nick, isViewerAuthenticated, isViewerMember }: Props) {
  const stationDisabled = !isViewerAuthenticated || !isViewerMember;
  const stationHint = !isViewerAuthenticated
    ? "Faça login para entrar"
    : !isViewerMember
      ? "Solicite acesso à empresa"
      : "";

  const items: SidebarItem[] = [
    {
      key:          "space-station",
      label:        "Space Station",
      icon:         Rocket,
      href:         `/station/${nick}`,
      disabled:     stationDisabled,
      disabledHint: stationHint,
    },
  ];

  return (
    <aside
      className="hidden md:flex fixed left-0 top-0 bottom-0 z-20 w-16 flex-col items-center gap-2 border-r border-white/5 bg-slate-950/80 backdrop-blur-md py-6 select-none"
      aria-label="Menu lateral da Spacehome"
    >
      {items.map((item) => (
        <SidebarIcon key={item.key} item={item} />
      ))}
    </aside>
  );
}

function SidebarIcon({ item }: { item: SidebarItem }) {
  const Icon = item.icon;
  const baseCls =
    "group relative flex h-11 w-11 items-center justify-center rounded-xl transition-all";
  const iconCls = "h-5 w-5 transition-transform group-hover:scale-110";

  const inner = (
    <>
      <Icon className={iconCls} />
      <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-white/10">
        {item.label}
        {item.disabled && item.disabledHint && (
          <span className="block text-[10px] text-amber-300 mt-0.5">{item.disabledHint}</span>
        )}
      </span>
    </>
  );

  if (item.disabled || !item.href) {
    return (
      <div
        className={`${baseCls} text-slate-600 cursor-not-allowed bg-white/[0.02]`}
        title={item.disabledHint ?? item.label}
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={`${baseCls} text-orange-300 hover:text-white hover:bg-orange-500/15 bg-orange-500/5`}
      title={item.label}
    >
      {inner}
    </Link>
  );
}
