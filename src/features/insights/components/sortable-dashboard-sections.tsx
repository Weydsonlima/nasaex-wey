"use client";

import { useMemo, type ReactNode } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppModule } from "@/features/insights/types";

interface SortableDashboardSectionsProps {
  moduleOrder: AppModule[];
  selectedModules: AppModule[];
  onReorder: (next: AppModule[]) => void;
  sections: Partial<Record<AppModule, ReactNode>>;
}

export function SortableDashboardSections({
  moduleOrder,
  selectedModules,
  onReorder,
  sections,
}: SortableDashboardSectionsProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const visibleIds = useMemo<AppModule[]>(() => {
    return moduleOrder.filter(
      (id) => selectedModules.includes(id) && sections[id] != null,
    );
  }, [moduleOrder, selectedModules, sections]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = moduleOrder.indexOf(active.id as AppModule);
    const newIndex = moduleOrder.indexOf(over.id as AppModule);
    if (oldIndex < 0 || newIndex < 0) return;

    onReorder(arrayMove(moduleOrder, oldIndex, newIndex));
  };

  if (visibleIds.length === 0) return null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={visibleIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-8">
          {visibleIds.map((id) => (
            <SortableSection key={id} id={id}>
              {sections[id]}
            </SortableSection>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableSection({ id, children }: { id: AppModule; children: ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group/section rounded-xl",
        isDragging && "opacity-40 z-10",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Arrastar seção"
        className="absolute -left-7 top-2 hidden md:flex size-6 items-center justify-center rounded-md text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted cursor-grab active:cursor-grabbing opacity-0 group-hover/section:opacity-100 transition-opacity"
      >
        <GripVerticalIcon className="size-4" />
      </button>
      {children}
    </div>
  );
}
