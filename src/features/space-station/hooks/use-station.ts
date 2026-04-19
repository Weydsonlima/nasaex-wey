"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";

export function useStationByNick(nick: string) {
  return useQuery(
    orpc.spaceStation.getByNick.queryOptions({ nick }),
  );
}

export function useMyStation(type: "USER" | "ORG") {
  return useQuery(
    orpc.spaceStation.getMy.queryOptions({ type }),
  );
}

export function useListStations(params?: { search?: string; type?: "USER" | "ORG"; page?: number }) {
  return useQuery(
    orpc.spaceStation.list.queryOptions({ page: 1, limit: 20, ...params }),
  );
}

export function useOrgChart(nick: string) {
  return useQuery(
    orpc.spaceStation.getOrgChart.queryOptions({ nick }),
  );
}

export function useCreateStation() {
  const qc = useQueryClient();
  return useMutation({
    ...orpc.spaceStation.create.mutationOptions(),
    onSuccess: () => qc.invalidateQueries(orpc.spaceStation.getMy.queryOptions({ type: "ORG" })),
  });
}

export function useUpdateStation() {
  const qc = useQueryClient();
  return useMutation({
    ...orpc.spaceStation.update.mutationOptions(),
    onSuccess: () => qc.invalidateQueries(orpc.spaceStation.getMy.queryOptions({ type: "ORG" })),
  });
}

export function useSendStar() {
  const qc = useQueryClient();
  return useMutation({
    ...orpc.spaceStation.sendStar.mutationOptions(),
    onSuccess: () => qc.invalidateQueries(),
  });
}

export function useUpdateWorld() {
  const qc = useQueryClient();
  return useMutation({
    ...orpc.spaceStation.updateWorld.mutationOptions(),
    onSuccess: () => qc.invalidateQueries(orpc.spaceStation.getMy.queryOptions({ type: "ORG" })),
  });
}

export function useUpdateModules() {
  const qc = useQueryClient();
  return useMutation({
    ...orpc.spaceStation.updateModules.mutationOptions(),
    onSuccess: () => qc.invalidateQueries(orpc.spaceStation.getMy.queryOptions({ type: "ORG" })),
  });
}

import type { WorldAssetType } from "../types";

export function useWorldAssets(type?: WorldAssetType) {
  return useQuery(
    orpc.spaceStation.listWorldAssets.queryOptions({ type }),
  );
}
