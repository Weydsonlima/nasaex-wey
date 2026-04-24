import { nanoid } from "nanoid";
import type { ElementBase, ElementType } from "../types";

const DEFAULTS: Record<ElementType, (palette: Record<string, string>) => Omit<ElementBase, "id">> = {
  text: (p) => ({
    type: "text",
    x: 40, y: 40, w: 360, h: 80,
    content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Texto" }] }] },
    color: p.fg ?? "#0f172a",
    fontSize: 24,
    fontFamily: "Inter",
    align: "left",
  }),
  image: () => ({
    type: "image",
    x: 40, y: 40, w: 320, h: 200,
    src: "",
    alt: "",
    fit: "cover",
    borderRadius: 8,
  }),
  svg: () => ({
    type: "svg",
    x: 40, y: 40, w: 160, h: 160,
    src: "",
    colorOverrides: {},
  }),
  shape: (p) => ({
    type: "shape",
    x: 40, y: 40, w: 200, h: 200,
    shape: "rect",
    fill: p.primary ?? "#6366f1",
    borderRadius: 12,
  }),
  divider: (p) => ({
    type: "divider",
    x: 40, y: 40, w: 400, h: 2,
    orientation: "horizontal",
    color: p.muted ?? "#94a3b8",
    thickness: 2,
  }),
  icon: (p) => ({
    type: "icon",
    x: 40, y: 40, w: 48, h: 48,
    name: "Star",
    color: p.primary ?? "#6366f1",
    strokeWidth: 2,
  }),
  button: (p) => ({
    type: "button",
    x: 40, y: 40, w: 180, h: 48,
    label: "Clique aqui",
    variant: "solid",
    radius: 10,
    bg: p.primary ?? "#6366f1",
    fg: "#ffffff",
  }),
  video: () => ({
    type: "video",
    x: 40, y: 40, w: 560, h: 315,
    provider: "yt",
    url: "",
    autoplay: false,
    muted: true,
    loop: false,
  }),
  social: (p) => ({
    type: "social",
    x: 40, y: 40, w: 240, h: 48,
    platforms: ["instagram", "facebook", "linkedin"],
    iconColor: p.fg ?? "#0f172a",
    size: 32,
    gap: 12,
  }),
  spacer: () => ({
    type: "spacer",
    x: 0, y: 0, w: 600, h: 80,
  }),
  "nasa-link": (p) => ({
    type: "nasa-link",
    x: 40, y: 40, w: 320, h: 100,
    appId: "tracking",
    label: "Acompanhar pipeline",
    variant: "card",
    bg: p.bg ?? "#ffffff",
    fg: p.fg ?? "#0f172a",
  }),
  embed: () => ({
    type: "embed",
    x: 40, y: 40, w: 400, h: 300,
    html: "",
  }),
  group: () => ({
    type: "group",
    x: 40, y: 40, w: 400, h: 200,
    children: [] as ElementBase[],
  }),
};

export function createElement(
  type: ElementType,
  palette: Record<string, string> = {},
): ElementBase {
  const defaults = DEFAULTS[type](palette);
  return {
    id: `el_${nanoid(10)}`,
    ...defaults,
  } as ElementBase;
}
