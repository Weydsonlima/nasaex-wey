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
        CSS Grid with gridAutoRows: minmax(56px, auto)
        — empty rows: exactly 56px (compact, just the day number)
        — rows with events: grow to fit tallest cell naturally
        — ALL cells in the same row STRETCH to the row height (default Grid behavior)
          so every sibling cell fills with its background colour, matching the event cell's height
      */}
      <div
        ref={gridRef}
        className="grid flex-1 grid-cols-7 gap-1 overflow-auto px-3 pb-3"
        style={{ gridAutoRows: "minmax(56px, auto)", alignContent: "start" }}
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
                "flex flex-col gap-1 rounded-lg p-1.5",
                isToday
                  ? "bg-primary/15 ring-1 ring-primary/40"
                  : isOutside
                    ? "bg-violet-500/8"
                    : "bg-card/60",
              )}
            >
              {/* Day number */}
              <div
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  isToday && "bg-primary text-primary-foreground",
                  isOutside && !isToday && "text-muted-foreground/40",
                  !isToday && !isOutside && "text-foreground/80",
                )}
              >
                {day.date()}
              </div>

              {/* Events — up to MAX_VISIBLE, rest in popover */}
              {dayEvents.length > 0 && (
                <div className="flex flex-col gap-0.5">
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
                          className="w-full rounded px-0.5 text-left text-[9px] text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
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
