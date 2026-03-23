"use client";
import { orpc } from "@/lib/orpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface UseListWidgetsOptions {
  organizationId: string[];
}

export const useQueryListWidgets = ({
  organizationId,
}: UseListWidgetsOptions) => {
  const { data, ...query } = useQuery(
    orpc.widgets.list.queryOptions({
      input: {
        organizationIds: organizationId,
      },
    }),
  );

  return {
    widgets: data ?? [],
    ...query,
  };
};

interface UseWidgetByTagOptions {
  tagId: string;
  organizationId: string;
}

export const useQueryWidgetByTag = ({
  tagId,
  organizationId,
}: UseWidgetByTagOptions) => {
  const { data, ...query } = useQuery(
    orpc.widgets.byTag.queryOptions({
      input: {
        tagId,
        organizationId,
      },
      enabled: !!tagId && !!organizationId,
    }),
  );

  return {
    data,
    ...query,
  };
};

export const useMutationCreateWidget = () => {
  const queryClient = useQueryClient();

  return useMutation(
    orpc.widgets.create.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: orpc.widgets.list.queryKey({
            input: { organizationIds: [data.organizationId] },
          }),
        });
      },
    }),
  );
};

export const useMutationUpdateWidget = () => {
  const queryClient = useQueryClient();

  return useMutation(
    orpc.widgets.update.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: orpc.widgets.list.queryKey({
            input: { organizationIds: [data.organizationId] },
          }),
        });
      },
    }),
  );
};

export const useMutationDeleteWidget = (organizationIds: string[]) => {
  const queryClient = useQueryClient();

  return useMutation(
    orpc.widgets.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.widgets.list.queryKey({
            input: {
              organizationIds:
                organizationIds.length === 0 ? organizationIds : [],
            },
          }),
        });
      },
    }),
  );
};
