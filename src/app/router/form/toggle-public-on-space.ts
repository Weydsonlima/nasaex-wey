import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/prisma";
import z from "zod";

/**
 * Aprovação explícita do dono para exibir o formulário na Spacehome pública.
 * Independente de `published` (que controla apenas se o form aceita respostas).
 *
 * Sem esse toggle ligado, o form NÃO aparece em /space/[nick] mesmo que esteja
 * publicado para uso interno via shareUrl.
 */
export const togglePublicOnSpace = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .route({
    method: "PATCH",
    path: "/forms/:id/public-on-space",
    summary: "Toggle Spacehome visibility for a form",
  })
  .input(
    z.object({
      id:              z.string(),
      isPublicOnSpace: z.boolean(),
    }),
  )
  .handler(async ({ input, context, errors }) => {
    // Garante que o form pertence à org do usuário
    const existing = await prisma.form.findFirst({
      where: { id: input.id, organizationId: context.org.id },
      select: { id: true },
    });
    if (!existing) {
      throw errors.NOT_FOUND({ message: "Formulário não encontrado." });
    }

    const form = await prisma.form.update({
      where: { id: input.id },
      data:  { isPublicOnSpace: input.isPublicOnSpace },
      select: { id: true, isPublicOnSpace: true },
    });

    return {
      message: form.isPublicOnSpace
        ? "Formulário agora aparece na Spacehome pública."
        : "Formulário removido da Spacehome pública.",
      isPublicOnSpace: form.isPublicOnSpace,
    };
  });
