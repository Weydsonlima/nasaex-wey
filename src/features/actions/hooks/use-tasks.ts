import { orpc } from "@/lib/orpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.action.create.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries(
          orpc.workspace.getColumnsByWorkspace.queryOptions({
            input: {
              workspaceId: data.action.workspaceId,
            },
          }),
        );

        queryClient.invalidateQueries(
          orpc.action.listByColumn.queryOptions({
            input: {
              columnId: data.action.columnId ?? "",
            },
          }),
        );
      },
    }),
  );
};

export const useListActionByColumn = (columnId: string) => {
  const { data, isLoading } = useQuery(
    orpc.action.listByColumn.queryOptions({
      input: {
        columnId,
      },
    }),
  );

  return {
    actions: data?.action ?? [],
    isLoading,
  };
};

export const useListActionByWorkspace = (workspaceId: string) => {
  const { data, isLoading } = useQuery(
    orpc.action.listByWorkspace.queryOptions({
      input: {
        workspaceId,
      },
    }),
  );

  return {
    actions: data?.action ?? [],
    isLoading,
  };
};
