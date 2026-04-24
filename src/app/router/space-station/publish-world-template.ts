import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import prisma from "@/lib/prisma";
import { TemplateCategory } from "@/generated/prisma/enums";
import z from "zod";

export const publishWorldTemplate = base
  .use(requiredAuthMiddleware)
  .route({
    method: "POST",
    path: "/space-station/world-templates",
    summary: "Publish a world map as a shareable template",
  })
  .input(
    z.object({
      name:        z.string().min(1).max(80),
      description: z.string().max(500).optional(),
      category:    z.nativeEnum(TemplateCategory).default("OTHER"),
      mapData:     z.unknown(),
      previewUrl:  z.string().optional().nullable(),
      isPublic:    z.boolean().default(false),
      stationId:   z.string().optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    const userId = context.user.id;
    const template = await prisma.worldTemplate.create({
      data: {
        name:        input.name,
        description: input.description,
        category:    input.category,
        mapData:     input.mapData as never,
        previewUrl:  input.previewUrl ?? null,
        isPublic:    input.isPublic,
        stationId:   input.stationId ?? null,
        authorId:    userId,
      },
    });
    return { template };
  });
