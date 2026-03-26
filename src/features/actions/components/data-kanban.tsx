import { useSuspenseColumnsByWorkspace } from "@/features/workspace/hooks/use-workspace";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { useCallback, useEffect, useState } from "react";
import { WorkspaceColumn } from "./status-column";
import { Action } from "../types";
import { useListActionByWorkspace } from "../hooks/use-tasks";

interface Props {
  workspaceId: string;
}

export const DataKanban = ({ workspaceId }: Props) => {
  const { data: columnData } = useSuspenseColumnsByWorkspace(workspaceId);
  const { actions: items } = useListActionByWorkspace(workspaceId);

  const [actions, setActions] = useState<Record<string, Action[]>>({});

  useEffect(() => {
    if (items) {
      const grouped = items.reduce(
        (acc, action) => {
          const colId = action.columnId || "unassigned";
          if (!acc[colId]) acc[colId] = [];
          acc[colId].push(action);
          return acc;
        },
        {} as Record<string, Action[]>,
      );
      setActions(grouped);
    }
  }, [items]);

  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    const sourceColumnId = source.droppableId;
    const destColumnId = destination.droppableId;

    let updatesPayload: { $id: string; columnId: string; position: number }[] =
      [];

    if (sourceColumnId === destColumnId && source.index === destination.index) {
      return;
    }

    setActions((prev) => {
      const newActions = { ...prev };

      // 1. Remove from source
      const sourceList = [...(newActions[sourceColumnId] || [])];
      const [movedTask] = sourceList.splice(source.index, 1);

      if (!movedTask) return prev;

      // 2. Update task's columnId
      const updatedTask = {
        ...movedTask,
        columnId: destColumnId,
      };

      // 3. Add to destination
      if (sourceColumnId === destColumnId) {
        // Reordering within same column
        sourceList.splice(destination.index, 0, updatedTask);
        newActions[sourceColumnId] = sourceList;
      } else {
        // Moving between columns
        const destList = [...(newActions[destColumnId] || [])];
        destList.splice(destination.index, 0, updatedTask);
        newActions[sourceColumnId] = sourceList;
        newActions[destColumnId] = destList;
      }

      updatesPayload = [];

      updatesPayload.push({
        $id: movedTask.id,
        columnId: destColumnId,
        position: Math.min((destination.index + 1) * 1000, 1_000_000),
      });

      return newActions;
    });

    console.log("Moved task:", draggableId, "to column:", destColumnId);
  }, []);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-rows-[1fr_auto] h-full overflow-hidden">
        <ol className="flex gap-x-3 overflow-x-auto p-4 h-full scrollbar-thin">
          {columnData.columns.map((column) => (
            <WorkspaceColumn
              key={column.id}
              {...column}
              workspaceId={workspaceId}
              actions={actions[column.id] || []}
            />
          ))}

          <div className="shrink-0 w-1" />
        </ol>
      </div>
    </DragDropContext>
  );
};
