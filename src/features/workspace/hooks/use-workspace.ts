import { orpc } from "@/lib/orpc";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";

export const useSuspenseWokspaces = () => {
  return useSuspenseQuery(orpc.workspace.list.queryOptions());
};

export const useCreateWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation(
    orpc.workspace.create.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Workspace ${data.workspace.name} criado com sucesso!`);

        queryClient.invalidateQueries(orpc.workspace.list.queryOptions());
      },
      onError: () => {
        toast.error("Erro ao criar workspace!");
      },
    }),
  );
};

export const useSuspenseColumnsByWorkspace = (workspaceId: string) => {
  return useSuspenseQuery(
    orpc.workspace.getColumnsByWorkspace.queryOptions({
      input: { workspaceId },
    }),
  );
};

export const useColumnsByWorkspace = (workspaceId: string) => {
  const { data, isLoading } = useQuery(
    orpc.workspace.getColumnsByWorkspace.queryOptions({
      input: { workspaceId },
      enabled: !!workspaceId,
    }),
  );

  return {
    columns: data?.columns ?? [],
    isLoading,
  };
};

export const useWorkspaceMembers = (workspaceId: string) => {
  const { data, isLoading } = useQuery(
    orpc.workspace.getMembers.queryOptions({
      input: { workspaceId },
      enabled: !!workspaceId,
    }),
  );

  return {
    members: data?.members ?? [],
    isLoading,
  };
};
