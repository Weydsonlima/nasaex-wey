"use client";

import { Node, NodeProps } from "@xyflow/react";
import { memo } from "react";
import { FunnelIcon } from "lucide-react";
import { WsBaseExecutionNode } from "../base-execution-node";
import { useNodeStatus } from "@/features/executions/hook/use-node-status";
import { WS_FILTER_CHANNEL_NAME } from "@/inngest/channels/workspace";
import { fetchWsFilterToken } from "../../lib/realtime-tokens";

export const WsFilterNode = memo((props: NodeProps<Node>) => {
  const status = useNodeStatus({
    nodeId: props.id,
    channel: WS_FILTER_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchWsFilterToken as any,
  });
  return (
    <WsBaseExecutionNode
      {...props}
      icon={FunnelIcon}
      name="Filtrar"
      description="Condição booleana sobre a ação"
      status={status}
    />
  );
});
WsFilterNode.displayName = "WsFilterNode";
