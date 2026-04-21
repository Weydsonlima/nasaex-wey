import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { sendWorkspaceWorkflowEvent } from "@/inngest/utils";
import prisma from "@/lib/prisma";
import { z } from "zod";

export const executeWorkspaceWorkflowRoute = base
  .use(requiredAuthMiddleware)
  .input(
    z.object({
      id: z.string(),
      actionId: z.string().optional(),
    }),
  )
  .handler(async ({ input, errors }) => {
    const wf = await prisma.workspaceWorkflow.findUnique({
      where: { id: input.id },
    });
    if (!wf) throw errors.NOT_FOUND({ message: "Workflow não encontrado" });

    await sendWorkspaceWorkflowEvent({
      trigger: "WS_MANUAL_TRIGGER",
      workspaceId: wf.workspaceId,
      actionId: input.actionId,
      workflowId: wf.id,
    });

    return wf;
  });
