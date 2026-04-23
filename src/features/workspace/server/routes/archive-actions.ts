import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/prisma";
import { logOrgActivity } from "@/lib/org-activity-log";
import { z } from "zod";

export const archiveActions = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(z.object({ actionIds: z.array(z.string()) }))
  .handler(async ({ input, context }) => {
    const actions = await prisma.action.findMany({
      where: { id: { in: input.actionIds } },
      select: { id: true, workspaceId: true, columnId: true },
    });

    await prisma.$transaction(
      actions.map((action) =>
        prisma.action.update({
          where: { id: action.id },
          data: {
            isArchived: true,
          },
        }),
      ),
    );

    await Promise.all(
      actions.map((action) =>
        logOrgActivity({
          organizationId: context.org.id,
          userId: context.user.id,
          userName: context.user.name ?? "Usuário",
          userEmail: context.user.email ?? "",
          action: "action.archived",
          resource: "action",
          resourceId: action.id,
          metadata: {
            workspaceId: action.workspaceId,
            columnId: action.columnId,
          },
        }),
      ),
    );

    return { success: true };
  });
