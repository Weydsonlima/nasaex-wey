import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import { debitStars } from "@/lib/star-service";
import { StarTransactionType } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { logActivity } from "@/lib/activity-logger";

const STARS_MERGE_FFMPEG = 1;

export const saveEditedVideo = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(
    z.object({
      postId: z.string(),
      finalVideoKey: z.string(),
      videoDuration: z.number().int().optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    const post = await prisma.nasaPlannerPost.findFirst({
      where: { id: input.postId, organizationId: context.org.id },
    });
    if (!post) throw new ORPCError("NOT_FOUND", { message: "Post não encontrado" });

    const { newBalance: balanceAfter } = await debitStars(
      context.org.id,
      STARS_MERGE_FFMPEG,
      StarTransactionType.APP_CHARGE,
      "Vídeo editado com FFmpeg",
      "nasa-planner",
    );

    const updated = await prisma.nasaPlannerPost.update({
      where: { id: input.postId },
      data: {
        videoKey: input.finalVideoKey,
        thumbnail: input.finalVideoKey,
        type: "REEL",
        ...(input.videoDuration !== undefined && { videoDuration: input.videoDuration }),
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
      featureKey: "planner.post.video.edited",
      action: "planner.post.video.edited",
      actionLabel: `Salvou vídeo editado no post — ${STARS_MERGE_FFMPEG}★`,
      resourceId: input.postId,
      metadata: { videoDuration: input.videoDuration, starsSpent: STARS_MERGE_FFMPEG },
    });

    return { post: updated, starsSpent: STARS_MERGE_FFMPEG, balanceAfter };
  });
