import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/prisma";
import { z } from "zod";

export const getWorkspaceCalendar = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(
    z.object({
      startDate: z.string(),
      endDate: z.string(),
    }),
  )
  .handler(async ({ input, context }) => {
    const start = new Date(input.startDate);
    const end = new Date(input.endDate);
    end.setHours(23, 59, 59, 999);

    const actions = await prisma.action.findMany({
      where: {
        organizationId: context.org.id,
        isArchived: false,
        AND: [
          {
            OR: [
              { createdBy: context.user.id },
              { participants: { some: { userId: context.user.id } } },
            ],
          },
          {
            OR: [
              { dueDate: { gte: start, lte: end } },
              { startDate: { gte: start, lte: end } },
            ],
          },
        ],
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        startDate: true,
        priority: true,
        isDone: true,
        workspaceId: true,
        workspace: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    return { actions };
  });
