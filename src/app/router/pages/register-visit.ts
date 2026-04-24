import { base } from "@/app/middlewares/base";
import prisma from "@/lib/prisma";
import z from "zod";

export const registerPageVisit = base
  .route({
    method: "POST",
    path: "/public/pages/:slug/visit",
    summary: "Registrar visita pública (analytics)",
  })
  .input(
    z.object({
      slug: z.string(),
      path: z.string().optional(),
      referrer: z.string().optional(),
      userAgent: z.string().optional(),
      country: z.string().optional(),
      device: z.enum(["desktop", "tablet", "mobile"]).optional(),
    }),
  )
  .handler(async ({ input }) => {
    const page = await prisma.nasaPage.findFirst({
      where: { slug: input.slug, status: "PUBLISHED" },
      select: { id: true },
    });
    if (!page) return { success: false };

    await prisma.nasaPageVisit.create({
      data: {
        pageId: page.id,
        path: input.path,
        referrer: input.referrer,
        userAgent: input.userAgent,
        country: input.country,
        device: input.device,
      },
    });
    return { success: true };
  });
