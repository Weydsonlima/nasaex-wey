import { NodeExecutor } from "@/features/workspace-executions/types";
import { NonRetriableError } from "inngest";
import prisma from "@/lib/prisma";
import { wsArchiveActionChannel } from "@/inngest/channels/workspace";
import { ActionContext } from "../../schemas";

export const wsArchiveActionExecutor: NodeExecutor = async ({
  nodeId,
  context,
  step,
  publish,
}) => {
  const realTime = context.realTime as boolean;

  return step.run("ws-archive-action", async () => {
    if (realTime) {
      await publish(
        wsArchiveActionChannel().status({ nodeId, status: "loading" }),
      );
    }
    try {
      const action = context.action as ActionContext | undefined;
      if (!action) throw new NonRetriableError("Action missing");

      await prisma.action.update({
        where: { id: action.id },
        data: { isArchived: true },
      });

      if (realTime) {
        await publish(
          wsArchiveActionChannel().status({ nodeId, status: "success" }),
        );
      }
      return context;
    } catch (err) {
      if (realTime) {
        await publish(
          wsArchiveActionChannel().status({ nodeId, status: "error" }),
        );
      }
      throw err;
    }
  });
};
