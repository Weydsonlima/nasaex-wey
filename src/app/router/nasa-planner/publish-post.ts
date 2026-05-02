import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/prisma";
import { debitStars } from "@/lib/star-service";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { IntegrationPlatform, NasaPlannerPostStatus, StarTransactionType } from "@/generated/prisma/enums";
import { STARS_PUBLISH } from "./_helpers/ai-provider";
import { getPublicMediaUrl } from "@/lib/r2-url";
import {
  publishInstagramImage,
  publishInstagramCarousel,
  publishFacebookPagePhoto,
} from "@/http/meta/publish-feed-post";
import { publishInstagramReel } from "@/http/meta/publish-reel";

type MetaConfig = {
  page_access_token?: string;
  page_id?: string;
  instagram_account_id?: string;
};

export const publishPost = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(z.object({ postId: z.string() }))
  .handler(async ({ input, context }) => {
    const post = await prisma.nasaPlannerPost.findFirst({
      where: { id: input.postId, organizationId: context.org.id },
      include: { slides: { orderBy: { order: "asc" } } },
    });
    if (!post) throw new ORPCError("NOT_FOUND", { message: "Post não encontrado" });

    const allowedStatuses: string[] = [
      NasaPlannerPostStatus.APPROVED,
      NasaPlannerPostStatus.SCHEDULED,
      NasaPlannerPostStatus.DRAFT,
      NasaPlannerPostStatus.PENDING_APPROVAL,
    ];
    if (!allowedStatuses.includes(post.status)) {
      throw new ORPCError("BAD_REQUEST", { message: "Post já publicado" });
    }

    const debit = await debitStars(
      context.org.id, STARS_PUBLISH, StarTransactionType.APP_CHARGE,
      "NASA Planner — publicação de post", "nasa-planner", context.user.id,
    );
    if (!debit.success) throw new ORPCError("BAD_REQUEST", { message: "Saldo de stars insuficiente" });

    // ── Tentar publicação nas redes sociais configuradas ──────────────────────
    const networks = (post.targetNetworks ?? []) as string[];
    const publishResults: Record<string, string | null> = {};

    if (networks.includes("INSTAGRAM") || networks.includes("FACEBOOK")) {
      const metaIntegration = await prisma.platformIntegration.findFirst({
        where: { organizationId: context.org.id, platform: IntegrationPlatform.META, isActive: true },
      });

      if (!metaIntegration) {
        // No integration — mark as published without social posting
        // (user can configure in /integrations later)
      } else {
        const cfg = metaIntegration.config as MetaConfig;
        const token = cfg.page_access_token;
        const pageId = cfg.page_id;
        const igId = cfg.instagram_account_id;
        const caption = post.caption ?? undefined;

        try {
          // Instagram
          if (networks.includes("INSTAGRAM") && igId && token) {
            if (post.type === "REEL" && post.videoKey) {
              const videoUrl = await getPublicMediaUrl(post.videoKey);
              const thumbUrl = post.thumbnail ? await getPublicMediaUrl(post.thumbnail) : undefined;
              publishResults.instagram = await publishInstagramReel({
                accessToken: token,
                instagramAccountId: igId,
                videoUrl,
                caption,
                coverUrl: thumbUrl,
              });
            } else if (post.type === "CAROUSEL" && post.slides.length > 1) {
              const imageUrls = await Promise.all(
                post.slides.filter((s) => s.imageKey).map((s) => getPublicMediaUrl(s.imageKey!)),
              );
              if (imageUrls.length > 0) {
                publishResults.instagram = await publishInstagramCarousel({
                  accessToken: token,
                  instagramAccountId: igId,
                  imageUrls,
                  caption,
                });
              }
            } else if (post.thumbnail) {
              const imageUrl = await getPublicMediaUrl(post.thumbnail);
              publishResults.instagram = await publishInstagramImage({
                accessToken: token,
                instagramAccountId: igId,
                imageUrl,
                caption,
              });
            }
          }

          // Facebook page
          if (networks.includes("FACEBOOK") && pageId && token && post.thumbnail) {
            const imageUrl = await getPublicMediaUrl(post.thumbnail);
            const result = await publishFacebookPagePhoto({
              accessToken: token,
              pageId,
              imageUrl,
              message: caption,
            });
            publishResults.facebook = result.post_id ?? result.id;
          }
        } catch (err: any) {
          // Non-fatal: log and continue, mark as published but flag the error
          console.error("[publishPost] Meta API error:", err?.message);
          publishResults.error = err?.message ?? "Erro na publicação Meta";
        }
      }
    }

    const updated = await prisma.nasaPlannerPost.update({
      where: { id: post.id },
      data: {
        status: NasaPlannerPostStatus.PUBLISHED,
        publishedAt: new Date(),
        starsSpent: { increment: STARS_PUBLISH },
        ...(publishResults.instagram && { externalIgPostId: publishResults.instagram }),
        ...(publishResults.facebook && { externalFbPostId: publishResults.facebook }),
      },
      include: { slides: { orderBy: { order: "asc" } } },
    });

    return {
      post: updated,
      balanceAfter: debit.newBalance,
      publishResults,
      metaWarning: publishResults.error ?? null,
    };
  });
