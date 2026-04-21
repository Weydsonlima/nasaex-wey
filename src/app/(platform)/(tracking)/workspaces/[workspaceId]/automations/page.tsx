import { Suspense } from "react";
import { prefetchWorkspaceWorkflows } from "@/features/workspace-editor/server/prefetch";
import { getQueryClient, HydrateClient } from "@/lib/query/hydration";
import { WorkspaceWorkflowsList } from "@/features/workspace-editor/components/workflows-list";
import { Spinner } from "@/components/ui/spinner";

interface Props {
  params: Promise<{ workspaceId: string }>;
}

export default async function WorkspaceAutomationsPage({ params }: Props) {
  const { workspaceId } = await params;
  const queryClient = getQueryClient();
  await prefetchWorkspaceWorkflows(queryClient, workspaceId);

  return (
    <HydrateClient client={queryClient}>
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-10 gap-2">
            <Spinner />
            <span>Carregando...</span>
          </div>
        }
      >
        <WorkspaceWorkflowsList />
      </Suspense>
    </HydrateClient>
  );
}
