"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { client, orpc } from "@/lib/orpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const formSchema = z
  .object({
    title: z.string().min(3, "Mínimo 3 caracteres").max(120),
    slug: z
      .string()
      .max(60)
      .regex(/^[a-z0-9-]*$/, "Só minúsculas, números e hífens")
      .optional()
      .or(z.literal("")),
    description: z.string().max(2000).optional().or(z.literal("")),
    coverUrl: z.string().url("URL inválida").optional().or(z.literal("")),
    startsAt: z.string().min(1, "Obrigatório"),
    endsAt: z.string().min(1, "Obrigatório"),
    capacity: z.coerce.number().int().min(2).max(50_000),
    isFree: z.boolean(),
    ticketPriceStars: z.coerce
      .number()
      .int()
      .min(0)
      .optional()
      .or(z.literal("")),
    ticketPriceBrl: z.coerce
      .number()
      .min(0)
      .optional()
      .or(z.literal("")),
    isPublic: z.boolean(),
    payoutPercent: z.coerce.number().int().min(0).max(95),
  })
  .refine(
    (data) => new Date(data.endsAt).getTime() > new Date(data.startsAt).getTime(),
    {
      message: "Fim precisa ser depois do início",
      path: ["endsAt"],
    },
  );

type FormData = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stationId: string;
  /** Quando passado, é modo edição. */
  editing?: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    coverUrl: string | null;
    startsAt: string;
    endsAt: string;
    capacity: number;
    isFree: boolean;
    ticketPriceStars: number | null;
    ticketPriceBrl: number | null;
    isPublic: boolean;
    payoutPercent: number;
  };
}

/**
 * Modal de criação/edição de WorldEvent.
 *
 * Cria através de `worldEvents.create` (que copia mapData do template
 * default — pode ser ajustado depois) ou edita via `worldEvents.update`.
 *
 * Validações cruzadas:
 *  - endsAt > startsAt (Zod refine).
 *  - Quando `isFree`, ignora os campos de preço.
 */
