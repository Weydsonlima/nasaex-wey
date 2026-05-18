"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Ticket,
  Plus,
  ExternalLink,
  Edit3,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { WorldEventForm } from "./world-event-form";

interface Props {
  /** ID da Station onde os eventos serão criados/listados. */
  stationId: string;
}

/**
 * Card de administração de WorldEvents dentro do painel da Station.
 *
 * Mostra eventos da station + botão "Criar evento" + edit por linha.
 * Reusa `<WorldEventForm>` pra create/edit.
 */
export function WorldEventsManager({ stationId }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  // null = criar; objeto = editar
  const [editing, setEditing] = useState<
    Parameters<typeof WorldEventForm>[0]["editing"] | null
  >(null);

  const q = useQuery(
    orpc.worldEvents.list.queryOptions({
      input: { stationId, page: 1, pageSize: 20 },
    }),
  );

  const events = q.data?.items ?? [];

  return (
    <>
      <Card className="bg-slate-900 border-white/10">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-indigo-400" />
              Eventos (Convenções, Auditórios)
            </CardTitle>
            <CardDescription>
              Crie eventos timed dentro da sua Station — venda ingressos
              em STARs ou R$ e receba visitantes no seu World.
            </CardDescription>
          </div>
          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Novo evento
          </Button>
        </CardHeader>

        <CardContent>
          {q.isLoading ? (
            <div className="text-xs text-slate-500">Carregando…</div>
          ) : events.length === 0 ? (
            <EmptyState onCreate={() => { setEditing(null); setFormOpen(true); }} />
          ) : (
            <div className="rounded-lg border border-white/10 divide-y divide-white/10">
              {events.map((e) => (
                <EventRow
                  key={e.id}
                  event={e}
                  onEdit={() => {
                    // Buscar dados completos seria ideal; pra MVP usamos os dados da list.
                    setEditing({
                      id: e.id,
                      title: e.title,
                      slug: e.slug,
                      description: e.description,
                      coverUrl: e.coverUrl,
                      startsAt: e.startsAt,
                      endsAt: e.endsAt,
                      capacity: e.capacity,
                      isFree: e.isFree,
                      ticketPriceStars: e.ticketPriceStars,
                      ticketPriceBrl: e.ticketPriceBrl,
                      isPublic: e.isPublic,
                      // payoutPercent não vem no `list` — default razoável.
                      payoutPercent: 90,
                    });
                    setFormOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <WorldEventForm
        open={formOpen}
        onOpenChange={setFormOpen}
        stationId={stationId}
        editing={editing ?? undefined}
      />
    </>
  );
}

interface EventListItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  startsAt: string;
  endsAt: string;
  capacity: number;
  currentOccupancy: number;
  isFree: boolean;
  isPublic: boolean;
  ticketPriceStars: number | null;
  ticketPriceBrl: number | null;
  status: string;
}

function EventRow({
  event,
  onEdit,
}: {
  event: EventListItem;
  onEdit: () => void;
}) {
  const utilization =
    event.capacity > 0
      ? Math.round((event.currentOccupancy / event.capacity) * 100)
      : 0;
  const statusColor =
    event.status === "LIVE"
      ? "text-emerald-400"
      : event.status === "ENDED"
        ? "text-zinc-500"
        : event.status === "CANCELLED"
          ? "text-rose-400"
          : "text-amber-400";
  const statusLabel =
    event.status === "LIVE"
      ? "● Ao vivo"
      : event.status === "SCHEDULED"
        ? "● Agendado"
        : event.status === "ENDED"
          ? "○ Encerrado"
          : "○ Cancelado";

  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-white truncate">
            {event.title}
          </span>
          <span className={`text-[10px] font-semibold ${statusColor}`}>
            {statusLabel}
          </span>
          {event.isFree && (
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              Grátis
            </span>
          )}
          {!event.isPublic && (
            <span className="text-[10px] text-zinc-400 bg-zinc-800/60 px-1.5 py-0.5 rounded">
              Privado
            </span>
          )}
        </div>
        <div className="text-[11px] text-zinc-500 mt-0.5 flex flex-wrap gap-x-2">
          <span>
            {format(new Date(event.startsAt), "dd MMM · HH:mm", { locale: ptBR })}
            {" → "}
            {format(new Date(event.endsAt), "dd MMM · HH:mm", { locale: ptBR })}
          </span>
          <span>
            <Ticket className="inline w-3 h-3 mr-0.5" />
            {event.currentOccupancy}/{event.capacity}
            {utilization >= 80 && (
              <span className="ml-1 text-amber-400">({utilization}%)</span>
            )}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {event.isPublic && (
          <Button
            size="sm"
            variant="ghost"
            asChild
            className="h-7 px-2 text-zinc-400 hover:text-zinc-100"
          >
            <Link
              href={`/eventos/${event.slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-3 h-3" />
            </Link>
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={onEdit}
          className="h-7 px-2 text-zinc-400 hover:text-zinc-100"
        >
          <Edit3 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="p-3 rounded-full bg-indigo-600/10 mb-3">
        <Sparkles className="h-5 w-5 text-indigo-400" />
      </div>
      <p className="text-sm font-medium text-zinc-200">
        Sem eventos ainda
      </p>
      <p className="text-xs text-zinc-500 mt-1 max-w-sm">
        Crie um WorldEvent pra hospedar uma feira, palestra ou auditório
        virtual dentro da sua Station. Venda ingressos em STARs ou R$.
      </p>
      <Button
        size="sm"
        onClick={onCreate}
        className="mt-4 bg-indigo-600 hover:bg-indigo-700"
      >
        <Plus className="h-3.5 w-3.5 mr-1" />
        Criar primeiro evento
      </Button>
    </div>
  );
}
