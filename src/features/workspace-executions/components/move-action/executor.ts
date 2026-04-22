import { NodeExecutor } from "@/features/workspace-executions/types";
import { NonRetriableError } from "inngest";
import prisma from "@/lib/prisma";
import { wsMoveActionChannel } from "@/inngest/channels/workspace";
import { ActionContext } from "../../schemas";
import { loadActionContext } from "../../lib/load-action-context";

type Data = {
  action?: {
    columnId: string;
    workspaceId?: string;
  };
};

export const wsMoveActionExecutor: NodeExecutor<Data> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  const realTime = context.realTime as boolean;

  return step.run("ws-move-action", async () => {
    if (realTime) {
      await publish(
        wsMoveActionChannel().status({ nodeId, status: "loading" }),
      );
    }
    try {
      const action = context.action as ActionContext | undefined;
      const cfg = data.action;
      if (!action || !cfg) {
        throw new NonRetriableError("Action or config missing");
      }

      const workspaceId = cfg.workspaceId ?? action.workspaceId;

      const existing = await prisma.action.findUnique({
        where: { id: action.id },
        select: { history: true },
      });
      const history = (existing?.history as any[]) ?? [];

      await prisma.action.update({
        where: { id: action.id },
        data: {
          columnId: cfg.columnId,
          workspaceId,
          history: [
            ...history,
            {
              type: "move",
              timestamp: new Date().toISOString(),
              source: "workflow",
              to: { columnId: cfg.columnId, workspaceId },
            },
          ],
        },
      });

      const refreshed = await loadActionContext(action.id);

      if (realTime) {
        await publish(
          wsMoveActionChannel().status({ nodeId, status: "success" }),
        );
      }
      return { ...context, action: refreshed ?? action };
    } catch (err) {
      if (realTime) {
        await publish(
          wsMoveActionChannel().status({ nodeId, status: "error" }),
        );
      }
      throw err;
    }
  });
};
