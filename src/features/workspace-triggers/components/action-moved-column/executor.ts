import { NodeExecutor } from "@/features/workspace-executions/types";
import { NonRetriableError } from "inngest";
import { actionContext } from "@/features/workspace-executions/schemas";

type Data = {
  action?: { columnId?: string };
};

export const wsActionMovedColumnExecutor: NodeExecutor<Data> = async ({
  data,
  context,
  step,
}) => {
  return step.run("ws-action-moved-column-trigger", async () => {
    const parsed = actionContext.safeParse((context as any).action);
    if (!parsed.success) {
      throw new NonRetriableError("Invalid action data on context");
    }
    const expectedColumnId = data.action?.columnId;
    if (expectedColumnId && parsed.data.columnId !== expectedColumnId) {
      throw new NonRetriableError("Column does not match trigger config");
    }
    return { ...context, action: parsed.data, realTime: false };
  });
};
