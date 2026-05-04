import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/prisma";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { logActivity } from "@/lib/activity-logger";

export const addSlidesBatch = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(z.object({
    postId: z.string(),
    imageKeys: z.array(z.string()).min(1),
  }))
  .handler(async ({ input, context }) => {
    const post = await prisma.nasaPlannerPost.findFirst({
      where: { id: input.postId, organizationId: context.org.id },
      include: { slides: { orderBy: { order: "asc" } } },
    });
    if (!post) throw new ORPCError("NOT_FOUND", { message: "Post não encontrado" });

    const nextOrder = post.slides.length + 1;

    await prisma.nasaPlannerPostSlide.createMany({
      data: input.imageKeys.map((key, i) => ({
        postId: input.postId,
        imageKey: key,
        order: nextOrder + i,
        overlayConfig: {},
      })),
    });

    // Set thumbnail to first slide if post has none
    if (!post.thumbnail) {
      await prisma.nasaPlannerPost.update({
        where: { id: input.postId },
        data: { thumbnail: input.imageKeys[0] },
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
      featureKey: "planner.post.slides.added",
      action: "planner.post.slides.added",
      actionLabel: `Adicionou ${input.imageKeys.length} ${input.imageKeys.length === 1 ? "slide" : "slides"} ao post`,
      resourceId: input.postId,
      metadata: { count: input.imageKeys.length },
    });

    return { added: input.imageKeys.length };
  });