export function WorldEventForm({ open, onOpenChange, stationId, editing }: Props) {
  const qc = useQueryClient();
  const isEdit = !!editing;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      coverUrl: "",
      startsAt: "",
      endsAt: "",
      capacity: 200,
      isFree: false,
      ticketPriceStars: "" as unknown as number,
      ticketPriceBrl: "" as unknown as number,
      isPublic: true,
      payoutPercent: 90,
    },
  });

  // Hidrata em modo edição
  useEffect(() => {
    if (!open) return;
    if (isEdit && editing) {
      form.reset({
        title: editing.title,
        slug: editing.slug,
        description: editing.description ?? "",
        coverUrl: editing.coverUrl ?? "",
        startsAt: toDatetimeLocal(editing.startsAt),
        endsAt: toDatetimeLocal(editing.endsAt),
        capacity: editing.capacity,
        isFree: editing.isFree,
        ticketPriceStars: (editing.ticketPriceStars ?? "") as unknown as number,
        ticketPriceBrl: (editing.ticketPriceBrl ?? "") as unknown as number,
        isPublic: editing.isPublic,
        payoutPercent: editing.payoutPercent,
      });
    } else {
      form.reset({
        title: "",
        slug: "",
        description: "",
        coverUrl: "",
        startsAt: defaultStartsAt(),
        endsAt: defaultEndsAt(),
        capacity: 200,
        isFree: false,
        ticketPriceStars: "" as unknown as number,
        ticketPriceBrl: "" as unknown as number,
        isPublic: true,
        payoutPercent: 90,
      });
    }
  }, [open, isEdit, editing, form]);

  const createMut = useMutation({
    mutationFn: (input: Parameters<typeof client.worldEvents.create>[0]) =>
      client.worldEvents.create(input),
    onSuccess: () => {
      qc.invalidateQueries(orpc.worldEvents.list.queryOptions({ input: { stationId } }));
      toast.success("Evento criado!");
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erro ao criar evento");
    },
  });

  const updateMut = useMutation({
    mutationFn: (input: Parameters<typeof client.worldEvents.update>[0]) =>
      client.worldEvents.update(input),
    onSuccess: () => {
      qc.invalidateQueries(orpc.worldEvents.list.queryOptions({ input: { stationId } }));
      toast.success("Evento atualizado!");
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar");
    },
  });

  const submitting = createMut.isPending || updateMut.isPending;

  function onSubmit(data: FormData) {
    const startsAt = new Date(data.startsAt).toISOString();
    const endsAt = new Date(data.endsAt).toISOString();

    const ticketPriceStars =
      typeof data.ticketPriceStars === "number" ? data.ticketPriceStars : undefined;
    const ticketPriceBrl =
      typeof data.ticketPriceBrl === "number" ? data.ticketPriceBrl : undefined;

    if (isEdit && editing) {
      updateMut.mutate({
        id: editing.id,
        title: data.title,
        description: data.description || null,
        coverUrl: data.coverUrl || null,
        startsAt,
        endsAt,
        capacity: data.capacity,
        isFree: data.isFree,
        ticketPriceStars: data.isFree ? null : ticketPriceStars ?? null,
        ticketPriceBrl: data.isFree ? null : ticketPriceBrl ?? null,
        isPublic: data.isPublic,
        payoutPercent: data.payoutPercent,
      });
    } else {
      createMut.mutate({
        stationId,
        slug: data.slug || undefined,
        title: data.title,
        description: data.description || undefined,
        coverUrl: data.coverUrl || undefined,
        startsAt,
        endsAt,
        capacity: data.capacity,
        isFree: data.isFree,
        ticketPriceStars: data.isFree ? undefined : ticketPriceStars,
        ticketPriceBrl: data.isFree ? undefined : ticketPriceBrl,
        isPublic: data.isPublic,
        payoutPercent: data.payoutPercent,
      });
    }
  }

  const isFree = form.watch("isFree");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar evento" : "Novo WorldEvent"}
          </DialogTitle>
          <DialogDescription>
            Configure um evento timed dentro da sua Station — visitantes
            compram ingresso e entram pelo link público.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-3 text-sm"
        >
          {/* Título + slug */}
          <div>
            <Label htmlFor="title" className="text-xs">
              Título *
            </Label>
            <Input
              id="title"
              {...form.register("title")}
              placeholder="Ex: NASA Connect 2026"
              className="mt-1"
            />
            {form.formState.errors.title && (
              <p className="text-[11px] text-rose-400 mt-1">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          {!isEdit && (
            <div>
              <Label htmlFor="slug" className="text-xs">
                Slug (opcional)
              </Label>
              <Input
                id="slug"
                {...form.register("slug")}
                placeholder="auto-gerado se vazio"
                className="mt-1"
              />
              {form.formState.errors.slug && (
                <p className="text-[11px] text-rose-400 mt-1">
                  {form.formState.errors.slug.message}
                </p>
              )}
            </div>
          )}

          {/* Descrição */}
          <div>
            <Label htmlFor="description" className="text-xs">
              Descrição
            </Label>
            <Textarea
              id="description"
              {...form.register("description")}
              rows={3}
              className="mt-1 resize-none"
              placeholder="O que vai acontecer no evento…"
            />
          </div>

          {/* Cover URL */}
          <div>
            <Label htmlFor="coverUrl" className="text-xs">
              URL da imagem de capa
            </Label>
            <Input
              id="coverUrl"
              {...form.register("coverUrl")}
              placeholder="https://…"
              className="mt-1"
            />
            {form.formState.errors.coverUrl && (
              <p className="text-[11px] text-rose-400 mt-1">
                {form.formState.errors.coverUrl.message}
              </p>
            )}
          </div>

          {/* Janela */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="startsAt" className="text-xs">
                Início *
              </Label>
              <Input
                id="startsAt"
                type="datetime-local"
                {...form.register("startsAt")}
                className="mt-1"
              />
              {form.formState.errors.startsAt && (
                <p className="text-[11px] text-rose-400 mt-1">
                  {form.formState.errors.startsAt.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="endsAt" className="text-xs">
                Fim *
              </Label>
              <Input
                id="endsAt"
                type="datetime-local"
                {...form.register("endsAt")}
                className="mt-1"
              />
              {form.formState.errors.endsAt && (
                <p className="text-[11px] text-rose-400 mt-1">
                  {form.formState.errors.endsAt.message}
                </p>
              )}
            </div>
          </div>

          {/* Capacity */}
          <div>
            <Label htmlFor="capacity" className="text-xs">
              Capacidade *
            </Label>
            <Input
              id="capacity"
              type="number"
              min={2}
              max={50_000}
              {...form.register("capacity")}
              className="mt-1 max-w-[180px]"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              MVP estável até 200. Valores maiores precisam de SFU + sharding (PHASE 1+).
            </p>
          </div>

          {/* Pricing */}
          <div className="rounded-lg border border-zinc-700 bg-zinc-900/40 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isFree" className="text-xs font-semibold">
                  Evento gratuito
                </Label>
                <p className="text-[11px] text-zinc-500">
                  Visitantes entram com 1 clique, sem pagamento.
                </p>
              </div>
              <Switch
                id="isFree"
                checked={isFree}
                onCheckedChange={(v) => form.setValue("isFree", v)}
              />
            </div>

            {!isFree && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="ticketPriceStars" className="text-xs">
                    Preço em STARs
                  </Label>
                  <Input
                    id="ticketPriceStars"
                    type="number"
                    min={0}
                    {...form.register("ticketPriceStars")}
                    className="mt-1"
                    placeholder="Ex: 300"
                  />
                </div>
                <div>
                  <Label htmlFor="ticketPriceBrl" className="text-xs">
                    Preço em R$
                  </Label>
                  <Input
                    id="ticketPriceBrl"
                    type="number"
                    step="0.01"
                    min={0}
                    {...form.register("ticketPriceBrl")}
                    className="mt-1"
                    placeholder="Ex: 49.00"
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="payoutPercent" className="text-xs">
                % do payout pro organizador
              </Label>
              <Input
                id="payoutPercent"
                type="number"
                min={0}
                max={95}
                {...form.register("payoutPercent")}
                className="mt-1 max-w-[120px]"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Default 90% (NASA Route padrão). Plataforma fica com o resto.
              </p>
            </div>
          </div>

          {/* Public flag */}
          <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/40 p-3">
            <div>
              <Label htmlFor="isPublic" className="text-xs font-semibold">
                Evento público
              </Label>
              <p className="text-[11px] text-zinc-500">
                Aparece em listagens e na página `/eventos/&lt;slug&gt;`.
              </p>
            </div>
            <Switch
              id="isPublic"
              checked={form.watch("isPublic")}
              onCheckedChange={(v) => form.setValue("isPublic", v)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Salvando…"
                : isEdit
                  ? "Salvar mudanças"
                  : "Criar evento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function toDatetimeLocal(iso: string): string {
  // <input type="datetime-local"> espera "YYYY-MM-DDTHH:MM" em horário local.
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

function defaultStartsAt(): string {
  // Amanhã às 19:00 local
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(19, 0, 0, 0);
  return toDatetimeLocal(d.toISOString());
}

function defaultEndsAt(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(21, 0, 0, 0);
  return toDatetimeLocal(d.toISOString());
}
