"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";

export function usePages() {
  return useQuery({
    ...orpc.pages.listPages.queryOptions({ input: {} }),
    staleTime: 10_000,
  });
}

export function usePagesCost() {
  return useQuery({
    ...orpc.pages.getCost.queryOptions({ input: {} }),
    staleTime: 30_000,
  });
}

export function usePage(id: string) {
  return useQuery({
    ...orpc.pages.getPage.queryOptions({ input: { id } }),
    enabled: !!id,
  });
}

export function usePageResources() {
  return useQuery({
    ...orpc.pages.getResources.queryOptions({ input: {} }),
    staleTime: 30_000,
  });
}
