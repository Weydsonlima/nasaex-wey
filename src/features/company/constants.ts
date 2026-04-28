// Constantes de domínio: tipo de empresa + cargos hierárquicos
// Usadas em signup, settings/company, members-tab e validação server-side.

export interface CompanyTypeOption {
  slug: string;
  label: string;
  description?: string;
}

export const COMPANY_TYPES: CompanyTypeOption[] = [
  { slug: "agencia-publicidade", label: "Agência de Publicidade", description: "Criação, branding e campanhas" },
  { slug: "agencia-trafego", label: "Agência de Tráfego/Marketing", description: "Performance, mídia paga, lançamentos" },
  { slug: "agencia-seo", label: "Agência de SEO/Conteúdo", description: "SEO, blog, growth orgânico" },
  { slug: "ecommerce", label: "E-commerce", description: "Loja online própria ou marketplaces" },
  { slug: "consultoria", label: "Consultoria", description: "Consultoria empresarial, estratégica ou técnica" },
  { slug: "oficina-automotiva", label: "Oficina Automotiva", description: "Mecânica, funilaria, estética automotiva" },
  { slug: "estudio-design", label: "Estúdio de Design", description: "Design gráfico, UI/UX, ilustração" },
  { slug: "imobiliaria", label: "Imobiliária", description: "Vendas, locação, incorporação" },
  { slug: "clinica", label: "Clínica / Saúde", description: "Clínicas, consultórios, estética" },
  { slug: "educacao", label: "Educação / Cursos", description: "Cursos, escolas, edtech" },
  { slug: "software-house", label: "Software House / Tech", description: "Desenvolvimento, SaaS, tech" },
  { slug: "industria", label: "Indústria / Manufatura", description: "Produção industrial e fabril" },
  { slug: "alimentacao", label: "Restaurante / Alimentação", description: "Restaurantes, delivery, food service" },
  { slug: "construcao", label: "Construção / Engenharia", description: "Construtoras, reformas, engenharia" },
  { slug: "advocacia", label: "Advocacia / Jurídico", description: "Escritórios de advocacia e consultoria jurídica" },
  { slug: "contabilidade", label: "Contabilidade / Finanças", description: "Escritórios contábeis e financeiros" },
  { slug: "varejo", label: "Varejo / Comércio", description: "Loja física, distribuidora" },
  { slug: "servicos", label: "Serviços (geral)", description: "Prestação de serviços B2B/B2C" },
  { slug: "infoprodutor", label: "Infoprodutor / Creator", description: "Cursos, mentorias, conteúdo digital" },
  { slug: "outro", label: "Outro", description: "Outro segmento" },
];

export const COMPANY_TYPE_SLUGS = COMPANY_TYPES.map((t) => t.slug);

export function getCompanyTypeLabel(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return COMPANY_TYPES.find((t) => t.slug === slug)?.label ?? slug;
}

// ─── Cargos hierárquicos ───────────────────────────────────────────────
// level 1 = topo da hierarquia (CEO/Sócio); level 10 = base (Estagiário).
// Usado para: Select de cargo + agrupamento visual em "Hierarquia da equipe".

export interface PositionOption {
  slug: string;
  label: string;
  level: number;
  group: "lideranca" | "gestao" | "operacional" | "entrada";
}

export const POSITIONS: PositionOption[] = [
  { slug: "ceo", label: "CEO / Sócio-Fundador", level: 1, group: "lideranca" },
  { slug: "socio", label: "Sócio / Co-Founder", level: 1, group: "lideranca" },
  { slug: "diretor", label: "Diretor(a)", level: 2, group: "lideranca" },
  { slug: "head", label: "Head / VP", level: 3, group: "lideranca" },
  { slug: "cmo", label: "CMO — Marketing", level: 3, group: "lideranca" },
  { slug: "cto", label: "CTO — Tecnologia", level: 3, group: "lideranca" },
  { slug: "coo", label: "COO — Operações", level: 3, group: "lideranca" },
  { slug: "cfo", label: "CFO — Financeiro", level: 3, group: "lideranca" },
  { slug: "gerente", label: "Gerente", level: 4, group: "gestao" },
  { slug: "coordenador", label: "Coordenador(a)", level: 5, group: "gestao" },
  { slug: "supervisor", label: "Supervisor(a) / Líder", level: 6, group: "gestao" },
  { slug: "especialista", label: "Especialista", level: 6, group: "operacional" },
  { slug: "senior", label: "Sênior", level: 7, group: "operacional" },
  { slug: "pleno", label: "Pleno", level: 8, group: "operacional" },
  { slug: "junior", label: "Júnior", level: 9, group: "operacional" },
  { slug: "assistente", label: "Assistente / Auxiliar", level: 9, group: "operacional" },
  { slug: "estagiario", label: "Estagiário(a) / Trainee", level: 10, group: "entrada" },
  { slug: "freelancer", label: "Freelancer / PJ", level: 10, group: "entrada" },
];

export const POSITION_SLUGS = POSITIONS.map((p) => p.slug);

export const POSITION_GROUP_LABELS: Record<PositionOption["group"], string> = {
  lideranca: "Liderança",
  gestao: "Gestão",
  operacional: "Operacional",
  entrada: "Entrada / Suporte",
};

export function getPosition(slug: string | null | undefined): PositionOption | null {
  if (!slug) return null;
  return POSITIONS.find((p) => p.slug === slug) ?? null;
}

export function getPositionLabel(slug: string | null | undefined): string | null {
  return getPosition(slug)?.label ?? slug ?? null;
}
