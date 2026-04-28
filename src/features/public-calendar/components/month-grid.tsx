"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/pt-br";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { EVENT_CATEGORIES } from "../utils/categories";
import { imgSrc } from "../utils/img-src";
import type { PublicEvent } from "../types";

dayjs.locale("pt-br");

interface MonthGridProps {
  events: PublicEvent[];
  onSelect: (event: PublicEvent) => void;
  selectedId?: string | null;
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MAX_VISIBLE = 4;
// Altura visual do MiniCard (h-[52px])
const CARD_HEIGHT = 52;
// Gap vertical entre mini cards (0,1 × CARD_HEIGHT ≈ 5px)
const CARD_GAP = 5;
// Padding interno da célula até a borda (0,1 × CARD_HEIGHT ≈ 5px)
const CELL_PADDING = 5;
// Altura do botão "+X mais" (aparece abaixo do último card quando há overflow)
const PLUS_MORE_HEIGHT = 25;
// Altura mínima para linhas 100% vazias (apenas números de dia)
const EMPTY_ROW_HEIGHT = 56;

function MiniCard({
  ev,
  selected,
  onSelect,
}: {
  ev: PublicEvent;
  selected: boolean;
  onSelect: (e: PublicEvent) => void;
}) {
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

  return (
    <button
      type="button"
      onClick={() => onSelect(ev)}
      className={cn(
        "group relative h-[52px] w-full overflow-hidden rounded-md transition",
        selected
          ? "ring-2 ring-primary"
          : "hover:ring-2 hover:ring-primary/60",
      )}
    >
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

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-1.5 pb-1 pt-6">
        <div className="truncate text-[9px] font-bold leading-tight text-white drop-shadow">
          {ev.title}
        </div>
        <div className="text-[8px] font-medium text-white/90">
          {dayjs(ev.startDate).format("HH:mm")}
        </div>
      </div>
    </button>
  );
}

export function MonthGrid({ events, onSelect, selectedId }: MonthGridProps) {
  const [cursor, setCursor] = useState<Dayjs>(dayjs().startOf("month"));
  const gridRef = useRef<HTMLDivElement>(null);
  const todayCellRef = useRef<HTMLDivElement>(null);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, PublicEvent[]>();
    for (const ev of events) {
      if (!ev.startDate) continue;
      const key = dayjs(ev.startDate).format("YYYY-MM-DD");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    }
    return map;
  }, [events]);

  const grid = useMemo(() => {
    const startOfMonth = cursor.startOf("month");
    const firstDayOfGrid = startOfMonth.subtract(startOfMonth.day(), "day");
    const days: Dayjs[] = [];
    for (let i = 0; i < 42; i++) days.push(firstDayOfGrid.add(i, "day"));
    return days;
  }, [cursor]);

  // Altura de cada linha (semana) da grade:
  // - N = máximo de mini-cards visíveis em uma célula da linha (cap em MAX_VISIBLE)
  // - altura base = 2 × CELL_PADDING + N × CARD_HEIGHT + (N - 1) × CARD_GAP
  //   N=1 → 62  ·  N=2 → 119  ·  N=3 → 176  ·  N=4 → 233
  // - se algum dia da linha tem overflow (count > MAX_VISIBLE), soma CARD_GAP + PLUS_MORE_HEIGHT
  //   N=4 com overflow → 233 + 5 + 25 = 263
  // - linhas sem evento algum usam EMPTY_ROW_HEIGHT
  // - número do dia fica absolute (não consome altura)
  // Todas as 7 células da linha herdam essa altura (stretch default do CSS Grid).
  const rowHeights = useMemo(() => {
    const heights: number[] = [];
    for (let i = 0; i < grid.length; i += 7) {
      const row = grid.slice(i, i + 7);
      let maxCards = 0;
      let rowHasOverflow = false;
      for (const day of row) {
        const key = day.format("YYYY-MM-DD");
        const count = eventsByDay.get(key)?.length ?? 0;
        maxCards = Math.max(maxCards, Math.min(count, MAX_VISIBLE));
        if (count > MAX_VISIBLE) rowHasOverflow = true;
      }
      if (maxCards === 0) {
        heights.push(EMPTY_ROW_HEIGHT);
      } else {
        const base =
          2 * CELL_PADDING +
          maxCards * CARD_HEIGHT +
          (maxCards - 1) * CARD_GAP;
        heights.push(
          rowHasOverflow ? base + CARD_GAP + PLUS_MORE_HEIGHT : base,
        );
      }
    }
    return heights;
  }, [grid, eventsByDay]);

  const today = dayjs().startOf("day");

  // Scroll so today's row is at the top; past rows scroll above and hide
  useEffect(() => {
    const isCurrentMonth = cursor.isSame(dayjs(), "month");
    if (!isCurrentMonth) return;

    const timer = setTimeout(() => {
      if (todayCellRef.current && gridRef.current) {
        const cell = todayCellRef.current;
        const container = gridRef.current;
        const cellRect = cell.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const scrollTarget =
          container.scrollTop + (cellRect.top - containerRect.top) - 4;
        container.scrollTo({ top: Math.max(0, scrollTarget), behavior: "smooth" });
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [cursor]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-xl font-bold capitalize">
          <span>{cursor.format("MMMM")}</span>
          <span className="ml-2 font-normal text-muted-foreground">
            {cursor.format("YYYY")}
          </span>
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setCursor(dayjs().startOf("month"))}
          >
            Hoje
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCursor(cursor.subtract(1, "month"))}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCursor(cursor.add(1, "month"))}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 px-3">
        {WEEKDAYS.map((d, i) => (
          <div
            key={i}
            className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>

      {/*
        CSS Grid com alturas de linha explícitas:
        — altura da linha = (N+1) × CARD_HEIGHT, onde N = máx. de mini-cards na linha (cap MAX_VISIBLE)
        — linhas vazias usam EMPTY_ROW_HEIGHT
        — TODAS as 7 células da linha herdam a mesma altura (stretch default)
          garantindo que células vazias fiquem do mesmo tamanho das com eventos
      */}
      <div
        ref={gridRef}
        className="grid flex-1 grid-cols-7 gap-1 overflow-auto px-3 pb-3"
        style={{
          gridTemplateRows: rowHeights.map((h) => `${h}px`).join(" "),
          alignContent: "start",
        }}
      >
        {grid.map((day) => {
          const dayKey = day.format("YYYY-MM-DD");
          const dayEvents = eventsByDay.get(dayKey) ?? [];
          const isOutside = !day.isSame(cursor, "month");
          const isToday = day.isSame(today, "day");
          const overflow = dayEvents.length - MAX_VISIBLE;

          return (
            <div
              key={dayKey}
              ref={isToday ? todayCellRef : undefined}
              className={cn(
                "relative overflow-hidden rounded-lg",
                isToday
                  ? "bg-primary/15 ring-1 ring-primary/40"
                  : isOutside
                    ? "bg-violet-500/8"
                    : "bg-card/60",
              )}
              style={{ padding: `${CELL_PADDING}px` }}
            >
              {/* Número do dia — absolute, NÃO consome altura da cédula */}
              <div
                className={cn(
                  "pointer-events-none absolute left-[5px] top-[5px] z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold shadow-sm",
                  isToday && "bg-primary text-primary-foreground",
                  isOutside &&
                    !isToday &&
                    "bg-background/50 text-muted-foreground/50",
                  !isToday &&
                    !isOutside &&
                    "bg-background/85 text-foreground/90 backdrop-blur-sm",
                )}
              >
                {day.date()}
              </div>

              {/* Mini cards — gap de 0,1 × CARD_HEIGHT entre eles + "+X mais" no fluxo */}
              {dayEvents.length > 0 && (
                <div
                  className="flex h-full flex-col"
                  style={{ gap: `${CARD_GAP}px` }}
                >
                  {dayEvents.slice(0, MAX_VISIBLE).map((ev) => (
                    <MiniCard
                      key={ev.id}
                      ev={ev}
                      selected={selectedId === ev.id}
                      onSelect={onSelect}
                    />
                  ))}

                  {overflow > 0 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          style={{ height: `${PLUS_MORE_HEIGHT}px` }}
                          className="w-full shrink-0 rounded bg-muted/50 px-2 text-[11px] font-semibold text-foreground transition hover:bg-primary hover:text-primary-foreground"
                        >
                          +{overflow} mais
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-1" align="start">
                        <div className="flex flex-col gap-0.5">
                          {dayEvents.slice(MAX_VISIBLE).map((ev) => (
                            <button
                              key={ev.id}
                              type="button"
                              onClick={() => onSelect(ev)}
                              className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-xs transition hover:bg-muted"
                            >
                              <span className="truncate font-medium">
                                {ev.title}
                              </span>
                              <span className="ml-auto shrink-0 text-muted-foreground">
                                {dayjs(ev.startDate).format("HH:mm")}
                              </span>
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
