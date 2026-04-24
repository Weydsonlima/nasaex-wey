"use client";

import { useEffect, useState } from "react";
import type { Device, PageLayout, ElementBase } from "../../types";
import { DEVICE_PRESETS } from "../../constants";
import { ElementRenderer } from "../elements/element-renderer";
import { resolveElements, getDeviceFromWidth } from "../../lib/responsive";

interface Props {
  layout: PageLayout;
  palette?: Record<string, string>;
  fontFamily?: string | null;
}

export function PublicPageRenderer({ layout, palette, fontFamily }: Props) {
  const [device, setDevice] = useState<Device>("desktop");
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const update = () => setDevice(getDeviceFromWidth(window.innerWidth));
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (layout.mode !== "stacked") return;
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [layout.mode]);

  const artboardWidth = layout.artboard.width ?? 1440;
  const containerWidth = DEVICE_PRESETS[device].width;

  const wrapperStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    maxWidth: containerWidth,
    minHeight: layout.artboard.minHeight,
    margin: "0 auto",
    background:
      (palette?.bg as string | undefined) ??
      layout.artboard.background ??
      "#ffffff",
    fontFamily: fontFamily ?? "Inter, system-ui, sans-serif",
    color: (palette?.fg as string | undefined) ?? "#0f172a",
    overflow: "hidden",
  };

  if (layout.mode === "single") {
    const elements = resolveElements(layout.main.elements, device, artboardWidth);
    return (
      <div style={wrapperStyle}>
        <LayerSurface elements={elements} minHeight={layout.artboard.minHeight} />
      </div>
    );
  }

  const backSpeed = layout.parallax?.backSpeed ?? 0.3;
  const frontSpeed = layout.parallax?.frontSpeed ?? 1;
  const backElements = resolveElements(layout.back.elements, device, artboardWidth);
  const frontElements = resolveElements(layout.front.elements, device, artboardWidth);

  return (
    <div style={wrapperStyle}>
      <div
        style={{
          transform: `translate3d(0, ${-scrollY * backSpeed}px, 0)`,
          willChange: "transform",
          position: "absolute",
          inset: 0,
        }}
      >
        <LayerSurface elements={backElements} minHeight={layout.artboard.minHeight} />
      </div>
      <div
        style={{
          transform: `translate3d(0, ${-scrollY * (frontSpeed - 1)}px, 0)`,
          willChange: "transform",
          position: "relative",
        }}
      >
        <LayerSurface elements={frontElements} minHeight={layout.artboard.minHeight} />
      </div>
    </div>
  );
}

function LayerSurface({
  elements,
  minHeight,
}: {
  elements: ElementBase[];
  minHeight: number;
}) {
  return (
    <div style={{ position: "relative", minHeight }}>
      {elements.map((el) => (
        <div
          key={el.id}
          data-el-id={el.id}
          style={{
            position: "absolute",
            left: el.x,
            top: el.y,
            width: el.w,
            height: el.h,
            transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
            opacity: el.opacity ?? 1,
            zIndex: el.zIndex ?? 1,
          }}
        >
          <ElementRenderer element={el} readonly />
        </div>
      ))}
    </div>
  );
}
