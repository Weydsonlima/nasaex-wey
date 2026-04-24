import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import prisma from "@/lib/prisma";

export const listPages = base
  .use(requiredAuthMiddleware)
  .route({
    method: "GET",
    path: "/pages",
    summary: "Listar páginas da organização",
  })
  .handler(async ({ context, errors }) => {
    const organizationId = context.session.activeOrganizationId;
    if (!organizationId) {
      throw errors.BAD_REQUEST({ message: "Organização não encontrada" });
    }
    const pages = await prisma.nasaPage.findMany({
      where: { organizationId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        intent: true,
        status: true,
        layerCount: true,
        customDomain: true,
        domainStatus: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return { pages };
  });
