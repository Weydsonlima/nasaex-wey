import { NonRetriableError } from "inngest";
import { inngest } from "../client";
import prisma from "@/lib/prisma";
import { topologicalSort } from "../utils";
import { WorkspaceNodeType } from "@/generated/prisma/enums";
import { getWorkspaceExecutor } from "@/features/workspace-executions/lib/executor-registry";
import { loadActionContext } from "@/features/workspace-executions/lib/load-action-context";
import {
  wsAddParticipantChannel,
  wsAddTagChannel,
  wsArchiveActionChannel,
  wsCreateActionChannel,
  wsCreateSubActionChannel,
  wsFilterChannel,
  wsManualTriggerChannel,
  wsMoveActionChannel,
  wsSendEmailChannel,
  wsSendMessageChannel,
  wsSetResponsibleChannel,
  wsWaitChannel,
} from "../channels/workspace";

const triggerToNodeType: Record<string, WorkspaceNodeType> = {
  WS_MANUAL_TRIGGER: WorkspaceNodeType.WS_MANUAL_TRIGGER,
  WS_ACTION_CREATED: WorkspaceNodeType.WS_ACTION_CREATED,
  WS_ACTION_MOVED_COLUMN: WorkspaceNodeType.WS_ACTION_MOVED_COLUMN,
  WS_ACTION_TAGGED: WorkspaceNodeType.WS_ACTION_TAGGED,
  WS_ACTION_COMPLETED: WorkspaceNodeType.WS_ACTION_COMPLETED,
  WS_ACTION_PARTICIPANT_ADDED: WorkspaceNodeType.WS_ACTION_PARTICIPANT_ADDED,
};

export const executeWorkspaceWorkflow = inngest.createFunction(
  { id: "execute-workspace-workflow", retries: 0 },
  {
    event: "workspace-workflow/trigger",
    channels: [
      wsManualTriggerChannel(),
      wsCreateActionChannel(),
      wsMoveActionChannel(),
      wsAddTagChannel(),
      wsAddParticipantChannel(),
      wsSetResponsibleChannel(),
      wsCreateSubActionChannel(),
      wsSendMessageChannel(),
      wsSendEmailChannel(),
      wsArchiveActionChannel(),
      wsWaitChannel(),
      wsFilterChannel(),
    ],
  },
  async ({ event, step, publish }) => {
    const { trigger, workspaceId, actionId, workflowId, initialData } =
      event.data as {
        trigger: keyof typeof triggerToNodeType;
        workspaceId: string;
        actionId?: string;
        workflowId?: string;
        initialData?: Record<string, any>;
      };

    const triggerNodeType = triggerToNodeType[trigger];
    if (!triggerNodeType) {
      throw new NonRetriableError(`Unknown workspace trigger: ${trigger}`);
    }

    const workflows = await step.run("find-ws-workflows", async () => {
      if (workflowId) {
        const wf = await prisma.workspaceWorkflow.findUnique({
          where: { id: workflowId },
          include: { nodes: true, connections: true },
        });
        return wf ? [wf] : [];
      }
      return prisma.workspaceWorkflow.findMany({
        where: {
          workspaceId,
          isActive: true,
          nodes: { some: { type: triggerNodeType } },
        },
        include: { nodes: true, connections: true },
      });
    });

    if (!workflows.length) return { ran: 0 };

    const actionCtx = actionId ? await loadActionContext(actionId) : null;

    let ran = 0;
    for (const wf of workflows) {
      const sortedNodes = topologicalSort(
        wf.nodes as any,
        wf.connections as any,
      );
      let context: Record<string, any> = {
        ...(initialData ?? {}),
        workspaceId: wf.workspaceId,
        action: actionCtx ?? (initialData as any)?.action,
        realTime: Boolean(workflowId), // manual execution → realtime UI
      };

      try {
        for (const node of sortedNodes) {
          const executor = getWorkspaceExecutor(
            node.type as WorkspaceNodeType,
          );
          context = await executor({
            data: node.data as Record<string, unknown>,
            nodeId: node.id,
            context,
            step,
            publish,
          });
        }
        ran++;
      } catch (err) {
        if (err instanceof NonRetriableError) {
          // workflow falhou uma condição (filter, trigger mismatch); segue para o próximo
          continue;
        }
        throw err;
      }
    }

    return { ran, total: workflows.length };
  },
);
