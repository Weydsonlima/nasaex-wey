import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import { awardPoints } from "@/app/router/space-point/utils";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { logActivity } from "@/lib/activity-logger";

export const createCampaignBrandAsset = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(
    z.object({
      campaignId: z.string(),
      assetType: z.enum(["LOGO", "COLOR_PALETTE", "FONT", "LINK", "DOCUMENT", "IMAGE", "VIDEO"]),
      name: z.string().min(1),
      url: z.string().optional(),
      filePath: z.string().optional(),
      nboxItemId: z.string().optional(),
      metadata: z.record(z.string(), z.any()).optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    const { campaignId, metadata, ...rest } = input;

    const campaign = await prisma.nasaCampaignPlanner.findFirst({
      where: { id: campaignId, organizationId: context.org.id, deletedAt: null },
    });
    if (!campaign) throw new Error("Planejamento não encontrado.");

    const asset = await prisma.nasaCampaignBrandAsset.create({
      data: {
        campaignPlannerId: campaignId,
        ...rest,
        metadata: metadata ?? {},
      },
    });

    await awardPoints(context.user.id, context.org.id, "upload_brand_asset");

    await logActivity({
      organizationId: context.org.id,
      userId: context.user.id,
      userName: context.user.name,
      userEmail: context.user.email,
      userImage: (context.user as any).image,
      appSlug: "nasa-planner",
      subAppSlug: "planner-assets",
      featureKey: "planner.campaign.asset.uploaded",
      action: "planner.campaign.asset.uploaded",
      actionLabel: `Adicionou material de marca (${input.assetType}): "${input.name}"`,
      resourceId: asset.id,
      metadata: { assetType: input.assetType },
    });

    return { asset };
  });
