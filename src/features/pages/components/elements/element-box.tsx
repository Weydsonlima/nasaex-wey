"use client";

import { useRef, useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePagesBuilderStore } from "../../context/pages-builder-store";
import type { ElementBase } from "../../types";
import { ElementRenderer } from "./element-renderer";

interface Props {
  element: ElementBase;
  editable: boolean;
}

type DragMode = "move" | "resize-se" | "resize-nw" | "resize-ne" | "resize-sw";

function extractText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  if (typeof node === "string") return node as string;
  const n = node as { text?: string; content?: unknown[] };
  if (n.text) return n.text;
  if (Array.isArray(n.content)) return n.content.map(extractText).join("\n");
  return "";
}

export function ElementBox({ element, editable }: Props) {
  const selected = usePagesBuilderStore((s) => s.selected.includes(element.id));
  const toggleSelected = usePagesBuilderStore((s) => s.toggleSelected);
  const updateElement = usePagesBuilderStore((s) => s.updateElement);
  const removeElement = usePagesBuilderStore((s) => s.removeElement);

  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragRef = useRef<{
    mode: DragMode;
    startX: number;
    startY: number;
    startEl: ElementBase;
  } | null>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  const startDrag = (mode: DragMode) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (!editable || element.locked || isEditing) return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { mode, startX: e.clientX, startY: e.clientY, startEl: { ...element } };
    toggleSelected(element.id, e.shiftKey);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (drag.mode === "move") {
      updateElement(element.id, {
        x: Math.round(drag.startEl.x + dx),
        y: Math.round(drag.startEl.y + dy),
      });
    } else if (drag.mode === "resize-se") {
      updateElement(element.id, {
        w: Math.max(16, Math.round(drag.startEl.w + dx)),
        h: Math.max(16, Math.round(drag.startEl.h + dy)),
      });
    } else if (drag.mode === "resize-nw") {
      updateElement(element.id, {
        x: Math.round(drag.startEl.x + dx),
        y: Math.round(drag.startEl.y + dy),
        w: Math.max(16, Math.round(drag.startEl.w - dx)),
        h: Math.max(16, Math.round(drag.startEl.h - dy)),
      });
    } else if (drag.mode === "resize-ne") {
      updateElement(element.id, {
        y: Math.round(drag.startEl.y + dy),
        w: Math.max(16, Math.round(drag.startEl.w + dx)),
        h: Math.max(16, Math.round(drag.startEl.h - dy)),
      });
    } else if (drag.mode === "resize-sw") {
      updateElement(element.id, {
        x: Math.round(drag.startEl.x + dx),
        w: Math.max(16, Math.round(drag.startEl.w - dx)),
        h: Math.max(16, Math.round(drag.startEl.h + dy)),
      });
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!editable || element.type !== "text") return;
    e.stopPropagation();
    setIsEditing(true);
  };

  const exitEditing = () => setIsEditing(false);

  const textValue = isEditing
    ? typeof element.content === "string"
      ? (element.content as string)
      : extractText(element.content)
    : "";

  return (
    <div
      data-el-id={element.id}
      className={cn(
        "absolute select-none",
        editable && !isEditing && "cursor-move",
        selected && !isEditing && "outline-2 outline-offset-2 outline-indigo-500 outline",
        isEditing && "outline-2 outline-offset-2 outline-indigo-400 outline",
      )}
      style={{
        left: element.x,
        top: element.y,
        width: element.w,
        height: element.h,
        transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
        opacity: element.opacity ?? 1,
        zIndex: element.zIndex ?? 1,
      }}
      onPointerDown={isEditing ? undefined : startDrag("move")}
      onPointerMove={isEditing ? undefined : onPointerMove}
      onPointerUp={isEditing ? undefined : onPointerUp}
      onDoubleClick={handleDoubleClick}
    >
      <ElementRenderer element={element} />

      {isEditing && element.type === "text" && (
        <textarea
          ref={textareaRef}
          className="absolute inset-0 w-full h-full bg-transparent resize-none p-0 border-0 focus:outline-none"
          style={{
            color: "transparent",
            caretColor: (element.color as string) ?? "#0f172a",
            fontSize: (element.fontSize as number) ?? 16,
            fontFamily: `${(element.fontFamily as string) ?? "Inter"}, sans-serif`,
            fontWeight: (element.fontWeight as string) ?? "400",
            lineHeight: (element.lineHeight as number) ?? 1.4,
            letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : undefined,
            textAlign: (element.align as "left" | "center" | "right" | "justify") ?? "left",
            cursor: "text",
          }}
          value={textValue}
          onChange={(e) => updateElement(element.id, { content: e.target.value })}
          onBlur={exitEditing}
          onKeyDown={(e) => {
            if (e.key === "Escape") exitEditing();
            e.stopPropagation();
          }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        />
      )}

      {editable && selected && !isEditing && (
        <>
          <Handle pos="nw" onPointerDown={startDrag("resize-nw")} onPointerMove={onPointerMove} onPointerUp={onPointerUp} />
          <Handle pos="ne" onPointerDown={startDrag("resize-ne")} onPointerMove={onPointerMove} onPointerUp={onPointerUp} />
          <Handle pos="sw" onPointerDown={startDrag("resize-sw")} onPointerMove={onPointerMove} onPointerUp={onPointerUp} />
          <Handle pos="se" onPointerDown={startDrag("resize-se")} onPointerMove={onPointerMove} onPointerUp={onPointerUp} />
          <button
            className="absolute -top-7 right-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-destructive text-destructive-foreground shadow hover:bg-destructive/90 transition-colors"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); removeElement(element.id); }}
            title="Deletar (Del)"
          >
            <Trash2 className="size-3" />
            Deletar
          </button>
        </>
      )}
    </div>
  );
}

function Handle({
  pos,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  pos: "nw" | "ne" | "sw" | "se";
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
}) {
  const map = {
    nw: "-top-1.5 -left-1.5 cursor-nwse-resize",
    ne: "-top-1.5 -right-1.5 cursor-nesw-resize",
    sw: "-bottom-1.5 -left-1.5 cursor-nesw-resize",
    se: "-bottom-1.5 -right-1.5 cursor-nwse-resize",
  } as const;
  return (
    <div
      className={cn("absolute size-3 rounded-sm bg-white border-2 border-indigo-500", map[pos])}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    />
  );
}
