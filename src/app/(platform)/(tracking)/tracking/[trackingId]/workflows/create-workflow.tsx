"use client";

import { Button } from "@/components/ui/button";
import { useCreateWorkflow } from "@/features/workflows/hooks/use-workflows";
import { PlusIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

export function CreateWorkflowButton() {
  const router = useRouter();
  const { trackingId } = useParams<{ trackingId: string }>();
  const createWorkflow = useCreateWorkflow();

  const onCreate = () =>
    createWorkflow.mutate(
      {
        name: "Sem título",
        trackingId,
      },
      {
        onSuccess: (data) => {
          router.push(`/tracking/${trackingId}/workflows/${data.id}`);
        },
      },
    );

  return (
    <Button onClick={onCreate} size="sm">
      <PlusIcon className="size-4" />
      <span className="hidden sm:inline">Adicionar Automação</span>
    </Button>
  );
}
