import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getContrastColor } from "@/utils/get-contrast-color";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { CreateActionModal } from "./create-action-modal";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { KanbanCard } from "./kanban-card";
import { Action } from "../types";

interface Props {
  id: string;
  name: string;
  workspaceId: string;
  color: string | null;
  actionsCount: number;
  actions: Action[];
}

export function WorkspaceColumn({
  id,
  color,
  workspaceId,
  name,
  actionsCount,
  actions,
}: Props) {
  return (
    <li className={cn("shrink-0 w-68 h-full flex flex-col select-none")}>
      <div className="flex flex-col flex-1 min-h-0 rounded-md bg-muted/60  shadow-md ">
        <KanbanColumnHeader
          name={name}
          actionsCount={actionsCount}
          color={color}
          workspaceId={workspaceId}
        />

        <Droppable droppableId={id}>
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="min-h-[200px] py-1.5 px-1.5 overflow-y-auto"
            >
              {actions.map((action, index) => {
                return (
                  <Draggable
                    key={action.id}
                    draggableId={action.id}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        ref={provided.innerRef}
                      >
                        <KanbanCard action={action} />
                      </div>
                    )}
                  </Draggable>
                );
              })}

              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </li>
  );
}

export const KanbanColumnHeader = ({
  name,
  actionsCount,
  color,
  workspaceId,
}: Pick<Props, "name" | "actionsCount" | "color" | "workspaceId">) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="py-2 px-2 text-sm font-medium flex items-center justify-between gap-x-2">
        <div className="flex items-center gap-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                style={{
                  backgroundColor: color ?? "",
                  color: getContrastColor(color ?? ""),
                }}
                className="rounded-sm px-2 truncate"
              >
                {name}
              </span>
            </TooltipTrigger>
            <TooltipContent>{name}</TooltipContent>
          </Tooltip>
          <span className="bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-full text-xs font-medium">
            {actionsCount || 0}
          </span>
        </div>

        <Button variant="ghost" size="icon-xs" onClick={() => setOpen(true)}>
          <PlusIcon className="size-4" />
        </Button>
      </div>

      <CreateActionModal
        open={open}
        onOpenChange={setOpen}
        workspaceId={workspaceId}
      />
    </>
  );
};

export const StatusItemSkeleton = () => {
  return (
    <li className="shrink-0 w-72 h-full flex flex-col select-none">
      <div className="flex flex-col flex-1 min-h-0 rounded-xl bg-muted/40 border border-border/50 shadow-sm pb-2 overflow-hidden">
        <div className="p-3">
          <Skeleton className="h-7 w-3/4 rounded-md" />
        </div>
        <ScrollArea className="flex-1 min-h-0">
          <ol className="mx-2 px-1 py-3 flex flex-col gap-y-3">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </ol>
        </ScrollArea>
        <div className="px-2 pt-1 border-t border-border/10">
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
    </li>
  );
};
