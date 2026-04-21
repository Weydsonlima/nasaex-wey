import { NodeExecutor } from "@/features/workspace-executions/types";
import { NonRetriableError } from "inngest";
import prisma from "@/lib/prisma";
import { wsCreateSubActionChannel } from "@/inngest/channels/workspace";
import { ActionContext } from "../../schemas";

type Data = {
  action?: {
    title: string;
    description?: string;
  };
};

export const wsCreateSubActionExecutor: NodeExecutor<Data> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  const realTime = context.realTime as boolean;

  return step.run("ws-create-sub-action", async () => {
    if (realTime) {
      await publish(
        wsCreateSubActionChannel().status({ nodeId, status: "loading" }),
      );
    }
    try {
      const action = context.action as ActionContext | undefined;
      if (!action || !data.action?.title) {
        throw new NonRetriableError("Action or title missing");
      }

      await prisma.subActions.create({
        data: {
          title: data.action.title,
          description: data.action.description,
          actionId: action.id,
        },
      });

      if (realTime) {
        await publish(
          wsCreateSubActionChannel().status({ nodeId, status: "success" }),
        );
      }
      return context;
    } catch (err) {
      if (realTime) {
        await publish(
          wsCreateSubActionChannel().status({ nodeId, status: "error" }),
        );
      }
      throw err;
    }
  });
};
