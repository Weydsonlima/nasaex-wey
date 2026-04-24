"use client";

import { useMemo, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { EventCard } from "./event-card";
import { EVENT_CATEGORIES } from "../utils/categories";
import { imgSrc } from "../utils/img-src";
import type { PublicEvent } from "../types";

dayjs.locale("pt-br");

interface MobileListProps {
  events: PublicEvent[];
  onSelect: (event: PublicEvent) => void;
}

function MiniThumb({ ev }: { ev: PublicEvent }) {
  const [coverFailed, setCoverFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const cat = ev.eventCategory
    ? EVENT_CATEGORIES.find((c) => c.value === ev.eventCategory)
    : null;

  const coverSrc = ev.coverImage && !coverFailed ? imgSrc(ev.coverImage) : null;
  const logoSrc =
    ev.organization?.logo && !logoFailed
      ? imgSrc(ev.organization.logo)
      : null;

  const start = ev.startDate ? dayjs(ev.startDate) : null;
  const end = ev.endDate ? dayjs(ev.endDate) : null;
  const timeLabel = start
    ? end
      ? `${start.format("HH:mm")} - ${end.format("HH:mm")}`
      : start.format("HH:mm")
    : null;

  return (
    <div className="relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-md">
      {coverSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverSrc}
          alt={ev.title}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setCoverFailed(true)}
        />
      ) : logoSrc ? (
        <>
          <div className="absolute inset-0 bg-card" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt={ev.organization?.name ?? ""}
            className="absolute inset-0 h-full w-full object-contain p-1"
            onError={() => setLogoFailed(true)}
          />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-violet-500/20 via-fuchsia-500/20 to-pink-500/20 text-sm">
          {cat?.emoji ?? "✨"}
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-0.5 pb-0.5 pt-2">
        <div className="truncate text-[7px] font-semibold leading-none text-white">
          {ev.title}
        </div>
        {timeLabel && (
          <div className="text-[6px] text-white/70">{timeLabel}</div>
        )}
      </div>
    </div>
  );
}

export function MobileList({ events, onSelect }: MobileListProps) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, PublicEvent[]>();
    for (const ev of events) {
      if (!ev.startDate) continue;
      const key = dayjs(ev.startDate).format("YYYY-MM-DD");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    }
    return Array.from(map.entries()).sort(([a], [b]) => (a > b ? 1 : -1));
  }, [events]);

  if (!grouped.length) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
        Nenhum evento encontrado com esses filtros.
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border/40">
      {grouped.map(([dayKey, dayEvents]) => {
        const d = dayjs(dayKey);
        const isExpanded = expandedDay === dayKey;

        return (
          <div key={dayKey}>
            <button
              type="button"
              onClick={() => setExpandedDay(isExpanded ? null : dayKey)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/30"
            >
              {/* Day number */}
              <div className="w-9 shrink-0 text-center text-3xl font-bold leading-none">
                {d.format("DD")}
              </div>

              {/* Day name + month */}
              <div className="w-24 shrink-0">
                <div className="text-sm font-semibold capitalize">
                  {d.format("dddd")}
                </div>
                <div className="text-xs capitalize text-muted-foreground">
                  {d.format("MMMM")}
                </div>
              </div>

              {/* Mini thumbnails */}
              <div className="flex flex-1 gap-1 overflow-hidden">
                {dayEvents.slice(0, 3).map((ev) => (
                  <MiniThumb key={ev.id} ev={ev} />
                ))}
                {dayEvents.length > 3 && (
                  <div className="flex h-[52px] w-[52px] items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                    +{dayEvents.length - 3}
                  </div>
                )}
              </div>

              {/* Chevron */}
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </button>

            {/* Expanded grid */}
            <div
              className={cn(
                "overflow-hidden transition-all duration-200",
                isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0",
              )}
            >
              <div className="grid grid-cols-2 gap-2 px-4 pb-4 pt-1 sm:grid-cols-3">
                {dayEvents.map((ev) => (
                  <EventCard key={ev.id} event={ev} onClick={() => onSelect(ev)} />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
