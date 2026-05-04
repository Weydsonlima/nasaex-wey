import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import { awardPoints } from "@/app/router/space-point/utils";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { logActivity } from "@/lib/activity-logger";

export const updateCampaign = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(
    z.object({
      campaignId: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      clientName: z.string().optional(),
      clientLogo: z.string().optional(),
      status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]).optional(),
      startDate: z.string().nullable().optional(),
      endDate: z.string().nullable().optional(),
      color: z.string().optional(),
      plannerId: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    const { campaignId, startDate, endDate, ...rest } = input;

    const existing = await prisma.nasaCampaignPlanner.findFirst({
      where: { id: campaignId, organizationId: context.org.id, deletedAt: null },
    });
    if (!existing) throw new Error("Planejamento não encontrado.");

    const campaign = await prisma.nasaCampaignPlanner.update({
      where: { id: campaignId },
      data: {
        ...rest,
        startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : undefined,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
      },
    });

    if (input.status === "COMPLETED" && existing.status !== "COMPLETED") {
      await awardPoints(context.user.id, context.org.id, "complete_campaign");
    }

    const isCompleted = input.status === "COMPLETED" && existing.status !== "COMPLETED";
    await logActivity({
      organizationId: context.org.id,
      userId: context.user.id,
      userName: context.user.name,
      userEmail: context.user.email,
      userImage: (context.user as any).image,
      appSlug: "nasa-planner",
      subAppSlug: "planner-campaigns",
      featureKey: isCompleted ? "planner.campaign.completed" : "planner.campaign.updated",
      action: isCompleted ? "planner.campaign.completed" : "planner.campaign.updated",
      actionLabel: isCompleted
        ? `Concluiu o planejamento "${campaign.title}"`
        : `Atualizou o planejamento "${campaign.title}"`,
      resourceId: campaign.id,
      metadata: { status: input.status },
    });

    return { campaign };
  });
