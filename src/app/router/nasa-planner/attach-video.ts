import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/prisma";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { logActivity } from "@/lib/activity-logger";

export const attachVideo = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(
    z.object({
      postId: z.string(),
      videoKey: z.string(),
      videoDuration: z.number().int().optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    const post = await prisma.nasaPlannerPost.findFirst({
      where: { id: input.postId, organizationId: context.org.id },
    });
    if (!post) throw new ORPCError("NOT_FOUND", { message: "Post não encontrado" });

    const updated = await prisma.nasaPlannerPost.update({
      where: { id: input.postId },
      data: {
        videoKey: input.videoKey,
        ...(input.videoDuration !== undefined && { videoDuration: input.videoDuration }),
        type: "REEL",
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
      featureKey: "planner.post.video.attached",
      action: "planner.post.video.attached",
      actionLabel: "Anexou um vídeo ao post (Reel)",
      resourceId: input.postId,
      metadata: { videoDuration: input.videoDuration },
    });

    return { post: updated };
  });
