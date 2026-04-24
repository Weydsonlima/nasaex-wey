import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import prisma from "@/lib/prisma";
import { debitStarsInTx } from "@/lib/star-service";
import { StarTransactionType } from "@/generated/prisma/client";
import z from "zod";
import { PAGES_STARS_COST, slugSchema } from "./_schemas";

export const duplicatePage = base
  .use(requiredAuthMiddleware)
  .route({
    method: "POST",
    path: "/pages/:id/duplicate",
    summary: "Duplicar página (cobra 2000 Stars)",
  })
  .input(
    z.object({
      id: z.string(),
      newSlug: slugSchema,
      newTitle: z.string().min(1).max(200),
    }),
  )
  .handler(async ({ input, context, errors }) => {
    const organizationId = context.session.activeOrganizationId;
    if (!organizationId) {
      throw errors.BAD_REQUEST({ message: "Organização não encontrada" });
    }
    const src = await prisma.nasaPage.findFirst({
      where: { id: input.id, organizationId },
    });
    if (!src) throw errors.NOT_FOUND({ message: "Página de origem não encontrada" });

    const taken = await prisma.nasaPage.findUnique({
      where: { slug: input.newSlug },
      select: { id: true },
    });
    if (taken) throw errors.BAD_REQUEST({ message: "Este slug já está em uso" });

    try {
      const copy = await prisma.$transaction(async (tx) => {
        await debitStarsInTx(tx, {
          organizationId,
          amount: PAGES_STARS_COST,
          type: StarTransactionType.APP_SETUP,
          description: `NASA Pages — duplicação de "${src.title}" → "${input.newTitle}"`,
          appSlug: "pages",
          userId: context.user.id,
        });

        return tx.nasaPage.create({
          data: {
            organizationId,
            userId: context.user.id,
            title: input.newTitle,
            slug: input.newSlug,
            description: src.description,
            intent: src.intent,
            layerCount: src.layerCount,
            palette: src.palette as object,
            fontFamily: src.fontFamily,
            layout: src.layout as object,
            starsSpent: PAGES_STARS_COST,
          },
        });
      });
      return { page: copy };
    } catch (e) {
      const msg = (e as Error).message ?? "";
      if (msg.startsWith("INSUFFICIENT_STARS")) {
        throw errors.BAD_REQUEST({
          message: `Saldo de Stars insuficiente (necessário ${PAGES_STARS_COST} ★)`,
        });
      }
      throw e;
    }
  });
