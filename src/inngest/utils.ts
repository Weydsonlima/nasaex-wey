import { Connection, Node } from "@/generated/prisma/client";
import toposort from "toposort";
import { inngest } from "./client";

export const topologicalSort = (
  nodes: Node[],
  connections: Connection[]
): Node[] => {
  if (connections.length === 0) {
    return nodes;
  }

  const edges: [string, string][] = connections.map((conn) => [
    conn.fromNodeId,
    conn.toNodeId,
  ]);

  const connectedNodeIds = new Set<string>();

  for (const conn of connections) {
    connectedNodeIds.add(conn.fromNodeId);
    connectedNodeIds.add(conn.toNodeId);
  }

  for (const node of nodes) {
    if (!connectedNodeIds.has(node.id)) {
      edges.push([node.id, node.id]);
    }
  }

  // Perform topological sort
  let sortedNodeIds: string[];

  try {
    sortedNodeIds = toposort(edges);
    // Remove dublicates (from self-edges)
    sortedNodeIds = [...new Set(sortedNodeIds)];
  } catch (error) {
    if (error instanceof Error && error.message.includes("Cyclic")) {
      throw new Error("Workflow has a cycle");
    }
    throw error;
  }

  // Map sorted node IDS back to node objects
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  return sortedNodeIds.map((id) => nodeMap.get(id)!).filter(Boolean);
};

export const sendWorkflowExecution = async (data: {
  workflowId: string;
  [key: string]: any;
}) => {
  return inngest.send({
    name: "workflow/execute.workflow",
    data,
  });
};

export type WorkspaceWorkflowTrigger =
  | "WS_MANUAL_TRIGGER"
  | "WS_ACTION_CREATED"
  | "WS_ACTION_MOVED_COLUMN"
  | "WS_ACTION_TAGGED"
  | "WS_ACTION_COMPLETED"
  | "WS_ACTION_PARTICIPANT_ADDED";

export const sendWorkspaceWorkflowEvent = async (data: {
  trigger: WorkspaceWorkflowTrigger;
  workspaceId: string;
  actionId?: string;
  workflowId?: string; // optional: force a specific workflow (manual trigger)
  initialData?: Record<string, any>;
  [key: string]: any;
}) => {
  return inngest.send({
    name: "workspace-workflow/trigger",
    data,
  });
};
