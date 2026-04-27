export type LinnkerLinkType = "TRACKING" | "FORM" | "CHAT" | "EXTERNAL" | "AGENDA";
export type LinnkerButtonStyle = "rounded" | "sharp" | "pill";
export type LinnkerDisplayStyle = "button" | "banner";

export interface SocialLink {
  platform: string;
  url: string;
}

export interface LinnkerLink {
  id: string;
  pageId: string;
  title: string;
  description?: string | null;
  url: string;
  type: LinnkerLinkType;
  icon?: string | null;
  emoji?: string | null;
  imageUrl?: string | null;
  displayStyle: LinnkerDisplayStyle;
  color?: string | null;
  position: number;
  isActive: boolean;
  clicks: number;
  createdAt: string;
  updatedAt: string;
}

export interface LinnkerPage {
  id: string;
  organizationId: string;
  userId: string;
  slug: string;
  title: string;
  bio?: string | null;
  avatarUrl?: string | null;
  coverColor: string;
  buttonStyle: LinnkerButtonStyle;
  isPublished: boolean;
  bannerUrl?: string | null;
  backgroundColor?: string | null;
  backgroundImage?: string | null;
  backgroundOpacity: number;
  socialLinks?: SocialLink[] | null;
  socialIconColor?: string | null;
  titleColor?: string | null;
  bioColor?: string | null;
  links: LinnkerLink[];
  _count?: { scans: number };
  createdAt: string;
  updatedAt: string;
}

export interface LinnkerScan {
  id: string;
  pageId: string;
  leadId?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  createdAt: string;
  lead?: { id: string; name: string; email?: string | null; phone?: string | null } | null;
}

export const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/usuario" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/pagina" },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@usuario" },
  { key: "twitter", label: "X (Twitter)", placeholder: "https://x.com/usuario" },
  { key: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/5511999999999" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@canal" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/usuario" },
  { key: "website", label: "Website", placeholder: "https://meusite.com" },
] as const;
