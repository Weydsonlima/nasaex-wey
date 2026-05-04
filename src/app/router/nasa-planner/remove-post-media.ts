import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/prisma";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { logActivity } from "@/lib/activity-logger";

export const removePostMedia = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(z.object({
    postId: z.string(),
    type: z.enum(["image", "video"]),
  }))
  .handler(async ({ input, context }) => {
    const post = await prisma.nasaPlannerPost.findFirst({
      where: { id: input.postId, organizationId: context.org.id },
    });
    if (!post) throw new ORPCError("NOT_FOUND", { message: "Post não encontrado" });

    if (input.type === "image") {
      await prisma.nasaPlannerPost.update({
        where: { id: input.postId },
        data: { thumbnail: null },
      });
      // Remove slide 1 image key but keep slide
      await prisma.nasaPlannerPostSlide.updateMany({
        where: { postId: input.postId, order: 1 },
        data: { imageKey: null as any },
      });
    } else {
      await prisma.nasaPlannerPost.update({
        where: { id: input.postId },
        data: { videoKey: null as any, videoDuration: null as any },
      });
    }

    await logActivity({
      organizationId: context.org.id,
      userId: context.user.id,
      userName: context.user.name,
      userEmail: context.user.email,
      userImage: (context.user as any).image,
      appSlug: "nasa-planner",
      subAppSlug: "planner-posts",
      featureKey: "planner.post.media.removed",
      action: "planner.post.media.removed",
      actionLabel: input.type === "image" ? "Removeu a imagem do post" : "Removeu o vídeo do post",
      resourceId: input.postId,
      metadata: { type: input.type },
    });

    return { success: true };
  });
