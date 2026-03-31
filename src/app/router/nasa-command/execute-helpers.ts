import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import prisma from "@/lib/prisma";
import { IntegrationPlatform } from "@/generated/prisma/enums";

// ─── Date/Time Helpers ────────────────────────────────────────────────────────

export function parseDate(cmd: string): Date {
  if (cmd.includes("/amanhã") || cmd.includes("/amanha") || cmd.includes("amanhã") || cmd.includes("amanha")) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  }
  if (cmd.includes("/semana_que_vem") || cmd.includes("semana que vem")) {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  }
  if (cmd.includes("hoje")) return new Date();
  // Try DD.MM.AAAA pattern
  const dateMatch = cmd.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (dateMatch) return new Date(`${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`);
  return new Date();
}

export function parseTime(cmd: string): string | null {
  const match = cmd.match(/às?\s*(\d{1,2})h(\d{2})?/);
  if (match) return `${String(match[1]).padStart(2, "0")}:${match[2] ?? "00"}`;
  return null;
}

export function buildDateTime(date: Date, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

// ─── parsedVars parser ────────────────────────────────────────────────────────
// Parses /"key"="value" or /'key'='value' patterns

export function parseParsedVars(command: string): Record<string, string> {
  const result: Record<string, string> = {};
  // Match /"key"="value" or /"key"='value' or /'key'="value" or /'key'='value'
  const regex = /\/"([^"]+)"[=:]'([^']*)'|\/"([^"]+)"[=:]"([^"]*)"|\/['']([^'']+)[''][=:]"([^"]*)"|\/"([^"]+)"[=:]([^\s,]+)/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(command)) !== null) {
    const key = m[1] ?? m[3] ?? m[5] ?? m[7];
    const val = m[2] ?? m[4] ?? m[6] ?? m[8];
    if (key && val !== undefined) {
      result[key.toLowerCase()] = val;
    }
  }
  return result;
}

// ─── Star Costs ───────────────────────────────────────────────────────────────

export const STAR_COSTS = {
  query: 1,
  create: 3,
  ai_parse: 2,
  ai_generate: 8,
  move: 2,
};

// ─── Entity Resolution ────────────────────────────────────────────────────────

export async function resolveContact(name: string, orgId: string) {
  const normalized = name.replace(/_/g, " ");
  return prisma.lead.findFirst({
    where: {
      name: { contains: normalized, mode: "insensitive" },
      tracking: { organizationId: orgId },
    },
    select: { id: true, name: true },
  });
}

export async function resolveUser(name: string, orgId: string) {
  const normalized = name.replace(/_/g, " ");
  const member = await prisma.member.findFirst({
    where: {
      organizationId: orgId,
      user: { name: { contains: normalized, mode: "insensitive" } },
    },
    include: { user: { select: { id: true, name: true } } },
  });
  return member?.user ?? null;
}

export async function resolveProduct(name: string, orgId: string) {
  const normalized = name.replace(/_/g, " ");
  return prisma.forgeProduct.findFirst({
    where: {
      organizationId: orgId,
      name: { contains: normalized, mode: "insensitive" },
    },
    select: { id: true, name: true },
  });
}

// ─── Title Extractor ──────────────────────────────────────────────────────────

export function extractTitle(command: string): string {
  const cleaned = command.replace(/#[\w-]+/g, "").replace(/\/[\w_ÀÀ-ÿ.]+/g, "").trim();
  return cleaned.slice(0, 60) || "Novo post";
}

export function extractTrackingName(command: string): string {
  const quotedMatch = command.match(/[\u201C"«]([^\u201D"»\n]+)[\u201D"»]/);
  if (quotedMatch) return quotedMatch[1].trim();
  const chamadoMatch = command.match(/chamado\s+(.+?)(?:\s+(?:no|com|em)\s+#|\s*$)/i);
  if (chamadoMatch) return chamadoMatch[1].trim();
  const addMatch = command.match(/\/Add_tracking\s+(.+?)(?:\s+(?:no|com)\s+#|\s*$)/i);
  if (addMatch) return addMatch[1].trim();
  return "Novo Tracking";
}

// ─── AI Provider Helper ───────────────────────────────────────────────────────

export async function getConnectedAIProvider(orgId: string) {
  const integrations = await prisma.platformIntegration.findMany({
    where: {
      organizationId: orgId,
      platform: { in: [IntegrationPlatform.ANTHROPIC, IntegrationPlatform.OPENAI, IntegrationPlatform.GEMINI] },
    },
  });
  return integrations;
}

export async function generateWithAI(
  orgId: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<string | null> {
  const integrations = await getConnectedAIProvider(orgId);
  const integrationMap = new Map(integrations.map((i) => [i.platform, i]));

  // Anthropic first
  const anthropicInt = integrationMap.get(IntegrationPlatform.ANTHROPIC);
  if (anthropicInt) {
    const apiKey = (anthropicInt.config as Record<string, string>)?.apiKey;
    if (apiKey) {
      try {
        const anthropic = createAnthropic({ apiKey });
        const { text } = await generateText({
          model: anthropic("claude-3-haiku-20240307"),
          system: systemPrompt,
          prompt: userPrompt,
        });
        return text;
      } catch { /* continue */ }
    }
  }

  // OpenAI
  const openaiInt = integrationMap.get(IntegrationPlatform.OPENAI);
  if (openaiInt) {
    const apiKey = (openaiInt.config as Record<string, string>)?.apiKey;
    if (apiKey) {
      try {
        const openai = createOpenAI({ apiKey });
        const { text } = await generateText({
          model: openai("gpt-4o-mini"),
          system: systemPrompt,
          prompt: userPrompt,
        });
        return text;
      } catch { /* continue */ }
    }
  }

  // Gemini
  const geminiInt = integrationMap.get(IntegrationPlatform.GEMINI);
  if (geminiInt) {
    const apiKey = (geminiInt.config as Record<string, string>)?.apiKey;
    if (apiKey) {
      try {
        const google = createGoogleGenerativeAI({ apiKey });
        const { text } = await generateText({
          model: google("gemini-2.0-flash"),
          system: systemPrompt,
          prompt: userPrompt,
        });
        return text;
      } catch { /* continue */ }
    }
  }

  return null;
}

// ─── Type for execute output ──────────────────────────────────────────────────

export type ExecuteOutput = {
  type: "created" | "query_result" | "error" | "needs_input" | "post_generated" | "confirmation_needed";
  title: string;
  description: string;
  url?: string;
  appName: string;
  extraData?: unknown;
  missingFields?: Array<{ key: string; label: string }>;
  partialContext?: Record<string, string>;
  content?: string;
  starsSpent?: number;
  confirmOptions?: Array<{ key: string; label: string; icon?: string }>;
};
