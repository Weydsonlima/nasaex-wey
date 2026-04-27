import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import z from "zod";

export const updateLinnkerPage = base
  .use(requiredAuthMiddleware)
  .route({
    method: "PATCH",
    path: "/linnker/pages/:id",
    summary: "Update a Linnker page",
  })
  .input(
    z.object({
      id: z.string(),
      title: z.string().min(1).optional(),
      bio: z.string().optional().nullable(),
      avatarUrl: z.string().optional().nullable(),
      coverColor: z.string().optional(),
      buttonStyle: z.enum(["rounded", "sharp", "pill"]).optional(),
      isPublished: z.boolean().optional(),
      bannerUrl: z.string().optional().nullable(),
      backgroundColor: z.string().optional().nullable(),
      backgroundImage: z.string().optional().nullable(),
      backgroundOpacity: z.number().min(0).max(1).optional(),
      socialLinks: z.array(z.object({ platform: z.string(), url: z.string() })).optional().nullable(),
      socialIconColor: z.string().optional().nullable(),
      titleColor: z.string().optional().nullable(),
      bioColor: z.string().optional().nullable(),
    }),
  )
  .handler(async ({ input, context, errors }) => {
    const { id, socialLinks, ...rest } = input;
    const organizationId = context.session.activeOrganizationId;
    if (!organizationId) throw errors.BAD_REQUEST({ message: "Organization not found" });

    const page = await prisma.linnkerPage.findFirst({ where: { id, organizationId } });
    if (!page) throw errors.NOT_FOUND({ message: "Página não encontrada" });

    // Campo Json? requer Prisma.DbNull para setar SQL NULL (não JS null)
    const data = {
      ...rest,
      ...(socialLinks !== undefined
        ? { socialLinks: socialLinks === null ? Prisma.DbNull : socialLinks }
        : {}),
    };

    const updated = await prisma.linnkerPage.update({
      where: { id },
      data,
      include: { links: { orderBy: { position: "asc" } } },
    });

    return { message: "Página atualizada", page: updated };
  });
