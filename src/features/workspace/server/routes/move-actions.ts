import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/prisma";
import { sendWorkspaceWorkflowEvent } from "@/inngest/utils";
import { z } from "zod";

export const moveActions = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(
    z.object({
      actionIds: z.array(z.string()),
      columnId: z.string(),
      workspaceId: z.string(),
    }),
  )
  .handler(async ({ input, context }) => {
    const actions = await prisma.action.findMany({
      where: { id: { in: input.actionIds } },
      select: { id: true, history: true },
    });

    const timestamp = new Date().toISOString();

    await prisma.$transaction(
      actions.map((action) => {
        const history = (action.history as any[]) ?? [];
        return prisma.action.update({
          where: { id: action.id },
          data: {
            columnId: input.columnId,
            workspaceId: input.workspaceId,
            history: [
              ...history,
              {
                type: "move",
                userId: context.user.id,
                timestamp,
                to: {
                  columnId: input.columnId,
                  workspaceId: input.workspaceId,
                },
              },
            ],
          },
        });
      }),
    );

    for (const a of actions) {
      try {
        await sendWorkspaceWorkflowEvent({
          trigger: "WS_ACTION_MOVED_COLUMN",
          workspaceId: input.workspaceId,
          actionId: a.id,
        });
      } catch (err) {
        console.error(
          "[workspace-workflow] failed to emit action.moved (bulk)",
          err,
        );
      }
    }

    return { success: true };
  });
