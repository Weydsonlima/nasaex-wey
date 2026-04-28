import type { Device, PageIntent } from "./types";

export const STARS_COST = 2000;

export const DEVICE_PRESETS: Record<Device, { width: number; label: string }> = {
  desktop: { width: 1440, label: "Desktop" },
  tablet:  { width: 1024, label: "Tablet" },
  mobile:  { width: 375,  label: "Mobile" },
};

export const INTENT_LABELS: Record<PageIntent, string> = {
  INSTITUTIONAL: "Site institucional",
  LANDING:       "Landing page",
  BIO_LINK:      "Bio link",
  EVENT:         "Evento",
  PRODUCT:       "Produto",
  PORTFOLIO:     "Portfólio",
  CUSTOM:        "Personalizado",
  SPACE_PAGE:    "Space Page",
};

export const INTENT_DESCRIPTIONS: Record<PageIntent, string> = {
  INSTITUTIONAL: "Apresentação da empresa e áreas de atuação",
  LANDING:       "Captar leads ou conversões em uma ação específica",
  BIO_LINK:      "Agregar seus links principais num só lugar",
  EVENT:         "Divulgar um evento ao vivo ou online",
  PRODUCT:       "Divulgar um produto ou serviço",
  PORTFOLIO:     "Mostrar projetos realizados",
  CUSTOM:        "Comece do zero, do seu jeito",
  SPACE_PAGE:    "Página oficial da empresa na rede",
};

export const ELEMENT_TYPES = [
  "text",
  "image",
  "svg",
  "shape",
  "divider",
  "icon",
  "button",
  "video",
  "social",
  "spacer",
  "nasa-link",
  "embed",
] as const;

export const DEFAULT_PALETTES: Array<Record<string, string>> = [
  { primary: "#6366f1", accent: "#a78bfa", bg: "#0f172a", fg: "#f8fafc", muted: "#64748b" },
  { primary: "#10b981", accent: "#34d399", bg: "#ffffff", fg: "#0b132b", muted: "#64748b" },
  { primary: "#f97316", accent: "#fb923c", bg: "#fff7ed", fg: "#1c1917", muted: "#78716c" },
  { primary: "#ec4899", accent: "#f472b6", bg: "#0b1020", fg: "#f8fafc", muted: "#94a3b8" },
  { primary: "#0ea5e9", accent: "#38bdf8", bg: "#f8fafc", fg: "#0f172a", muted: "#64748b" },
];

export const ANIMATION_PRESETS = [
  { id: "fade",        label: "Fade" },
  { id: "slide-up",    label: "Slide up" },
  { id: "slide-down",  label: "Slide down" },
  { id: "slide-left",  label: "Slide left" },
  { id: "slide-right", label: "Slide right" },
  { id: "zoom-in",     label: "Zoom in" },
  { id: "zoom-out",    label: "Zoom out" },
  { id: "bounce",      label: "Bounce" },
  { id: "flip",        label: "Flip" },
] as const;
