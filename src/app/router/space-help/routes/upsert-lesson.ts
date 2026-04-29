import { base } from "@/app/middlewares/base";
import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { requireModerator } from "../utils";

export const upsertLesson = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(
    z.object({
      id: z.string().optional(),
      trackId: z.string(),
      title: z.string().min(1),
      summary: z.string().optional().nullable(),
      contentMd: z.string().optional().nullable(),
      youtubeUrl: z.string().optional().nullable(),
      durationMin: z.number().int().optional().nullable(),
      order: z.number().int().default(0),
    }),
  )
  .handler(async ({ input, context }) => {
    await requireModerator(context.user.id, context.org.id);
    const { id, ...data } = input;
    if (id) {
      return await prisma.spaceHelpLesson.update({ where: { id }, data });
    }
    return await prisma.spaceHelpLesson.create({ data });
  });
