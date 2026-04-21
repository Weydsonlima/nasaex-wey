"use client";

import { Node, NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { TagsIcon } from "lucide-react";
import { WsBaseTriggerNode } from "@/features/workspace-triggers/components/base-trigger-node";
import { SimpleDialog } from "@/features/workspace-executions/components/_shared/simple-dialog";

type Values = { tagId?: string };
type Data = { action?: Values };

export const WsActionTaggedNode = memo((props: NodeProps<Node<Data>>) => {
  const [open, setOpen] = useState(false);
  const { setNodes } = useReactFlow();
  const handleSubmit = (v: Values) =>
    setNodes((nodes) =>
      nodes.map((n) =>
        n.id === props.id ? { ...n, data: { ...(n.data as any), action: v } } : n,
      ),
    );

  return (
    <>
      <SimpleDialog<Values>
        open={open}
        onOpenChange={setOpen}
        title="Ação recebe etiqueta"
        description="Dispara quando uma etiqueta é adicionada. Deixe em branco para qualquer etiqueta."
        fields={[{ kind: "tag", name: "tagId", label: "Etiqueta", optional: true }]}
        defaultValues={props.data?.action}
        onSubmit={handleSubmit}
      />
      <WsBaseTriggerNode
        {...props}
        icon={TagsIcon}
        name="Ação etiquetada"
        description={
          props.data?.action?.tagId ? "Etiqueta definida" : "Qualquer etiqueta"
        }
        onSettings={() => setOpen(true)}
        onDoubleClick={() => setOpen(true)}
      />
    </>
  );
});
WsActionTaggedNode.displayName = "WsActionTaggedNode";
