"use client";

import { BellIcon, XIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReminderRecurrenceType } from "@/generated/prisma/enums";
import { Spinner } from "@/components/ui/spinner";

const formSchema = z.object({
  message: z.string().min(1, "Mensagem obrigatória"),
  recurrenceType: z.nativeEnum(ReminderRecurrenceType),
  dayOfMonth: z.coerce.number().min(1).max(28).optional(),
  remindTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  firstRemindAt: z.string().min(1, "Data obrigatória"),
  notifyPhone: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ReminderPanelProps {
  onClose: () => void;
  conversationId?: string;
  leadId?: string;
  trackingId?: string;
  lead: { name: string };
}

const RECURRENCE_LABELS: Record<ReminderRecurrenceType, string> = {
  [ReminderRecurrenceType.ONCE]: "Único",
  [ReminderRecurrenceType.WEEKLY]: "Semanal",
  [ReminderRecurrenceType.BIWEEKLY]: "Quinzenal",
  [ReminderRecurrenceType.MONTHLY]: "Mensal",
};

export function ReminderPanel({
  onClose,
  conversationId,
  leadId,
  trackingId,
  lead,
}: ReminderPanelProps) {
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
      recurrenceType: ReminderRecurrenceType.ONCE,
      remindTime: "09:00",
      firstRemindAt: new Date().toISOString().split("T")[0],
      notifyPhone: "",
    },
  });

  const recurrenceType = form.watch("recurrenceType");
  const isMonthly = recurrenceType === ReminderRecurrenceType.MONTHLY;

  const mutation = useMutation({
    ...orpc.reminder.create.mutationOptions(),
    onSuccess: () => {
      toast.success("Lembrete criado com sucesso!");
      queryClient.invalidateQueries(
        orpc.reminder.list.queryOptions({ input: { conversationId } }),
      );
      onClose();
    },
    onError: () => {
      toast.error("Erro ao criar lembrete.");
    },
  });

  const onSubmit = (values: FormValues) => {
    const firstRemindAtISO = new Date(
      `${values.firstRemindAt}T${values.remindTime}:00`,
    ).toISOString();

    mutation.mutate({
      message: values.message,
      recurrenceType: values.recurrenceType,
      dayOfMonth: isMonthly && values.dayOfMonth ? values.dayOfMonth : undefined,
      remindTime: values.remindTime,
      firstRemindAt: firstRemindAtISO,
      notifyPhone: values.notifyPhone || undefined,
      conversationId,
      leadId,
      trackingId,
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />

      <div className="fixed z-50 w-[90vw] max-w-md bg-background border border-border shadow-2xl flex flex-col overflow-hidden bottom-0 left-1/2 -translate-x-1/2 rounded-t-2xl lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 lg:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <BellIcon className="size-4 text-muted-foreground" />
            <span className="text-sm font-semibold">
              Lembrete — {lead.name}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4 px-5 py-4 overflow-y-auto"
        >
          {/* Mensagem */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="message">Mensagem do lembrete</Label>
            <Textarea
              id="message"
              placeholder="Ex: Cobrar pagamento da proposta #123"
              className="resize-none"
              rows={3}
              {...form.register("message")}
            />
            {form.formState.errors.message && (
              <p className="text-xs text-destructive">
                {form.formState.errors.message.message}
              </p>
            )}
          </div>

          {/* Data e horário */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="firstRemindAt">Data</Label>
              <Input
                id="firstRemindAt"
                type="date"
                {...form.register("firstRemindAt")}
              />
              {form.formState.errors.firstRemindAt && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.firstRemindAt.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="remindTime">Horário</Label>
              <Input
                id="remindTime"
                type="time"
                {...form.register("remindTime")}
              />
            </div>
          </div>

          {/* Recorrência */}
          <div className="flex flex-col gap-1.5">
            <Label>Recorrência</Label>
            <Select
              value={recurrenceType}
              onValueChange={(v) =>
                form.setValue("recurrenceType", v as ReminderRecurrenceType)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RECURRENCE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dia do mês — aparece só quando recorrência = MONTHLY */}
          {isMonthly && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dayOfMonth">
                Dia fixo do mês{" "}
                <span className="text-muted-foreground text-xs">(1–28, opcional)</span>
              </Label>
              <Input
                id="dayOfMonth"
                type="number"
                min={1}
                max={28}
                placeholder="Ex: 15"
                {...form.register("dayOfMonth")}
              />
            </div>
          )}

          {/* Telefone para notificação */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notifyPhone">
              WhatsApp para notificar{" "}
              <span className="text-muted-foreground text-xs">(com DDI, ex: 5511999887766)</span>
            </Label>
            <Input
              id="notifyPhone"
              type="tel"
              placeholder="5511999887766"
              {...form.register("notifyPhone")}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1 pb-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={mutation.isPending}>
              {mutation.isPending && <Spinner className="size-3 mr-1" />}
              Salvar lembrete
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
