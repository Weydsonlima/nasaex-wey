"use client";

import { CalendarIcon, XIcon } from "lucide-react";
import { AllAppointmentsCalendar } from "@/features/agenda/components/all-appointments-calendar";

// ─── Main Component ──────────────────────────────────────────────────────────

interface AgendaPanelProps {
  onClose: () => void;
}

export function AgendaPanel({ onClose }: AgendaPanelProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />

      {/*
        Painel:
        - Mobile: 90vw de largura, 85vh de altura, fixado na parte inferior
        - Desktop (lg+): 70vw de largura, 80vh de altura, centralizado na tela
      */}
      <div
        className="
          fixed z-50
          w-[90vw] h-[85vh]
          lg:w-[70vw] lg:h-[80vh]
          bg-background border border-border shadow-2xl flex flex-col overflow-hidden
          bottom-0 left-1/2 -translate-x-1/2 rounded-t-2xl
          lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 lg:rounded-2xl
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <CalendarIcon className="size-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Todos os agendamentos</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        {/* Calendário — idêntico à tela de Agenda */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <AllAppointmentsCalendar />
        </div>
      </div>
    </>
  );
}
