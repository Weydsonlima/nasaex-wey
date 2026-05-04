import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/prisma";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { logActivity } from "@/lib/activity-logger";

export const createPostFromAction = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(
    z.object({
      actionId: z.string(),
      plannerId: z.string(),
      type: z.enum(["STATIC", "CAROUSEL", "REEL", "STORY"]).default("STATIC"),
      targetNetworks: z.array(z.string()).optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    const [action, planner] = await Promise.all([
      prisma.action.findFirst({ where: { id: input.actionId, organizationId: context.org.id } }),
      prisma.nasaPlanner.findFirst({ where: { id: input.plannerId, organizationId: context.org.id } }),
    ]);

    if (!action) throw new ORPCError("NOT_FOUND", { message: "Card não encontrado" });
    if (!planner) throw new ORPCError("NOT_FOUND", { message: "Planner não encontrado" });

    const post = await prisma.nasaPlannerPost.create({
      data: {
        plannerId: input.plannerId,
        organizationId: context.org.id,
        createdById: context.user.id,
        title: action.title,
        type: input.type as any,
        targetNetworks: input.targetNetworks ?? [],
        referenceLinks: [],
      },
    });

    await logActivity({
      organizationId: context.org.id,
      userId: context.user.id,
      userName: context.user.name,
      userEmail: context.user.email,
      userImage: (context.user as any).image,
      appSlug: "nasa-planner",
      subAppSlug: "planner-posts",
      featureKey: "planner.post.created.from.action",
      action: "planner.post.created.from.action",
      actionLabel: `Criou um post a partir do card "${action.title}"`,
      resourceId: post.id,
      metadata: { actionId: input.actionId, type: input.type },
    });

    return { post };
  });
