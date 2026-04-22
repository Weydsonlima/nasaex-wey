import { NodeExecutor } from "@/features/workspace-executions/types";
import { NonRetriableError } from "inngest";
import prisma from "@/lib/prisma";
import { wsAddParticipantChannel } from "@/inngest/channels/workspace";
import { ActionContext } from "../../schemas";
import { loadActionContext } from "../../lib/load-action-context";

type Data = {
  action?: { userId: string };
};

export const wsAddParticipantExecutor: NodeExecutor<Data> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  const realTime = context.realTime as boolean;

  return step.run("ws-add-participant", async () => {
    if (realTime) {
      await publish(
        wsAddParticipantChannel().status({ nodeId, status: "loading" }),
      );
    }
    try {
      const action = context.action as ActionContext | undefined;
      const userId = data.action?.userId;
      if (!action || !userId) {
        throw new NonRetriableError("Action or user missing");
      }

      await prisma.actionsUserParticipant.upsert({
        where: { actionId_userId: { actionId: action.id, userId } },
        create: { actionId: action.id, userId },
        update: {},
      });

      const refreshed = await loadActionContext(action.id);

      if (realTime) {
        await publish(
          wsAddParticipantChannel().status({ nodeId, status: "success" }),
        );
      }
      return { ...context, action: refreshed ?? action };
    } catch (err) {
      if (realTime) {
        await publish(
          wsAddParticipantChannel().status({ nodeId, status: "error" }),
        );
      }
      throw err;
    }
  });
};
