"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { ChartType, DashboardSettings, DateRange } from "../types";

interface DashboardState {
  trackingId?: string;
  organizationIds: string[];
  tagIds: string[];
  dateRange: DateRange;
  settings: DashboardSettings;
}

const defaultSettings: DashboardSettings = {
  visibleSections: {
    summary: true,
    byStatus: true,
    byChannel: true,
    byAttendant: true,
    topTags: true,
  },
  chartTypes: {
    byStatus: "bar",
    byChannel: "pie",
    byAttendant: "bar",
    topTags: "bar",
  },
};

const defaultState: DashboardState = {
  trackingId: undefined,
  organizationIds: [],
  tagIds: [],
  dateRange: { from: undefined, to: undefined },
  settings: defaultSettings,
};

let state = defaultState;
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

export function setTrackingId(trackingId: string) {
  state = { ...state, trackingId };
  emitChange();
}

export function setDateRange(dateRange: DateRange) {
  state = { ...state, dateRange };
  emitChange();
}

export function setTagIds(tagIds: string[]) {
  state = { ...state, tagIds };
  emitChange();
}

export function setOrganizationIds(organizationIds: string[]) {
  state = { ...state, organizationIds, trackingId: undefined };
  emitChange();
}

export function toggleOrganizationId(organizationId: string) {
  if (organizationId === "ALL") {
    state = { ...state, organizationIds: [], trackingId: undefined };
    emitChange();
    return;
  }

  const newOrganizationIds = state.organizationIds.includes(organizationId)
    ? state.organizationIds.filter((id) => id !== organizationId)
    : [...state.organizationIds, organizationId];

  // Sempre que mudar a empresa, limpamos o tracking selecionado para evitar inconsistência
  state = {
    ...state,
    organizationIds: newOrganizationIds,
    trackingId: undefined,
  };
  emitChange();
}

export function toggleTagId(tagId: string) {
  const newTagIds = state.tagIds.includes(tagId)
    ? state.tagIds.filter((id) => id !== tagId)
    : [...state.tagIds, tagId];
  state = { ...state, tagIds: newTagIds };
  emitChange();
}

export function toggleSection(
  section: keyof DashboardSettings["visibleSections"],
) {
  state = {
    ...state,
    settings: {
      ...state.settings,
      visibleSections: {
        ...state.settings.visibleSections,
        [section]: !state.settings.visibleSections[section],
      },
    },
  };
  emitChange();
}

export function setChartType(
  chart: keyof DashboardSettings["chartTypes"],
  type: ChartType,
) {
  state = {
    ...state,
    settings: {
      ...state.settings,
      chartTypes: {
        ...state.settings.chartTypes,
        [chart]: type,
      },
    },
  };
  emitChange();
}

export function resetSettings() {
  state = { ...state, settings: defaultSettings };
  emitChange();
}

export function useDashboardStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const actions = useMemo(
    () => ({
      setTrackingId,
      setOrganizationIds,
      toggleOrganizationId,
      setDateRange,
      setTagIds,
      toggleTagId,
      toggleSection,
      setChartType,
      resetSettings,
    }),
    [],
  );

  return { ...snapshot, ...actions };
}

export function useDashboardFilters() {
  const {
    trackingId,
    organizationIds,
    tagIds,
    dateRange,
    setTrackingId,
    setOrganizationIds,
    toggleOrganizationId,
    setTagIds,
    toggleTagId,
    setDateRange,
  } = useDashboardStore();
  return {
    trackingId,
    organizationIds,
    tagIds,
    dateRange,
    setTrackingId,
    setOrganizationIds,
    toggleOrganizationId,
    setTagIds,
    toggleTagId,
    setDateRange,
  };
}

export function useDashboardSettings() {
  const { settings, toggleSection, setChartType, resetSettings } =
    useDashboardStore();
  return { settings, toggleSection, setChartType, resetSettings };
}
