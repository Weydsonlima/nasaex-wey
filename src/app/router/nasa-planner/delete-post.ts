import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { logActivity } from "@/lib/activity-logger";

export const deletePost = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(z.object({ postId: z.string() }))
  .handler(async ({ input, context }) => {
    const existing = await prisma.nasaPlannerPost.findFirst({
      where: { id: input.postId, organizationId: context.org.id },
      select: { title: true, type: true },
    });

    await prisma.nasaPlannerPost.delete({
      where: { id: input.postId, organizationId: context.org.id },
    });

    await logActivity({
      organizationId: context.org.id,
      userId: context.user.id,
      userName: context.user.name,
      userEmail: context.user.email,
      userImage: (context.user as any).image,
      appSlug: "nasa-planner",
      subAppSlug: "planner-posts",
      featureKey: "planner.post.deleted",
      action: "planner.post.deleted",
      actionLabel: existing?.title
        ? `Excluiu o post "${existing.title}"`
        : "Excluiu um post",
      resourceId: input.postId,
      metadata: { type: existing?.type },
    });

    return { ok: true };
  });
