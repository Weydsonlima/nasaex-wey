import { FormBlockInstance } from "@/features/form/types";
import { FormBlocks } from "@/features/form/lib/form-blocks";
import React from "react";

export function ChildCanvasComponentWrapper({
  blockInstance,
}: {
  blockInstance: FormBlockInstance;
}) {
  const CanvasComponent = FormBlocks[blockInstance.blockType]?.canvasComponent;
  if (!CanvasComponent) return null;

  return <CanvasComponent blockInstance={blockInstance} />;
}
