import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/prisma";
import {
  createMetaCampaign,
  deleteMetaCampaign,
  listMetaCampaigns,
  updateMetaCampaign,
  type MetaCampaignRaw,
} from "@/http/meta/ads-management";
import { z } from "zod";
import { getMetaAuth } from "./_helpers";
import { MetaAdEntityStatus } from "@/generated/prisma/enums";

const STATUS_VALUES = [
  "ACTIVE", "PAUSED", "DELETED", "ARCHIVED",
  "PENDING_REVIEW", "DISAPPROVED", "PREAPPROVED",
  "PENDING_BILLING_INFO", "CAMPAIGN_PAUSED", "ADSET_PAUSED",
  "IN_PROCESS", "WITH_ISSUES",
] as const;

function normalizeStatus(s?: string): MetaAdEntityStatus {
  if (!s) return MetaAdEntityStatus.PAUSED;
  return (STATUS_VALUES.includes(s as (typeof STATUS_VALUES)[number])
    ? s
    : "PAUSED") as MetaAdEntityStatus;
}

function rawToUpsert(orgId: string, adAccountId: string, raw: MetaCampaignRaw) {
  return {
    organizationId: orgId,
    metaCampaignId: raw.id,
    adAccountId,
    name: raw.name,
    objective: raw.objective ?? null,
    status: normalizeStatus(raw.status),
    effectiveStatus: raw.effective_status ?? null,
    specialAdCategories: raw.special_ad_categories ?? [],
    buyingType: raw.buying_type ?? null,
    dailyBudget: raw.daily_budget ? Number(raw.daily_budget) / 100 : null,
    lifetimeBudget: raw.lifetime_budget ? Number(raw.lifetime_budget) / 100 : null,
    bidStrategy: raw.bid_strategy ?? null,
    startTime: raw.start_time ? new Date(raw.start_time) : null,
    stopTime: raw.stop_time ? new Date(raw.stop_time) : null,
    lastSyncedAt: new Date(),
    raw: raw as unknown as any,
  };
}

// LIST — combina dados locais + sync remoto se solicitado
export const list = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(z.object({ sync: z.boolean().default(false) }).optional().default({ sync: false }))
  .handler(async ({ input, context }) => {
    const orgId = context.org.id;

    if (input?.sync) {
      const auth = await getMetaAuth(orgId);
      if (auth) {
        try {
          const remote = await listMetaCampaigns(auth);
          for (const raw of remote) {
            const data = rawToUpsert(orgId, auth.adAccountId, raw);
            await prisma.metaAdCampaign.upsert({
              where: { metaCampaignId: raw.id },
              create: data,
              update: data,
            });
          }
        } catch {
          // tolera falha de sync e segue retornando o cache local
        }
      }
    }

    const campaigns = await prisma.metaAdCampaign.findMany({
      where: { organizationId: orgId },
      orderBy: { updatedAt: "desc" },
    });
    return { campaigns };
  });

export const create = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(
    z.object({
      name: z.string().min(1),
      objective: z.string().min(1),
      status: z.enum(["PAUSED", "ACTIVE"]).default("PAUSED"),
      specialAdCategories: z.array(z.string()).default([]),
      dailyBudget: z.number().int().positive().optional(),
      lifetimeBudget: z.number().int().positive().optional(),
      bidStrategy: z.string().optional(),
      startTime: z.string().optional(),
      stopTime: z.string().optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    const auth = await getMetaAuth(context.org.id);
    if (!auth) throw new Error("Integração Meta não configurada");

    const created = await createMetaCampaign(auth, input);

    const local = await prisma.metaAdCampaign.create({
      data: {
        organizationId: context.org.id,
        metaCampaignId: created.id,
        adAccountId: auth.adAccountId,
        name: input.name,
        objective: input.objective,
        status: input.status as MetaAdEntityStatus,
        specialAdCategories: input.specialAdCategories,
        dailyBudget: input.dailyBudget ? input.dailyBudget / 100 : null,
        lifetimeBudget: input.lifetimeBudget ? input.lifetimeBudget / 100 : null,
        bidStrategy: input.bidStrategy ?? null,
        startTime: input.startTime ? new Date(input.startTime) : null,
        stopTime: input.stopTime ? new Date(input.stopTime) : null,
        lastSyncedAt: new Date(),
      },
    });
    return { campaign: local };
  });

export const update = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(
    z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      status: z.enum(["PAUSED", "ACTIVE", "ARCHIVED", "DELETED"]).optional(),
      dailyBudget: z.number().int().positive().optional(),
      lifetimeBudget: z.number().int().positive().optional(),
      bidStrategy: z.string().optional(),
      startTime: z.string().optional(),
      stopTime: z.string().optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    const auth = await getMetaAuth(context.org.id);
    if (!auth) throw new Error("Integração Meta não configurada");

    const local = await prisma.metaAdCampaign.findFirst({
      where: { id: input.id, organizationId: context.org.id },
    });
    if (!local) throw new Error("Campanha não encontrada");

    if (local.metaCampaignId) {
      await updateMetaCampaign(auth, local.metaCampaignId, {
        name: input.name,
        status: input.status,
        dailyBudget: input.dailyBudget,
        lifetimeBudget: input.lifetimeBudget,
        bidStrategy: input.bidStrategy,
        startTime: input.startTime,
        stopTime: input.stopTime,
      });
    }

    const updated = await prisma.metaAdCampaign.update({
      where: { id: input.id },
      data: {
        name: input.name,
        status: input.status as MetaAdEntityStatus | undefined,
        dailyBudget: input.dailyBudget ? input.dailyBudget / 100 : undefined,
        lifetimeBudget: input.lifetimeBudget ? input.lifetimeBudget / 100 : undefined,
        bidStrategy: input.bidStrategy,
        startTime: input.startTime ? new Date(input.startTime) : undefined,
        stopTime: input.stopTime ? new Date(input.stopTime) : undefined,
        lastSyncedAt: new Date(),
      },
    });
    return { campaign: updated };
  });

export const remove = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    const auth = await getMetaAuth(context.org.id);
    if (!auth) throw new Error("Integração Meta não configurada");

    const local = await prisma.metaAdCampaign.findFirst({
      where: { id: input.id, organizationId: context.org.id },
    });
    if (!local) throw new Error("Campanha não encontrada");

    if (local.metaCampaignId) {
      try {
        await deleteMetaCampaign(auth, local.metaCampaignId);
      } catch {
        // se Meta retornar erro (campanha já deletada lá), apaga local mesmo assim
      }
    }
    await prisma.metaAdCampaign.delete({ where: { id: input.id } });
    return { success: true };
  });
