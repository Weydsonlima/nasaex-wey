"use client";

import { Node, NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { PlusSquareIcon } from "lucide-react";
import { WsBaseExecutionNode } from "../base-execution-node";
import { SimpleDialog } from "../_shared/simple-dialog";
import { useNodeStatus } from "@/features/executions/hook/use-node-status";
import { WS_CREATE_ACTION_CHANNEL_NAME } from "@/inngest/channels/workspace";
import { fetchWsCreateActionToken } from "../../lib/realtime-tokens";

type Values = {
  title: string;
  description?: string;
  priority: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  workspaceId?: string;
  columnId: string;
};
type Data = { action?: Values };

export const WsCreateActionNode = memo((props: NodeProps<Node<Data>>) => {
  const [open, setOpen] = useState(false);
  const { setNodes } = useReactFlow();
  const status = useNodeStatus({
    nodeId: props.id,
    channel: WS_CREATE_ACTION_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchWsCreateActionToken as any,
  });

  const handleSubmit = (v: Values) =>
    setNodes((nodes) =>
      nodes.map((n) =>
        n.id === props.id
          ? { ...n, data: { ...(n.data as any), action: v } }
          : n,
      ),
    );

  return (
    <>
      <SimpleDialog<Values>
        open={open}
        onOpenChange={setOpen}
        title="Criar ação"
        description="A ação será criada no workspace atual."
        fields={[
          { kind: "text", name: "title", label: "Título" },
          { kind: "textarea", name: "description", label: "Descrição" },
          {
            kind: "select",
            name: "priority",
            label: "Prioridade",
            options: [
              { value: "NONE", label: "Nenhuma" },
              { value: "LOW", label: "Baixa" },
              { value: "MEDIUM", label: "Média" },
              { value: "HIGH", label: "Alta" },
              { value: "URGENT", label: "Urgente" },
            ],
          },
          { kind: "workspace", name: "workspaceId", label: "Workspace destino", optional: true },
          { kind: "column", name: "columnId", label: "Coluna", workspaceIdFrom: "workspaceId" },
        ]}
        defaultValues={props.data?.action}
        onSubmit={handleSubmit}
      />
      <WsBaseExecutionNode
        {...props}
        icon={PlusSquareIcon}
        name="Criar ação"
        description={props.data?.action?.title ?? "Configure a nova ação"}
        status={status}
        onSettings={() => setOpen(true)}
        onDoubleClick={() => setOpen(true)}
      />
    </>
  );
});
WsCreateActionNode.displayName = "WsCreateActionNode";
