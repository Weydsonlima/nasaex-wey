import { NodeExecutor } from "@/features/workspace-executions/types";
import { NonRetriableError } from "inngest";
import prisma from "@/lib/prisma";
import { wsCreateActionChannel } from "@/inngest/channels/workspace";
import { Prisma } from "@/generated/prisma/client";

type Data = {
  action?: {
    title: string;
    description?: string;
    priority: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    columnId: string;
    workspaceId?: string;
  };
};

export const wsCreateActionExecutor: NodeExecutor<Data> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  const realTime = context.realTime as boolean;

  const result = await step.run("ws-create-action", async () => {
    if (realTime) {
      await publish(
        wsCreateActionChannel().status({ nodeId, status: "loading" }),
      );
    }
    try {
      const action = data.action;
      if (!action) throw new NonRetriableError("Action config is missing");

      const workspaceId =
        action.workspaceId ?? (context.workspaceId as string | undefined);
      if (!workspaceId) {
        throw new NonRetriableError("Workspace context is missing");
      }

      const first = await prisma.action.findFirst({
        where: { columnId: action.columnId, workspaceId },
        orderBy: { order: "asc" },
      });
      const newOrder = first
        ? Prisma.Decimal.sub(first.order, 1)
        : new Prisma.Decimal(0);

      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      });
      if (!workspace) throw new NonRetriableError("Workspace not found");

      const created = await prisma.action.create({
        data: {
          title: action.title,
          description: action.description,
          priority: action.priority,
          workspaceId,
          columnId: action.columnId,
          order: newOrder,
          createdBy: workspace.createdBy,
        },
      });

      if (realTime) {
        await publish(
          wsCreateActionChannel().status({ nodeId, status: "success" }),
        );
      }

      return { ...context, action: { id: created.id } };
    } catch (err) {
      if (realTime) {
        await publish(
          wsCreateActionChannel().status({ nodeId, status: "error" }),
        );
      }
      throw err;
    }
  });

  return result;
};
