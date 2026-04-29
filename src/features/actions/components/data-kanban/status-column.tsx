import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useRef } from "react";
import { useInfiniteActionsByStatus } from "../../hooks/use-tasks";
import { useActionFilters } from "../../hooks/use-action-filters";
import { KanbanCard } from "./kanban-card";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { EMPTY_ACTIONS, useActionKanbanStore } from "../../lib/kanban-store";
import { StatusHeader } from "./status-header";
import { useIsMobile } from "@/hooks/use-mobile";

interface Props {
  id: string;
  name: string;
  workspaceId: string;
  color: string | null;
  actionsCount: number;
}

export function WorkspaceColumn({
  id,
  color,
  workspaceId,
  name,
  actionsCount,
}: Props) {
  const registerColumn = useActionKanbanStore((s) => s.registerColumn);
  const isMobile = useIsMobile(); // true quando < 640px

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: id,
    data: {
      type: "Column",
      column: { id, name, color, actionsCount, workspaceId },
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const { filters } = useActionFilters();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteActionsByStatus({
      columnId: id,
      filters: {
        participantIds: filters.participantIds,
        tagIds: filters.tagIds,
        projectIds: filters.projectIds,
        dueDateFrom: filters.dueDateFrom,
        dueDateTo: filters.dueDateTo,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        isArchived: filters.showArchived,
      },
    });

  useEffect(() => {
    if (isMobile) {
      observerRef.current?.disconnect();
      return;
    }

    const sentinel = sentinelRef.current;
    const scrollContainer = sentinel?.closest(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLElement | null;

    if (!sentinel || !scrollContainer) return;

    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        root: scrollContainer,
        threshold: 0.1,
        rootMargin: "0px 0px 50px 0px",
      },
    );

    observerRef.current.observe(sentinel);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [isMobile, hasNextPage, fetchNextPage, isFetchingNextPage]);

  useEffect(() => {
    registerColumn(id, data);
  }, [data, registerColumn, id]);

  const actions = useActionKanbanStore(
    (state) => state.columns[id]?.actions ?? EMPTY_ACTIONS,
  );

  const actionIds = useMemo(() => actions.map((a) => a.id), [actions]);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "shrink-0 w-68 h-full flex flex-col select-none",
        isDragging && "z-50 opacity-50",
      )}
    >
      <div className="flex flex-col flex-1 min-h-0 rounded-md bg-muted/60 shadow-md">
        <StatusHeader
          data={{ id, name, color, workspaceId, actionsCount }}
          attributes={attributes}
          listeners={listeners}
        />

        <ScrollArea className="flex-1 min-h-0">
          <ol className="mx-1 px-1 py-2 flex flex-col gap-y-2">
            <SortableContext items={actionIds}>
              {isLoading && (
                <div className="flex flex-col gap-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-md shadow-sm" />
                  ))}
                </div>
              )}
              {!isLoading &&
                actions.map((action) => (
                  <KanbanCard key={action.id} action={action} />
                ))}
            </SortableContext>

            {hasNextPage && (
              <li className="list-none">
                {isMobile ? (
                  // Mobile: botão explícito dentro do scroll, abaixo do último card
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-1"
                    disabled={isFetchingNextPage}
                    onClick={() => fetchNextPage()}
                  >
                    {isFetchingNextPage ? (
                      <Spinner className="size-4" />
                    ) : (
                      "Buscar mais"
                    )}
                  </Button>
                ) : (
                  // Desktop: sentinel invisível para o IntersectionObserver
                  <div
                    ref={sentinelRef}
                    className="h-10 flex items-center justify-center"
                  >
                    {isFetchingNextPage && <Spinner className="size-4" />}
                  </div>
                )}
              </li>
            )}
          </ol>
        </ScrollArea>
      </div>
    </li>
  );
}

export const StatusItemSkeleton = () => {
  return (
    <li className="shrink-0 w-68 h-full flex flex-col select-none">
      <div className="flex flex-col flex-1 min-h-0 rounded-md bg-muted/40 border border-border/5 shadow-sm pb-2 overflow-hidden">
        <div className="p-3">
          <Skeleton className="h-7 w-3/4 rounded-md" />
        </div>
        <ScrollArea className="flex-1 min-h-0">
          <ol className="mx-2 px-1 py-3 flex flex-col gap-y-3">
            <Skeleton className="h-24 rounded-md" />
            <Skeleton className="h-24 rounded-md" />
            <Skeleton className="h-24 rounded-md" />
          </ol>
        </ScrollArea>
      </div>
    </li>
  );
};
