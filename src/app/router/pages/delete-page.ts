import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import prisma from "@/lib/prisma";
import z from "zod";

export const deletePage = base
  .use(requiredAuthMiddleware)
  .route({
    method: "DELETE",
    path: "/pages/:id",
    summary: "Excluir página (hard delete — cascade em versions/assets/visits/domain)",
  })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context, errors }) => {
    const organizationId = context.session.activeOrganizationId;
    if (!organizationId) {
      throw errors.BAD_REQUEST({ message: "Organização não encontrada" });
    }
    const existing = await prisma.nasaPage.findFirst({
      where: { id: input.id, organizationId },
      select: { id: true },
    });
    if (!existing) throw errors.NOT_FOUND({ message: "Página não encontrada" });

    await prisma.nasaPage.delete({ where: { id: input.id } });
    return { success: true };
  });
