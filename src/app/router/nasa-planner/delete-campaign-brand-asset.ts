import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { logActivity } from "@/lib/activity-logger";

export const deleteCampaignBrandAsset = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(z.object({ campaignId: z.string(), assetId: z.string() }))
  .handler(async ({ input, context }) => {
    const asset = await prisma.nasaCampaignBrandAsset.findFirst({
      where: { id: input.assetId, campaignPlannerId: input.campaignId, campaignPlanner: { organizationId: context.org.id } },
    });
    if (!asset) throw new Error("Material não encontrado.");
    await prisma.nasaCampaignBrandAsset.delete({ where: { id: input.assetId } });

    await logActivity({
      organizationId: context.org.id,
      userId: context.user.id,
      userName: context.user.name,
      userEmail: context.user.email,
      userImage: (context.user as any).image,
      appSlug: "nasa-planner",
      subAppSlug: "planner-assets",
      featureKey: "planner.campaign.asset.deleted",
      action: "planner.campaign.asset.deleted",
      actionLabel: `Excluiu material de marca: "${asset.name}"`,
      resourceId: asset.id,
    });

    return { success: true };
  });
