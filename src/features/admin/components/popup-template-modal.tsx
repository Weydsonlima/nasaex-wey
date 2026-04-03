"use client";

import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";

interface PopupTemplate {
  id?: string;
  name: string;
  type: "achievement" | "stars_reward" | "level_up";
  title: string;
  message: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  iconUrl?: string;
  enableConfetti: boolean;
  enableSound: boolean;
  dismissDuration: number;
  customJson?: Record<string, unknown>;
}

interface PopupTemplateModalProps {
  template: PopupTemplate;
  isOpen: boolean;
  isCreating?: boolean;
  onClose: () => void;
  onSave: (template: PopupTemplate) => Promise<void>;
  isLoading?: boolean;
}

const SVG_PATTERNS = [
  { id: "padrao", label: "Padrão NASA", url: "/popup-patterns/padrao.svg" },
];

export function PopupTemplateModal({
  template: initialTemplate,
  isOpen,
  isCreating = false,
  onClose,
  onSave,
  isLoading = false,
}: PopupTemplateModalProps) {
  const [template, setTemplate] = useState(initialTemplate);
  const [svgPattern, setSvgPattern] = useState<string>(
    (initialTemplate.customJson?.svgPattern as string) ?? ""
  );
  const [mascotUrl, setMascotUrl] = useState<string>(
    (initialTemplate.customJson?.mascotUrl as string) ?? ""
  );
  const [mascots, setMascots] = useState<{ key: string; url: string; label: string }[]>([]);

  // Fetch uploaded mascots
  useEffect(() => {
    fetch("/api/admin/assets/mascots")
      .then((r) => r.json())
      .then((data) => setMascots(data ?? []))
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!template.name || !template.title) {
      alert("Por favor, preencha o nome e título do template");
      return;
    }
    const merged: PopupTemplate = {
      ...template,
      customJson: {
        ...(template.customJson ?? {}),
        svgPattern,
        mascotUrl,
      },
    };
    await onSave(merged);
    onClose();
  };

  if (!isOpen) return null;

  const selectedPattern = SVG_PATTERNS.find((p) => p.id === svgPattern);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
          <h2 className="text-xl font-bold text-white">{isCreating ? "Novo Template" : "Editar Template"}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white" disabled={isLoading}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Nome</label>
            <input
              type="text"
              value={template.name}
              onChange={(e) => setTemplate({ ...template, name: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-violet-500/60"
              disabled={isLoading}
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Tipo</label>
            <select
              value={template.type}
              onChange={(e) => setTemplate({ ...template, type: e.target.value as PopupTemplate["type"] })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-violet-500/60"
              disabled={isLoading}
            >
              <option value="achievement">Conquista</option>
              <option value="stars_reward">Recompensa Stars</option>
              <option value="level_up">Novo Nível</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Título</label>
            <input
              type="text"
              value={template.title}
              onChange={(e) => setTemplate({ ...template, title: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-violet-500/60"
              disabled={isLoading}
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Mensagem</label>
            <textarea
              value={template.message}
              onChange={(e) => setTemplate({ ...template, message: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-violet-500/60 resize-none h-20"
              disabled={isLoading}
            />
          </div>

          {/* SVG Pattern */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Padrão do Banner</label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {/* No pattern option */}
              <button
                type="button"
                onClick={() => setSvgPattern("")}
                className={`relative border-2 rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${
                  !svgPattern ? "border-violet-500 bg-violet-600/10" : "border-zinc-700 hover:border-zinc-600"
                }`}
              >
                <div className="w-full h-12 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 text-xs">
                  Sem padrão
                </div>
                {!svgPattern && <Check className="absolute top-1.5 right-1.5 w-4 h-4 text-violet-400" />}
              </button>

              {SVG_PATTERNS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSvgPattern(p.id)}
                  className={`relative border-2 rounded-xl p-2 flex flex-col items-center gap-2 transition-all ${
                    svgPattern === p.id ? "border-violet-500 bg-violet-600/10" : "border-zinc-700 hover:border-zinc-600"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.label} className="w-full h-16 object-cover rounded-lg" />
                  <span className="text-xs text-zinc-300">{p.label}</span>
                  {svgPattern === p.id && <Check className="absolute top-1.5 right-1.5 w-4 h-4 text-violet-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Mascot */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Mascote{" "}
              <span className="text-zinc-500 font-normal text-xs">
                (faça upload em /admin/ativos → aba Mascote)
              </span>
            </label>
            {mascots.length === 0 ? (
              <p className="text-xs text-zinc-500 bg-zinc-800 rounded-lg px-3 py-2">
                Nenhum mascote cadastrado. Acesse <strong className="text-zinc-400">/admin/ativos</strong> → aba <strong className="text-zinc-400">Mascote</strong> para fazer upload.
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {/* No mascot */}
                <button
                  type="button"
                  onClick={() => setMascotUrl("")}
                  className={`relative border-2 rounded-xl p-1 aspect-square flex items-center justify-center text-xs text-zinc-500 transition-all ${
                    !mascotUrl ? "border-violet-500 bg-violet-600/10" : "border-zinc-700 hover:border-zinc-600"
                  }`}
                >
                  Nenhum
                  {!mascotUrl && <Check className="absolute top-0.5 right-0.5 w-3 h-3 text-violet-400" />}
                </button>
                {mascots.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMascotUrl(m.url)}
                    className={`relative border-2 rounded-xl overflow-hidden aspect-square transition-all ${
                      mascotUrl === m.url ? "border-violet-500" : "border-zinc-700 hover:border-zinc-600"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt={m.label} className="w-full h-full object-cover" />
                    {mascotUrl === m.url && <Check className="absolute top-0.5 right-0.5 w-3 h-3 text-violet-400 drop-shadow" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Cor Primária", field: "primaryColor" },
              { label: "Cor Acento",   field: "accentColor" },
              { label: "Cor Fundo",    field: "backgroundColor" },
              { label: "Cor Texto",    field: "textColor" },
            ].map(({ label, field }) => (
              <div key={field}>
                <label className="block text-sm font-medium text-zinc-300 mb-2">{label}</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={(template as Record<string, unknown>)[field] as string}
                    onChange={(e) => setTemplate({ ...template, [field]: e.target.value })}
                    className="w-12 h-10 rounded-lg cursor-pointer border border-zinc-700"
                    disabled={isLoading}
                  />
                  <input
                    type="text"
                    value={(template as Record<string, unknown>)[field] as string}
                    onChange={(e) => setTemplate({ ...template, [field]: e.target.value })}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500/60"
                    disabled={isLoading}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Duração (ms)</label>
            <input
              type="number"
              value={template.dismissDuration}
              onChange={(e) => setTemplate({ ...template, dismissDuration: Number(e.target.value) })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-violet-500/60"
              disabled={isLoading}
            />
          </div>

          {/* Toggles */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={template.enableConfetti}
                onChange={(e) => setTemplate({ ...template, enableConfetti: e.target.checked })}
                className="rounded border-zinc-700"
                disabled={isLoading}
              />
              <span className="text-sm text-zinc-300">Confete</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={template.enableSound}
                onChange={(e) => setTemplate({ ...template, enableSound: e.target.checked })}
                className="rounded border-zinc-700"
                disabled={isLoading}
              />
              <span className="text-sm text-zinc-300">Som</span>
            </label>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">Prévia</label>
            {selectedPattern ? (
              <div className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: "768/391" }}>
                {/* SVG pattern background */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedPattern.url} alt="padrão" className="absolute inset-0 w-full h-full object-cover" />
                {/* Overlay content */}
                <div className="absolute inset-0 flex items-center">
                  {/* Mascot area (left ~30%) */}
                  <div className="w-[30%] h-full flex items-end justify-center pb-2">
                    {mascotUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mascotUrl} alt="mascote" className="h-[85%] w-auto object-contain" />
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-white/10 border-2 border-dashed border-white/30 flex items-center justify-center text-white/40 text-xs">
                        Mascote
                      </div>
                    )}
                  </div>
                  {/* Text area (right ~55%) */}
                  <div className="w-[55%] px-4 space-y-2">
                    <p style={{ color: template.accentColor }} className="text-xs font-bold uppercase tracking-wider">
                      {template.type === "achievement" ? "Conquista" : template.type === "stars_reward" ? "Recompensa" : "Novo Nível"}
                    </p>
                    <p style={{ color: template.textColor }} className="text-xl font-bold leading-tight">
                      {template.title || "Título do popup"}
                    </p>
                    <p style={{ color: template.textColor }} className="text-xs opacity-80 leading-snug">
                      {template.message || "Mensagem do popup"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="rounded-lg p-4 text-center text-sm"
                style={{
                  backgroundColor: template.backgroundColor,
                  borderColor: template.primaryColor,
                  borderWidth: "1px",
                }}
              >
                <p style={{ color: template.accentColor }} className="text-xs font-semibold mb-1 uppercase">
                  {template.type}
                </p>
                <p style={{ color: template.textColor }} className="font-bold mb-2">
                  {template.title || "Título"}
                </p>
                <p style={{ color: template.textColor }} className="text-xs opacity-90">
                  {template.message || "Mensagem"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-zinc-800 sticky bottom-0 bg-zinc-900">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-zinc-800 text-zinc-300 font-medium rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-500 transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? (isCreating ? "Criando..." : "Salvando...") : (isCreating ? "Criar" : "Salvar")}
          </button>
        </div>
      </div>
    </div>
  );
}
