import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { logActivity } from "@/lib/activity-logger";

export const deleteCampaign = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(z.object({ campaignId: z.string() }))
  .handler(async ({ input, context }) => {
    const existing = await prisma.nasaCampaignPlanner.findFirst({
      where: { id: input.campaignId, organizationId: context.org.id, deletedAt: null },
    });
    if (!existing) throw new Error("Planejamento não encontrado.");

    await prisma.nasaCampaignPlanner.update({
      where: { id: input.campaignId },
      data: { deletedAt: new Date() },
    });

    await logActivity({
      organizationId: context.org.id,
      userId: context.user.id,
      userName: context.user.name,
      userEmail: context.user.email,
      userImage: (context.user as any).image,
      appSlug: "nasa-planner",
      subAppSlug: "planner-campaigns",
      featureKey: "planner.campaign.deleted",
      action: "planner.campaign.deleted",
      actionLabel: `Excluiu o planejamento "${existing.title}"`,
      resourceId: existing.id,
    });

    return { success: true };
  });
