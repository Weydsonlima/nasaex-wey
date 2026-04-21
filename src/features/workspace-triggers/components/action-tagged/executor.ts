import { NodeExecutor } from "@/features/workspace-executions/types";
import { NonRetriableError } from "inngest";
import { actionContext } from "@/features/workspace-executions/schemas";

type Data = {
  action?: { tagId?: string };
};

export const wsActionTaggedExecutor: NodeExecutor<Data> = async ({
  data,
  context,
  step,
}) => {
  return step.run("ws-action-tagged-trigger", async () => {
    const parsed = actionContext.safeParse((context as any).action);
    if (!parsed.success) {
      throw new NonRetriableError("Invalid action data on context");
    }
    const expectedTagId = data.action?.tagId;
    if (expectedTagId && !parsed.data.tagIds.includes(expectedTagId)) {
      throw new NonRetriableError("Tag does not match trigger config");
    }
    return { ...context, action: parsed.data, realTime: false };
  });
};
