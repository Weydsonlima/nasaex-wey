"use client";

import type { StepAnnotation } from "../types";
import { cn } from "@/lib/utils";

interface Props {
  src: string | null;
  alt?: string;
  annotations?: StepAnnotation[] | null;
  className?: string;
}

/**
 * Imagem com overlay SVG de setas e labels apontando para regiões da tela.
 * Coordenadas em annotations são relativas (0-1) para responsividade.
 */
export function StepScreenshot({ src, alt = "", annotations, className }: Props) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-muted/40 shadow-sm",
        className,
      )}
    >
      {src ? (
        <img src={src} alt={alt} className="block w-full h-auto" />
      ) : (
        <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-violet-500/10 to-violet-700/20 text-muted-foreground">
          <div className="text-center px-6">
            <div className="text-5xl mb-2">🖼️</div>
            <p className="text-sm font-medium">Print da funcionalidade</p>
            <p className="text-xs opacity-70">(será adicionado pelo moderador)</p>
          </div>
        </div>
      )}

      {annotations && annotations.length > 0 && (
        <svg
          className="absolute inset-0 h-full w-full pointer-events-none"
          viewBox="0 0 1 1"
          preserveAspectRatio="none"
        >
          <defs>
            <marker
              id="sh-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="4"
              markerHeight="4"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="#7C3AED" />
            </marker>
          </defs>
          {annotations.map((a, i) => {
            const tailLen = 0.07;
            const rad = (a.angle * Math.PI) / 180;
            const tailX = a.x + Math.cos(rad) * tailLen;
            const tailY = a.y + Math.sin(rad) * tailLen;
            return (
              <g key={i}>
                <line
                  x1={tailX}
                  y1={tailY}
                  x2={a.x}
                  y2={a.y}
                  stroke="#7C3AED"
                  strokeWidth="0.005"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  markerEnd="url(#sh-arrow)"
                  style={{ strokeWidth: 3 }}
                />
              </g>
            );
          })}
        </svg>
      )}

      {annotations && annotations.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {annotations.map((a, i) => (
            <div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-full mb-1 px-2 py-0.5 rounded-md bg-violet-600 text-white text-[11px] font-medium shadow-md whitespace-nowrap"
              style={{
                left: `${a.x * 100}%`,
                top: `${a.y * 100}%`,
                transform: `translate(-50%, calc(-100% - 8px))`,
              }}
            >
              {a.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
