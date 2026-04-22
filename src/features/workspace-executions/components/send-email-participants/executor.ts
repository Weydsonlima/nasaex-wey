import { NodeExecutor } from "@/features/workspace-executions/types";
import { NonRetriableError } from "inngest";
import prisma from "@/lib/prisma";
import { wsSendEmailChannel } from "@/inngest/channels/workspace";
import { ActionContext } from "../../schemas";
import { renderWorkspaceVariables } from "../../lib/render-variables";

type Data = {
  action?: {
    subject: string;
    body: string;
  };
};

export const wsSendEmailParticipantsExecutor: NodeExecutor<Data> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  const realTime = context.realTime as boolean;

  return step.run("ws-send-email-participants", async () => {
    if (realTime) {
      await publish(
        wsSendEmailChannel().status({ nodeId, status: "loading" }),
      );
    }
    try {
      const action = context.action as ActionContext | undefined;
      const cfg = data.action;
      if (!action || !cfg?.subject || !cfg?.body) {
        throw new NonRetriableError("Action or email config missing");
      }

      const workspace = await prisma.workspace.findUnique({
        where: { id: action.workspaceId },
      });
      if (!workspace) throw new NonRetriableError("Workspace not found");

      const column = action.columnId
        ? await prisma.workspaceColumn.findUnique({
            where: { id: action.columnId },
          })
        : null;

      const participants = await prisma.user.findMany({
        where: { id: { in: action.participantIds } },
      });

      for (const participant of participants) {
        if (!participant.email) continue;

        const rendered = renderWorkspaceVariables(cfg.body, {
          action,
          workspace: { name: workspace.name },
          column: column ? { name: column.name } : undefined,
          participant: {
            name: participant.name,
            email: participant.email,
          },
        });

        // Envio de email: registrar notificação no sistema, que aciona
        // os providers configurados (o projeto já possui UserNotification).
        await prisma.userNotification.create({
          data: {
            userId: participant.id,
            title: cfg.subject,
            body: rendered,
            type: "CUSTOM",
            appKey: "workspace",
            actionUrl: `/workspaces/${workspace.id}?actionId=${action.id}`,
          },
        });
      }

      if (realTime) {
        await publish(
          wsSendEmailChannel().status({ nodeId, status: "success" }),
        );
      }
      return context;
    } catch (err) {
      if (realTime) {
        await publish(
          wsSendEmailChannel().status({ nodeId, status: "error" }),
        );
      }
      throw err;
    }
  });
};
