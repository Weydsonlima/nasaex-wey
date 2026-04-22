"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAtomValue } from "jotai";
import { SaveIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { editorAtom } from "@/features/editor/store/atoms";
import {
  useDeleteWorkspaceWorkflow,
  useSuspenseWorkspaceWorkflow,
  useUpdateWorkspaceWorkflow,
  useUpdateWorkspaceWorkflowName,
} from "../hooks/use-workspace-workflows";

export const WsEditorHeader = ({ workflowId }: { workflowId: string }) => {
  return (
    <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-4 bg-background">
      <WsEditorBreadcrumbs workflowId={workflowId} />
      <div className="flex items-center gap-2">
        <WsEditorOptions workflowId={workflowId} />
        <WsEditorSaveButton workflowId={workflowId} />
      </div>
    </div>
  );
};

const WsEditorBreadcrumbs = ({ workflowId }: { workflowId: string }) => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={`/workspaces/${workspaceId}/automations`}>
              Automações
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <WsEditorNameInput workflowId={workflowId} />
      </BreadcrumbList>
    </Breadcrumb>
  );
};

const WsEditorNameInput = ({ workflowId }: { workflowId: string }) => {
  const {
    data: { workflow },
  } = useSuspenseWorkspaceWorkflow(workflowId);
  const update = useUpdateWorkspaceWorkflowName();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(workflow.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setName(workflow.name), [workflow.name]);
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const save = async () => {
    if (name === workflow.name) return setEditing(false);
    try {
      await update.mutateAsync({ workflowId, name });
    } catch {
      setName(workflow.name);
    } finally {
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        disabled={update.isPending}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          else if (e.key === "Escape") {
            setName(workflow.name);
            setEditing(false);
          }
        }}
        className="h-7 w-auto min-w-25 px-2"
      />
    );
  }

  return (
    <BreadcrumbItem
      onClick={() => setEditing(true)}
      className="cursor-pointer hover:text-foreground transition-colors"
    >
      {workflow.name}
    </BreadcrumbItem>
  );
};

const WsEditorSaveButton = ({ workflowId }: { workflowId: string }) => {
  const editor = useAtomValue(editorAtom);
  const save = useUpdateWorkspaceWorkflow();
  return (
    <Button
      onClick={() => {
        if (!editor) return;
        save.mutate({
          id: workflowId,
          nodes: editor.getNodes(),
          edges: editor.getEdges(),
        });
      }}
      size="sm"
      disabled={save.isPending}
    >
      <SaveIcon className="size-4" />
      Salvar
    </Button>
  );
};

const WsEditorOptions = ({ workflowId }: { workflowId: string }) => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const del = useDeleteWorkspaceWorkflow();

  return (
    <>
      <Button
        size="icon-sm"
        variant="ghost"
        className="cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <Trash2Icon className="size-4 text-red-500" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deletar workflow</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar este workflow?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() =>
                del.mutate(
                  { id: workflowId },
                  {
                    onSuccess: () => {
                      setOpen(false);
                      router.push(`/workspaces/${workspaceId}/automations`);
                    },
                  },
                )
              }
            >
              Deletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
