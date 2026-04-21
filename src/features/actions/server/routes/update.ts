import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { awardPoints } from "@/app/router/space-point/utils";
import { sendWorkspaceWorkflowEvent } from "@/inngest/utils";

export const updateAction = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(
    z.object({
      actionId: z.string(),
      title: z.string().min(1).optional(),
      description: z.string().nullable().optional(),
      priority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
      columnId: z.string().nullable().optional(),
      dueDate: z.date().nullable().optional(),
      startDate: z.date().nullable().optional(),
      endDate: z.date().nullable().optional(),
      isDone: z.boolean().optional(),
      orgProjectId: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    const { actionId, ...data } = input;
    const { session } = context;

    const previous = await prisma.action.findUnique({
      where: { id: actionId },
    });

    const action = await prisma.action.update({
      where: { id: actionId },
      data: {
        ...data,
        closedAt:
          data.isDone === true
            ? new Date()
            : data.isDone === false
              ? null
              : undefined,
      },
    });

    // Somente pontua quando transiciona de não-feito para concluído
    if (previous && !previous.isDone && data.isDone === true) {
      const orgId = session.activeOrganizationId;
      if (orgId) {
        await awardPoints(
          previous.createdBy,
          orgId,
          "complete_card",
          "Card concluído ✅",
        );
      }
      try {
        await sendWorkspaceWorkflowEvent({
          trigger: "WS_ACTION_COMPLETED",
          workspaceId: action.workspaceId,
          actionId: action.id,
        });
      } catch (err) {
        console.error(
          "[workspace-workflow] failed to emit action.completed",
          err,
        );
      }
    }

    if (
      previous &&
      data.columnId !== undefined &&
      previous.columnId !== data.columnId
    ) {
      try {
        await sendWorkspaceWorkflowEvent({
          trigger: "WS_ACTION_MOVED_COLUMN",
          workspaceId: action.workspaceId,
          actionId: action.id,
        });
      } catch (err) {
        console.error(
          "[workspace-workflow] failed to emit action.moved (update)",
          err,
        );
      }
    }

    return { action };
  });
