import { NodeExecutor } from "@/features/workspace-executions/types";
import { NonRetriableError } from "inngest";
import { actionContext } from "@/features/workspace-executions/schemas";

export const wsActionCompletedExecutor: NodeExecutor = async ({
  context,
  step,
}) => {
  return step.run("ws-action-completed-trigger", async () => {
    const parsed = actionContext.safeParse((context as any).action);
    if (!parsed.success) {
      throw new NonRetriableError("Invalid action data on context");
    }
    if (!parsed.data.isDone) {
      throw new NonRetriableError("Action is not completed");
    }
    return { ...context, action: parsed.data, realTime: false };
  });
};
