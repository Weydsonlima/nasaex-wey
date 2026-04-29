import { base } from "@/app/middlewares/base";
import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { requireModerator } from "../utils";

const annotationSchema = z.object({
  x: z.number(),
  y: z.number(),
  angle: z.number().default(0),
  label: z.string().default(""),
});

export const upsertStep = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(
    z.object({
      id: z.string().optional(),
      featureId: z.string(),
      title: z.string().min(1),
      description: z.string().min(1),
      screenshotUrl: z.string().optional().nullable(),
      annotations: z.array(annotationSchema).optional(),
      order: z.number().int().default(0),
    }),
  )
  .handler(async ({ input, context }) => {
    await requireModerator(context.user.id, context.org.id);
    const { id, annotations, ...rest } = input;
    const data = { ...rest, annotations: annotations as any };
    if (id) {
      return await prisma.spaceHelpStep.update({ where: { id }, data });
    }
    return await prisma.spaceHelpStep.create({ data });
  });
