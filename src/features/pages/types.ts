export type Device = "desktop" | "tablet" | "mobile";

export type PageStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type PageIntent =
  | "INSTITUTIONAL"
  | "LANDING"
  | "BIO_LINK"
  | "EVENT"
  | "PRODUCT"
  | "PORTFOLIO"
  | "CUSTOM";

export type DomainStatus = "PENDING" | "VERIFIED" | "FAILED";
export type DomainSource = "EXTERNAL" | "PURCHASED_VIA_NASA";
export type DomainPurchaseStatus =
  | "NOT_STARTED"
  | "SEARCHING"
  | "AWAITING_PAYMENT"
  | "PAID"
  | "REGISTERING"
  | "ACTIVE"
  | "FAILED";

export interface AnimationPreset {
  preset: string;
  trigger: "entrance" | "hover" | "scroll";
  durationMs?: number;
  delayMs?: number;
  easing?: string;
}

export interface LinkTarget {
  kind:
    | "url"
    | "tracking"
    | "form"
    | "agenda"
    | "linnker"
    | "chat"
    | "payment"
    | "forge"
    | "page";
  href?: string;
  resourceId?: string;
  openInNewTab?: boolean;
}

export interface ParallaxConfig {
  enabled?: boolean;
  speed?: number;
  direction?: "up" | "down";
}

export interface ResponsiveOverrides {
  tablet?: Partial<ElementBase>;
  mobile?: Partial<ElementBase>;
  hiddenOn?: Device[];
}

export interface ElementBase {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
  opacity?: number;
  zIndex?: number;
  locked?: boolean;
  hidden?: boolean;
  animation?: AnimationPreset;
  link?: LinkTarget;
  parallax?: ParallaxConfig;
  responsive?: ResponsiveOverrides;
  [key: string]: unknown;
}

export type ElementType =
  | "text"
  | "image"
  | "svg"
  | "shape"
  | "divider"
  | "icon"
  | "button"
  | "video"
  | "social"
  | "spacer"
  | "nasa-link"
  | "embed"
  | "group";

export interface Layer {
  elements: ElementBase[];
  background?: { color?: string; image?: string };
}

export interface Artboard {
  width: number;
  minHeight: number;
  background?: string;
}

export interface PageMeta {
  title?: string;
  description?: string;
  favicon?: string;
  og?: string;
}

export type PageLayout =
  | {
      mode: "single";
      main: Layer;
      artboard: Artboard;
      meta?: PageMeta;
      sections?: unknown[];
    }
  | {
      mode: "stacked";
      back: Layer;
      front: Layer;
      artboard: Artboard;
      meta?: PageMeta;
      sections?: unknown[];
      parallax: { backSpeed: number; frontSpeed: number };
    };

export interface NasaPageSummary {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  intent: PageIntent;
  status: PageStatus;
  layerCount: number;
  customDomain: string | null;
  domainStatus: DomainStatus | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
