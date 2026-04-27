"use client";

/**
 * AreaEditor — Ferramenta de editor de área (estilo WorkAdventure).
 * Permite desenhar retângulos no mapa com tipo + propriedades (silent, exit, meeting, etc).
 */

import { useEffect, useState } from "react";
import { Plus, Trash2, SquareDashed, Crosshair } from "lucide-react";
import { AREA_TYPE_META, type AreaType, type MapArea } from "../../../types";

interface Props {
  areas:    MapArea[];
  onChange: (next: MapArea[]) => void;
}

export function AreaEditor({ areas, onChange }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawingType, setDrawingType] = useState<AreaType | null>(null);

  // Ao ativar o tipo de desenho, avisa o Phaser
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("space-station:area-draw-mode", {
      detail: { type: drawingType },
    }));
  }, [drawingType]);

  // Recebe retângulo desenhado pelo Phaser
  useEffect(() => {
    const onDrawn = (e: Event) => {
      const d = (e as CustomEvent).detail as { type: AreaType; x: number; y: number; w: number; h: number };
      const meta = AREA_TYPE_META[d.type];
      const n = areas.filter(a => a.type === d.type).length + 1;
      const area: MapArea = {
        id:    `area-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name:  `${meta.label} ${n}`,
        type:  d.type,
        x: d.x, y: d.y, w: d.w, h: d.h,
        color: meta.color,
      };
      onChange([...areas, area]);
      setSelectedId(area.id);
      setDrawingType(null);
    };
    const onSelected = (e: Event) => {
      const { id } = (e as CustomEvent).detail as { id: string | null };
      setSelectedId(id);
    };
    const onMoved = (e: Event) => {
      const d = (e as CustomEvent).detail as { id: string; x: number; y: number; w?: number; h?: number };
      onChange(areas.map(a => a.id === d.id ? {
        ...a, x: d.x, y: d.y,
        ...(d.w !== undefined ? { w: d.w } : {}),
        ...(d.h !== undefined ? { h: d.h } : {}),
      } : a));
    };
    window.addEventListener("space-station:area-drawn",    onDrawn);
    window.addEventListener("space-station:area-selected", onSelected);
    window.addEventListener("space-station:area-moved",    onMoved);
    return () => {
      window.removeEventListener("space-station:area-drawn",    onDrawn);
      window.removeEventListener("space-station:area-selected", onSelected);
      window.removeEventListener("space-station:area-moved",    onMoved);
    };
  }, [areas, onChange]);

  const selected = selectedId ? areas.find(a => a.id === selectedId) ?? null : null;

  function remove(id: string) {
    onChange(areas.filter(a => a.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function update(patch: Partial<MapArea>) {
    if (!selected) return;
    onChange(areas.map(a => a.id === selected.id ? { ...a, ...patch } : a));
  }

  function updateProps(patch: Partial<NonNullable<MapArea["props"]>>) {
    if (!selected) return;
    onChange(areas.map(a => a.id === selected.id ? { ...a, props: { ...(a.props ?? {}), ...patch } } : a));
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-5 pt-5 pb-3 border-b border-white/5">
        <h2 className="text-lg font-semibold text-white tracking-tight">Ferramenta de áreas</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Desenhe zonas no mapa — silenciosa, saída, reunião, áudio…
        </p>
      </div>

      {/* Tipo de área para desenhar */}
      <div className="px-5 pt-3 pb-2">
        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
          Desenhar área
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {(Object.keys(AREA_TYPE_META) as AreaType[]).map((t) => {
            const m = AREA_TYPE_META[t];
            const active = drawingType === t;
            return (
              <button
                key={t}
                onClick={() => setDrawingType(active ? null : t)}
                className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg border transition-colors ${
                  active
                    ? "border-indigo-400/60 bg-indigo-500/10 text-indigo-200"
                    : "border-white/5 hover:border-white/20 hover:bg-white/5 text-slate-300"
                }`}
                title={m.description}
              >
                <span className="text-base leading-none">{m.emoji}</span>
                <span className="text-[10px] font-medium leading-tight">{m.label}</span>
              </button>
            );
          })}
        </div>
        {drawingType && (
          <div className="flex items-center gap-2 mt-2 px-2 py-1.5 rounded-md bg-indigo-500/10 border border-indigo-400/20 text-[11px] text-indigo-300">
            <Crosshair className="h-3 w-3 animate-pulse" />
            <span>Arraste no mapa para desenhar • Esc para cancelar</span>
          </div>
        )}
      </div>

      {/* Lista de áreas */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <div className="px-2 pt-2 pb-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold flex items-center justify-between">
          <span>Áreas do mapa</span>
          <span className="text-slate-400 tabular-nums normal-case">{areas.length}</span>
        </div>

        {areas.length === 0 && !drawingType && (
          <div className="flex flex-col items-center py-10 text-slate-500">
            <SquareDashed className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">Nenhuma área criada</p>
            <p className="text-xs text-slate-600 mt-1">Escolha um tipo acima e desenhe no mapa</p>
          </div>
        )}

        {areas.map((a) => {
          const m = AREA_TYPE_META[a.type];
          const isSelected = selectedId === a.id;
          return (
            <div
              key={a.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                setSelectedId(a.id);
                window.dispatchEvent(new CustomEvent("space-station:area-focus", { detail: { id: a.id } }));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedId(a.id);
                  window.dispatchEvent(new CustomEvent("space-station:area-focus", { detail: { id: a.id } }));
                }
              }}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left border transition-colors cursor-pointer ${
                isSelected
                  ? "border-indigo-400/40 bg-indigo-500/10"
                  : "border-transparent hover:bg-white/5"
              }`}
            >
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 text-sm"
                style={{ backgroundColor: (a.color ?? m.color) + "33", border: `1px solid ${a.color ?? m.color}` }}
              >
                {m.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm text-white truncate">{a.name}</div>
                <div className="text-[10px] text-slate-500 tabular-nums">
                  {Math.round(a.w)}×{Math.round(a.h)}px
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); remove(a.id); }}
                className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Inspetor */}
      {selected && (
        <div className="border-t border-white/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white flex-1 truncate">{selected.name}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ color: AREA_TYPE_META[selected.type].color, border: `1px solid ${AREA_TYPE_META[selected.type].color}66` }}>
              {AREA_TYPE_META[selected.type].label}
            </span>
          </div>

          <Field label="Nome">
            <input
              value={selected.name}
              onChange={(e) => update({ name: e.target.value })}
              className="w-full px-2 py-1.5 rounded-md bg-slate-800/60 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </Field>

          {/* Props por tipo */}
          {(selected.type === "exit") && (
            <Field label="Station de destino (nick)">
              <input
                value={selected.props?.targetNick ?? ""}
                onChange={(e) => updateProps({ targetNick: e.target.value })}
                placeholder="ex: nasa-hq"
                className="w-full px-2 py-1.5 rounded-md bg-slate-800/60 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </Field>
          )}
          {(selected.type === "website") && (
            <Field label="URL">
              <input
                value={selected.props?.url ?? ""}
                onChange={(e) => updateProps({ url: e.target.value })}
                placeholder="https://..."
                className="w-full px-2 py-1.5 rounded-md bg-slate-800/60 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </Field>
          )}
          {(selected.type === "play-audio") && (
            <Field label="URL do áudio">
              <input
                value={selected.props?.audioUrl ?? ""}
                onChange={(e) => updateProps({ audioUrl: e.target.value })}
                placeholder="https://.../som.mp3"
                className="w-full px-2 py-1.5 rounded-md bg-slate-800/60 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </Field>
          )}
          {(selected.type === "meeting") && (
            <Field label="Nome da sala">
              <input
                value={selected.props?.roomName ?? ""}
                onChange={(e) => updateProps({ roomName: e.target.value })}
                placeholder="ex: sala-direcao"
                className="w-full px-2 py-1.5 rounded-md bg-slate-800/60 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </Field>
          )}
          {(selected.type === "info") && (
            <Field label="Mensagem">
              <textarea
                value={selected.props?.message ?? ""}
                onChange={(e) => updateProps({ message: e.target.value })}
                rows={2}
                className="w-full px-2 py-1.5 rounded-md bg-slate-800/60 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
              />
            </Field>
          )}
          {(selected.type === "credits") && (
            <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 p-3 space-y-2">
              <p className="text-[11px] text-orange-300 leading-relaxed">
                Ao entrar nesta área, os visitantes verão o painel de créditos e atribuições
                <span className="font-semibold"> CC BY-SA 3.0 / 4.0 </span>
                dos assets utilizados (personagens Pipoya/LPC, objetos LimeZu, etc.).
              </p>
              <Field label="Nota adicional (opcional)">
                <textarea
                  value={selected.props?.message ?? ""}
                  onChange={(e) => updateProps({ message: e.target.value })}
                  rows={2}
                  placeholder="Ex: Este espaço usa assets sob CC BY-SA 3.0"
                  className="w-full px-2 py-1.5 rounded-md bg-slate-800/60 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </Field>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Field label="Largura">
              <input
                type="number"
                value={Math.round(selected.w)}
                onChange={(e) => update({ w: Math.max(16, parseInt(e.target.value) || 16) })}
                className="w-full px-2 py-1.5 rounded-md bg-slate-800/60 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500 tabular-nums"
              />
            </Field>
            <Field label="Altura">
              <input
                type="number"
                value={Math.round(selected.h)}
                onChange={(e) => update({ h: Math.max(16, parseInt(e.target.value) || 16) })}
                className="w-full px-2 py-1.5 rounded-md bg-slate-800/60 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500 tabular-nums"
              />
            </Field>
          </div>
        </div>
      )}

      {!selected && areas.length > 0 && (
        <div className="border-t border-white/5 px-4 py-3 text-[11px] text-slate-500 flex items-center gap-1.5">
          <Plus className="h-3 w-3" />
          Selecione uma área para editar propriedades
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">{label}</span>
      {children}
    </label>
  );
}
