"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  FilterIcon,
  CheckSquareIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWorkspaceCalendar } from "@/features/actions/hooks/use-tasks";
import { ViewActionModal } from "@/features/actions/components/view-action-modal";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const PALETTE = [
  "#7c3aed", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#84cc16", "#f97316", "#ec4899",
  "#14b8a6", "#a855f7",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkspaceCalendarModal({ open, onOpenChange }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedWorkspaceIds, setSelectedWorkspaceIds] = useState<Set<string>>(new Set());
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);

  const startDate = new Date(year, month, 1).toISOString().slice(0, 10);
  const endDate = new Date(year, month + 1, 0).toISOString().slice(0, 10);

  const { actions, isLoading } = useWorkspaceCalendar({ startDate, endDate });

  const workspaces = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    actions.forEach((a) => {
      if (a.workspaceId && a.workspace) {
        map.set(a.workspaceId, { id: a.workspaceId, name: a.workspace.name });
      }
    });
    return Array.from(map.values());
  }, [actions]);

  const workspaceColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    workspaces.forEach((ws, i) => {
      map[ws.id] = PALETTE[i % PALETTE.length];
    });
    return map;
  }, [workspaces]);

  const filteredActions = useMemo(() => {
    if (selectedWorkspaceIds.size === 0) return actions;
    return actions.filter((a) => a.workspaceId && selectedWorkspaceIds.has(a.workspaceId));
  }, [actions, selectedWorkspaceIds]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const toggleWorkspace = (id: string) => {
    setSelectedWorkspaceIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Build day grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDay)
    .fill(null)
    .concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
  while (cells.length % 7 !== 0) cells.push(null);

  const getActionsForDay = (day: number) => {
    return filteredActions.filter((a) => {
      const dateStr = a.dueDate || a.startDate;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return (
        d.getFullYear() === year &&
        d.getMonth() === month &&
        d.getDate() === day
      );
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl w-full h-[85vh] p-0 flex flex-col overflow-hidden">
          <DialogTitle className="sr-only">Calendário Workspace</DialogTitle>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b shrink-0">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center">
                <CalendarIcon className="size-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Calendário Workspace</h1>
                <p className="text-sm text-muted-foreground">
                  Visão consolidada de todas as ações que você participa
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Workspace Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <FilterIcon className="size-3.5" />
                    Filtrar
                    {selectedWorkspaceIds.size > 0 && (
                      <Badge className="h-4 px-1 text-xs">
                        {selectedWorkspaceIds.size}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72" align="end">
                  <p className="text-sm font-medium mb-3">Filtrar por workspace</p>
                  {workspaces.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhum workspace</p>
                  ) : (
                    <div className="space-y-2">
                      {workspaces.map((ws) => (
                        <div key={ws.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`filter-ws-${ws.id}`}
                            checked={selectedWorkspaceIds.has(ws.id)}
                            onCheckedChange={() => toggleWorkspace(ws.id)}
                          />
                          <div
                            className="size-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: workspaceColorMap[ws.id] }}
                          />
                          <Label
                            htmlFor={`filter-ws-${ws.id}`}
                            className="text-sm cursor-pointer truncate"
                          >
                            {ws.name}
                          </Label>
                        </div>
                      ))}
                      {selectedWorkspaceIds.size > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-1 h-7 text-xs"
                          onClick={() => setSelectedWorkspaceIds(new Set())}
                        >
                          Limpar filtros
                        </Button>
                      )}
                    </div>
                  )}
                </PopoverContent>
              </Popover>

              {/* Month navigation */}
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="size-8" onClick={prevMonth}>
                  <ChevronLeftIcon className="size-4" />
                </Button>
                <span className="text-sm font-medium min-w-[140px] text-center">
                  {MONTH_NAMES[month]} {year}
                </span>
                <Button variant="ghost" size="icon" className="size-8" onClick={nextMonth}>
                  <ChevronRightIcon className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Legend */}
          {workspaces.length > 0 && (
            <div className="flex items-center gap-3 px-6 py-2 border-b flex-wrap shrink-0">
              {workspaces.map((ws) => (
                <div key={ws.id} className="flex items-center gap-1.5 text-xs">
                  <div
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: workspaceColorMap[ws.id] }}
                  />
                  <span className="text-muted-foreground">{ws.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Calendar grid */}
          <div className="flex-1 p-4 overflow-auto">
            {isLoading ? (
              <div className="grid grid-cols-7 gap-1">
                {Array(35)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-lg" />
                  ))}
              </div>
            ) : (
              <>
                {/* Day names */}
                <div className="grid grid-cols-7 mb-1">
                  {DAY_NAMES.map((d) => (
                    <div
                      key={d}
                      className="text-center text-xs font-medium text-muted-foreground py-1"
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {/* Weeks */}
                <div className="grid grid-cols-7 gap-1">
                  {cells.map((day, idx) => {
                    const isToday =
                      day !== null &&
                      day === today.getDate() &&
                      month === today.getMonth() &&
                      year === today.getFullYear();
                    const dayActions = day !== null ? getActionsForDay(day) : [];

                    return (
                      <div
                        key={idx}
                        className={cn(
                          "min-h-24 border rounded-lg p-1.5 transition-colors",
                          day
                            ? "hover:bg-muted/30"
                            : "opacity-0 pointer-events-none",
                          isToday &&
                            "border-violet-400 bg-violet-50 dark:bg-violet-950/20",
                        )}
                      >
                        {day !== null && (
                          <>
                            <div
                              className={cn(
                                "text-xs font-medium mb-1 w-5 h-5 flex items-center justify-center rounded-full",
                                isToday
                                  ? "bg-violet-600 text-white"
                                  : "text-muted-foreground",
                              )}
                            >
                              {day}
                            </div>
                            <div className="space-y-0.5">
                              {dayActions.slice(0, 3).map((action) => (
                                <button
                                  key={action.id}
                                  type="button"
                                  onClick={() => setSelectedActionId(action.id)}
                                  className="w-full text-left text-xs px-1 py-0.5 rounded truncate text-white font-medium hover:opacity-80 transition-opacity"
                                  style={{
                                    backgroundColor:
                                      action.workspaceId
                                        ? (workspaceColorMap[action.workspaceId] ?? "#7c3aed")
                                        : "#7c3aed",
                                  }}
                                  title={action.title}
                                >
                                  {action.isDone ? "✓ " : ""}
                                  {action.title}
                                </button>
                              ))}
                              {dayActions.length > 3 && (
                                <div className="text-xs text-muted-foreground px-1">
                                  +{dayActions.length - 3} mais
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Summary */}
          <div className="border-t px-6 py-3 flex items-center gap-6 text-xs text-muted-foreground shrink-0">
            <div className="flex items-center gap-1.5">
              <CheckSquareIcon className="size-3.5" />
              {filteredActions.length} ações no mês
            </div>
            <div className="flex items-center gap-1.5">
              <CalendarIcon className="size-3.5" />
              {workspaces.length} workspaces
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedActionId && (
        <ViewActionModal
          actionId={selectedActionId}
          open={!!selectedActionId}
          onOpenChange={(v) => { if (!v) setSelectedActionId(null); }}
        />
      )}
    </>
  );
}
