"use client";

import { Node, NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useEffect, useState } from "react";
import { TagsIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { WsBaseTriggerNode } from "@/features/workspace-triggers/components/base-trigger-node";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useListTags } from "@/features/workspace/hooks/use-workspace";

type Values = { tagIds: string[] };
type Data = { action?: Partial<Values> & { tagId?: string } };

export const WsActionTaggedNode = memo((props: NodeProps<Node<Data>>) => {
  const [open, setOpen] = useState(false);
  const { setNodes } = useReactFlow();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { tags, isLoading } = useListTags(workspaceId);

  // Migração leve: se vier tagId legado, considera como array inicial.
  const initialTagIds: string[] =
    props.data?.action?.tagIds ??
    (props.data?.action?.tagId ? [props.data.action.tagId] : []);

  const [selected, setSelected] = useState<string[]>(initialTagIds);

  useEffect(() => {
    if (open) setSelected(initialTagIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );

  const save = () => {
    if (selected.length === 0) {
      toast.error("Selecione ao menos uma etiqueta para o gatilho.");
      return;
    }
    setNodes((nodes) =>
      nodes.map((n) =>
        n.id === props.id
          ? { ...n, data: { ...(n.data as any), action: { tagIds: selected } } }
          : n,
      ),
    );
    setOpen(false);
  };

  const configuredCount = initialTagIds.length;
  const description =
    configuredCount === 0
      ? "Nenhuma etiqueta configurada"
      : configuredCount === 1
        ? "1 etiqueta configurada"
        : `${configuredCount} etiquetas configuradas`;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ação recebe etiqueta</DialogTitle>
            <DialogDescription>
              Selecione uma ou mais etiquetas. O gatilho dispara quando qualquer
              uma delas for adicionada.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[320px] overflow-y-auto space-y-2 py-2">
            {isLoading && (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            )}
            {!isLoading && tags.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhuma etiqueta neste workspace.
              </p>
            )}
            {tags.map((t) => {
              const checked = selected.includes(t.id);
              return (
                <label
                  key={t.id}
                  className="flex items-center gap-2 cursor-pointer rounded px-2 py-1 hover:bg-accent"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggle(t.id)}
                  />
                  <span
                    className="inline-block size-2 rounded-full"
                    style={{ background: t.color }}
                  />
                  <span className="text-sm">{t.name}</span>
                </label>
              );
            })}
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={save}
              disabled={selected.length === 0}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <WsBaseTriggerNode
        {...props}
        icon={TagsIcon}
        name="Ação etiquetada"
        description={description}
        onSettings={() => setOpen(true)}
        onDoubleClick={() => setOpen(true)}
      />
    </>
  );
});
WsActionTaggedNode.displayName = "WsActionTaggedNode";
