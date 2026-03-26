import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/prisma";
import { z } from "zod";

export const listActionByWorkspace = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(
    z.object({
      workspaceId: z.string(),
    }),
  )
  .handler(async ({ input }) => {
    const action = await prisma.action.findMany({
      where: {
        workspaceId: input.workspaceId,
      },
      orderBy: {
        order: "asc",
      },
      select: {
        id: true,
        title: true,
        description: true,
        dueDate: true,
        startDate: true,
        columnId: true,
        createdBy: true,
        participants: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        createdAt: true,
      },
    });

    return { action };
  });
