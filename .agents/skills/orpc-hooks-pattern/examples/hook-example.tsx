"use client";

import { orpc } from "../../../../src/lib/orpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Example hook for managing a specific entity (e.g., Lead)
 * Naming convention: use-<entity>
 */

export function useLeads(trackingId?: string) {
  // Query to list leads
  const { data, isLoading } = useQuery(
    orpc.leads.listLeadsByStatus.queryOptions({
      input: trackingId ? { trackingId } : undefined,
    }),
  );

  return {
    leads: data ?? [],
    isLoading,
  };
}

export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation(
    orpc.leads.create.mutationOptions({
      onSuccess: () => {
        // Invalidate relevant queries to refresh the UI
        queryClient.invalidateQueries({
          queryKey: orpc.leads.listLeadsByStatus.queryKey(),
        });
        toast.success("Lead criado com sucesso!");
      },
      onError: () => {
        toast.error(
          "Erro ao criar lead. Verifique os dados e tente novamente.",
        );
      },
    }),
  );
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();

  return useMutation(
    orpc.leads.updateStatus.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.leads.listLeadsByStatus.queryKey(),
        });
        toast.success("Status do lead atualizado!");
      },
      onError: () => {
        toast.error("Não foi possível atualizar o status.");
      },
    }),
  );
}
