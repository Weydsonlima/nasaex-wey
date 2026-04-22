import { NodeExecutor } from "@/features/workspace-executions/types";
import { NonRetriableError } from "inngest";
import prisma from "@/lib/prisma";
import { wsSendMessageChannel } from "@/inngest/channels/workspace";
import { ActionContext } from "../../schemas";
import { renderWorkspaceVariables } from "../../lib/render-variables";
import { sendTextMessage } from "@/features/executions/components/send-message/message/send-text-message";

type Data = {
  action?: {
    message: string;
  };
};

export const wsSendMessageParticipantsExecutor: NodeExecutor<Data> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  const realTime = context.realTime as boolean;

  return step.run("ws-send-message-participants", async () => {
    if (realTime) {
      await publish(
        wsSendMessageChannel().status({ nodeId, status: "loading" }),
      );
    }
    try {
      const action = context.action as ActionContext | undefined;
      const message = data.action?.message;
      if (!action || !message) {
        throw new NonRetriableError("Action or message missing");
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

      const leads = await prisma.lead.findMany({
        where: {
          phone: { in: participants.map((p) => p.email ?? "").filter(Boolean) },
        },
        include: { tracking: true },
        take: 0,
      });
      void leads;

      // Não temos integração direta workspace → whatsapp. Quando o workspace
      // está vinculado a um tracking, usamos a instância desse tracking e o
      // participante deve ter um lead associado pelo email.
      if (!workspace.trackingId) {
        throw new NonRetriableError(
          "Workspace sem tracking vinculado, não é possível enviar mensagem",
        );
      }

      const instance = await prisma.whatsAppInstance.findFirst({
        where: { trackingId: workspace.trackingId },
      });
      if (!instance) throw new NonRetriableError("Instance not found");

      for (const participant of participants) {
        const lead = await prisma.lead.findFirst({
          where: {
            trackingId: workspace.trackingId,
            OR: [
              participant.email ? { email: participant.email } : undefined,
            ].filter(Boolean) as any,
          },
          include: { tracking: true, status: true },
        });
        if (!lead || !lead.phone) continue;

        const conversation = await prisma.conversation.findFirst({
          where: { leadId: lead.id, trackingId: workspace.trackingId },
        });
        if (!conversation) continue;

        const body = renderWorkspaceVariables(message, {
          action,
          workspace: { name: workspace.name },
          column: column ? { name: column.name } : undefined,
          participant: {
            name: participant.name,
            email: participant.email ?? "",
          },
        });

        await sendTextMessage({
          body,
          conversationId: conversation.id,
          leadPhone: lead.phone,
          token: instance.apiKey,
        });
      }

      if (realTime) {
        await publish(
          wsSendMessageChannel().status({ nodeId, status: "success" }),
        );
      }
      return context;
    } catch (err) {
      if (realTime) {
        await publish(
          wsSendMessageChannel().status({ nodeId, status: "error" }),
        );
      }
      throw err;
    }
  });
};
