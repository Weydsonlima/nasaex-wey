"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon, WorkflowIcon } from "lucide-react";
import {
  useCreateWorkspaceWorkflow,
  useSuspenseWorkspaceWorkflows,
} from "../hooks/use-workspace-workflows";
import { useRouter } from "next/navigation";

export function WorkspaceWorkflowsList() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const {
    data: { workflows },
  } = useSuspenseWorkspaceWorkflows(workspaceId);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const create = useCreateWorkspaceWorkflow();
  const router = useRouter();

  const handleCreate = async () => {
    const res = await create.mutateAsync({ workspaceId, name });
    setOpen(false);
    setName("");
    router.push(`/workspaces/${workspaceId}/automations/${res.id}`);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Automações do Workspace</h1>
        <Button onClick={() => setOpen(true)}>
          <PlusIcon className="size-4" />
          Novo workflow
        </Button>
      </div>
      {workflows.length === 0 ? (
        <div className="text-muted-foreground">
          Nenhum workflow criado ainda.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workflows.map((wf) => (
            <Link
              key={wf.id}
              href={`/workspaces/${workspaceId}/automations/${wf.id}`}
            >
              <Card className="hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <WorkflowIcon className="size-4" />
                    {wf.name}
                  </CardTitle>
                  {wf.description && (
                    <CardDescription>{wf.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  {wf.isActive ? "Ativo" : "Inativo"}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar workflow</DialogTitle>
            <DialogDescription>Dê um nome para o workflow.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label>Nome</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Meu workflow"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleCreate} disabled={!name || create.isPending}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
