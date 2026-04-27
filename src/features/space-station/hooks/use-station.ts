"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";

export function useStationByNick(nick: string) {
  return useQuery(
    orpc.spaceStation.getByNick.queryOptions({ input: { nick } }),
  );
}

export function useMyStation(type: "USER" | "ORG") {
  return useQuery(
    orpc.spaceStation.getMy.queryOptions({ input: { type } }),
  );
}

export function useListStations(params?: { search?: string; type?: "USER" | "ORG"; page?: number }) {
  return useQuery(
    orpc.spaceStation.list.queryOptions({ input: { page: 1, limit: 20, ...params } }),
  );
}

export function useOrgChart(nick: string) {
  return useQuery(
    orpc.spaceStation.getOrgChart.queryOptions({ input: { nick } }),
  );
}

export function useCreateStation() {
  const qc = useQueryClient();
  return useMutation({
    ...orpc.spaceStation.create.mutationOptions(),
    onSuccess: () => qc.invalidateQueries(orpc.spaceStation.getMy.queryOptions({ input: { type: "ORG" } })),
  });
}

export function useUpdateStation() {
  const qc = useQueryClient();
  return useMutation({
    ...orpc.spaceStation.update.mutationOptions(),
    onSuccess: () => qc.invalidateQueries(orpc.spaceStation.getMy.queryOptions({ input: { type: "ORG" } })),
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
    onSuccess: () => qc.invalidateQueries(orpc.spaceStation.getMy.queryOptions({ input: { type: "ORG" } })),
  });
}

export function useUpdateModules() {
  const qc = useQueryClient();
  return useMutation({
    ...orpc.spaceStation.updateModules.mutationOptions(),
    onSuccess: () => qc.invalidateQueries(orpc.spaceStation.getMy.queryOptions({ input: { type: "ORG" } })),
  });
}

import type { WorldAssetType } from "../types";

export function useWorldAssets(type?: WorldAssetType) {
  return useQuery(
    orpc.spaceStation.listWorldAssets.queryOptions({ input: { type } }),
  );
}

export function useListAvatarTemplates(params?: { search?: string }) {
  return useQuery(
    orpc.spaceStation.listAvatarTemplates.queryOptions({ input: params ?? {} }),
  );
}

/* ─── Map Editor hooks (world templates + my stations) ──────────────
 * NOTE: the backend procedures exist under src/app/router/space-station/
 * (list-my-world-templates, list-world-templates, get-world-template,
 *  delete-world-template, publish-world-template, list-my-stations) but
 * are not yet wired into the spaceStation router index. These hooks are
 * kept as inert stubs so the map-editor UI (which is not mounted in the
 * current app routes) type-checks without breaking the rest of the app.
 * Wire them up by adding the procedures to
 * src/app/router/space-station/index.ts and replacing these stubs.
 * ───────────────────────────────────────────────────────────────── */

type WorldTemplateItem = {
  id:          string;
  name:        string;
  description: string | null;
  previewUrl:  string | null;
  isPublic:    boolean;
  author?:     { name: string | null } | null;
};

type MyStationItem = {
  id:            string;
  nick:          string;
  type:          "USER" | "ORG";
  bio:           string | null;
  avatarUrl:     string | null;
  isPublic:      boolean;
  starsReceived: number;
  worldConfig:   { planetColor: string; ambientTheme: string } | null;
  user:          { name: string; image: string | null } | null;
  org:           { name: string; logo: string | null } | null;
};

function stubQuery<T>(data: T) {
  return {
    data,
    isLoading: false,
    isError:   false as boolean,
    isSuccess: true as const,
    refetch:   () => Promise.resolve({ data }),
  };
}

export function useListMyWorldTemplates(_params?: { category?: string; search?: string }) {
  void _params;
  return stubQuery<{ templates: WorldTemplateItem[] }>({ templates: [] });
}

export function useListWorldTemplates(_params?: { category?: string; search?: string; excludeMine?: boolean }) {
  void _params;
  return stubQuery<{ templates: WorldTemplateItem[] }>({ templates: [] });
}

export function useGetWorldTemplate() {
  return useMutation({
    mutationFn: async (_input: { templateId: string }) => {
      void _input;
      return { template: { id: "", name: "", mapData: {} as unknown } };
    },
  });
}

export function useDeleteWorldTemplate() {
  return useMutation({
    mutationFn: async (_input: { templateId: string }) => {
      void _input;
      return { ok: true };
    },
  });
}

export function usePublishWorldTemplate() {
  return useMutation({
    mutationFn: async (_input: {
      name:         string;
      description?: string;
      category:     string;
      mapData:      unknown;
      previewUrl?:  string | null;
      isPublic:     boolean;
      stationId?:   string;
    }) => {
      void _input;
      return { template: { id: "" } };
    },
  });
}

export function useMyStations() {
  return stubQuery<{ stations: MyStationItem[] }>({ stations: [] });
}
