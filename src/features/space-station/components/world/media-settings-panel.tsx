"use client";

import { useEffect, useRef } from "react";
import { X, Mic, Video, Volume2, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onClose:          () => void;
  micOn:            boolean;
  camOn:            boolean;
  camError?:        string | null;
  onToggleMic:      () => void;
  onToggleCam:      () => void;
  localStream:      MediaStream | null;
  devices:          { audio: MediaDeviceInfo[]; video: MediaDeviceInfo[] };
  selectedAudio:    string;
  setSelectedAudio: (id: string) => void;
  selectedVideo:    string;
  setSelectedVideo: (id: string) => void;
  onApplyDevices:   () => void;
}

export function MediaSettingsPanel({
  onClose, micOn, camOn, camError, onToggleMic, onToggleCam,
  localStream, devices, selectedAudio, setSelectedAudio,
  selectedVideo, setSelectedVideo, onApplyDevices,
}: Props) {
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  // Show local camera preview
  useEffect(() => {
    const el = videoPreviewRef.current;
    if (!el) return;
    if (localStream && camOn) {
      el.srcObject = localStream;
      el.play().catch(() => {});
    } else {
      el.srcObject = null;
    }
  }, [localStream, camOn]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-media-settings]")) onClose();
    };
    setTimeout(() => document.addEventListener("mousedown", handler), 100);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      data-media-settings
      className="absolute top-20 left-1/2 -translate-x-1/2 z-40 w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex gap-1">
          <TabBtn active>Configurações</TabBtn>
          <TabBtn>Fundo da câmera</TabBtn>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-5">

        {/* ── Erro de permissão ── */}
        {camError && (
          <div className="flex items-start gap-2 bg-rose-500/15 border border-rose-500/30 rounded-xl px-3 py-2.5">
            <span className="text-rose-400 mt-0.5 flex-shrink-0">⚠️</span>
            <p className="text-xs text-rose-300 leading-snug">{camError}</p>
          </div>
        )}

        {/* ── Camera ── */}
        <section>
          <label className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase mb-2 block">
            Câmera
          </label>

          {/* Preview */}
          <div className="relative w-full aspect-video bg-slate-800 rounded-xl overflow-hidden mb-3">
            {camOn && localStream ? (
              <video
                ref={videoPreviewRef}
                muted autoPlay playsInline
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-500">
                <Video className="h-8 w-8" />
                <span className="text-xs">Câmera desativada</span>
              </div>
            )}
          </div>

          {!camOn ? (
            <>
              <p className="text-xs text-slate-400 italic text-center mb-2">Sua câmera está desabilitada</p>
              <Button
                className="w-full bg-rose-500 hover:bg-rose-400 text-white rounded-xl h-9 text-sm font-semibold"
                onClick={onToggleCam}
              >
                Ativar sua câmera
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
              <select
                value={selectedVideo}
                onChange={e => setSelectedVideo(e.target.value)}
                className="flex-1 bg-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1.5 border border-white/10 focus:outline-none"
              >
                {devices.video.length === 0 && <option value="">Câmera padrão</option>}
                {devices.video.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>{d.label || "Câmera"}</option>
                ))}
              </select>
              <button
                onClick={onApplyDevices}
                className="px-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                title="Aplicar dispositivo"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={onToggleCam}
                className="px-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 transition-colors text-xs font-semibold"
              >
                Desativar
              </button>
            </div>
          )}
        </section>

        {/* ── Microphone ── */}
        <section>
          <label className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase mb-2 block">
            Microfone
          </label>

          {!micOn ? (
            <>
              <p className="text-xs text-slate-400 italic text-center mb-2">Seu microfone está desabilitado</p>
              <Button
                className="w-full bg-rose-500 hover:bg-rose-400 text-white rounded-xl h-9 text-sm font-semibold"
                onClick={onToggleMic}
              >
                Ativar seu microfone
              </Button>
            </>
          ) : (
            <div className="flex gap-2 items-center">
              <div className="flex items-center gap-1.5 bg-slate-800 rounded-lg px-2 py-1.5 flex-1">
                <Mic className="h-3.5 w-3.5 text-emerald-400" />
                <select
                  value={selectedAudio}
                  onChange={e => setSelectedAudio(e.target.value)}
                  className="flex-1 bg-transparent text-slate-200 text-xs focus:outline-none"
                >
                  {devices.audio.length === 0 && <option value="">Microfone padrão</option>}
                  {devices.audio.map(d => (
                    <option key={d.deviceId} value={d.deviceId}>{d.label || "Microfone"}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={onToggleMic}
                className="px-2 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 transition-colors text-xs font-semibold"
              >
                Desativar
              </button>
            </div>
          )}
        </section>

        {/* ── Audio output ── */}
        <section>
          <label className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase mb-2 block">
            Saída de áudio
          </label>
          <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
            <Volume2 className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs text-slate-300 flex-1">Alto-falante padrão do sistema</span>
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          </div>
        </section>

      </div>
    </div>
  );
}

function TabBtn({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
        active ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
