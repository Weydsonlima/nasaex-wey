"use client";

import { orpc } from "@/lib/orpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface UseListRemindersOptions {
  conversationId?: string;
  leadId?: string;
  trackingId?: string;
}

export function useListReminders({
  conversationId,
  leadId,
  trackingId,
}: UseListRemindersOptions) {
  return useQuery(
    orpc.reminder.list.queryOptions({
      input: { conversationId, leadId, trackingId },
    })
  );
}

export function useCreateReminder({
  conversationId,
  leadId,
  trackingId,
}: UseListRemindersOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    ...orpc.reminder.create.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(
        orpc.reminder.list.queryOptions({
          input: { conversationId, leadId, trackingId },
        })
      );
      toast.success("Lembrete criado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao criar lembrete.");
    },
  });
}

export function useDeleteReminder({
  conversationId,
  leadId,
  trackingId,
}: UseListRemindersOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    ...orpc.reminder.delete.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(
        orpc.reminder.list.queryOptions({
          input: { conversationId, leadId, trackingId },
        })
      );
      toast.success("Lembrete removido com sucesso");
    },
    onError: () => {
      toast.error("Erro ao remover lembrete");
    },
  });
}
