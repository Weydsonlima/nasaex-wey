"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";

export function useIsModerator() {
  const { data } = useQuery({
    ...orpc.spaceHelp.checkModerator.queryOptions(),
    staleTime: 60_000,
  });
  return data?.isModerator ?? false;
}
