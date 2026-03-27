import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/prisma";
import { z } from "zod";

export const removeResponsible = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(
    z.object({
      actionId: z.string(),
      userId: z.string(),
    }),
  )
  .handler(async ({ input }) => {
    const responsible = await prisma.actionsUserResponsible.delete({
      where: {
        actionId_userId: {
          actionId: input.actionId,
          userId: input.userId,
        },
      },
    });

    return { responsible };
  });
