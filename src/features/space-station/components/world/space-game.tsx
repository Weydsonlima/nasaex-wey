"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Globe, Settings, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StationWorldConfig, AvatarConfig } from "../../types";
import { StationExplorer } from "../station-explorer";
import { WorldSettingsPanel } from "./world-settings-panel";

interface Props {
  worldConfig: StationWorldConfig;
  avatarConfig?: AvatarConfig;
  stationId: string;
  nick: string;
  isOwner?: boolean;
  userImage?: string | null;
}

export function SpaceGame({ worldConfig: initialWorldConfig, avatarConfig: initialAvatarConfig, stationId, nick, isOwner, userImage }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<import("phaser").Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [galaxyOpen, setGalaxyOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [worldConfig, setWorldConfig] = useState(initialWorldConfig);
  const [avatarConfig, setAvatarConfig] = useState(initialAvatarConfig);
  const [zoomLevel, setZoomLevel] = useState(1.6);
  const [zoomMin, setZoomMin] = useState(0.4);
  const [zoomMax, setZoomMax] = useState(3.5);

  useEffect(() => {
    if (!containerRef.current) return;

    let game: import("phaser").Game | null = null;
    setLoading(true);

    async function initGame() {
      const PhaserModule = await import("phaser");
      const Phaser = PhaserModule.default ?? PhaserModule;
      const { PreloadScene } = await import("./scenes/preload-scene");
      const { WorldScene } = await import("./scenes/world-scene");
      const { buildGameConfig } = await import("./game-config");

      let channel: { bind: (event: string, cb: (data: unknown) => void) => void } | undefined;
      try {
        const { pusherClient } = await import("@/lib/pusher");
        channel = pusherClient.subscribe(`presence-world-${stationId}`) as typeof channel;
      } catch {
        // Pusher not configured, single-player mode
      }

      const capturedWorldConfig = worldConfig;
      const capturedAvatarConfig = avatarConfig;

      const worldSceneWithData = class extends WorldScene {
        create() {
          super.init({ worldConfig: capturedWorldConfig, avatarConfig: capturedAvatarConfig, channel });
          super.create();
        }
      };

      const w = window.innerWidth;
      const h = window.innerHeight;
      const config = buildGameConfig("phaser-container", w, h, [PreloadScene, worldSceneWithData]);
      game = new Phaser.Game(config);
      gameRef.current = game;
      setLoading(false);
    }

    initGame();

    const onGalaxy = () => setGalaxyOpen(true);
    const onZoomChanged = (e: Event) => {
      const { zoom, min, max } = (e as CustomEvent).detail as { zoom: number; min: number; max: number };
      setZoomLevel(zoom);
      setZoomMin(min);
      setZoomMax(max);
    };
    window.addEventListener("space-station:open-galaxy", onGalaxy);
    window.addEventListener("space-station:zoom-changed", onZoomChanged);

    return () => {
      window.removeEventListener("space-station:open-galaxy", onGalaxy);
      window.removeEventListener("space-station:zoom-changed", onZoomChanged);
      game?.destroy(true);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worldConfig, avatarConfig, stationId]);

  function handleApply(newWorldConfig: StationWorldConfig, newAvatarConfig: AvatarConfig) {
    setSettingsOpen(false);
    setWorldConfig(newWorldConfig);
    setAvatarConfig(newAvatarConfig);
  }

  const handleZoomIn    = useCallback(() => window.dispatchEvent(new Event("space-station:zoom-in")),    []);
  const handleZoomOut   = useCallback(() => window.dispatchEvent(new Event("space-station:zoom-out")),   []);
  const handleZoomReset = useCallback(() => window.dispatchEvent(new Event("space-station:zoom-reset")), []);

  const zoomPct = Math.round((zoomLevel / 1.6) * 100);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950">
          <div className="text-4xl mb-4 animate-pulse">🚀</div>
          <p className="text-white text-sm mb-4">Preparando mundo virtual...</p>
          <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden">
            <div id="preload-bar" className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: "0%" }} />
          </div>
        </div>
      )}

      {/* Game container */}
      <div id="phaser-container" ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* HUD overlay */}
      {!loading && (
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-slate-300">
            <span className="font-mono text-indigo-400">@{nick}</span> · Space Station
          </div>
          <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-slate-400">
            WASD ou ← ↑ ↓ → para mover
          </div>
        </div>
      )}

      {/* Top-right buttons */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {isOwner && !loading && (
          <Button
            size="sm"
            variant="outline"
            className="bg-black/60 border-white/20 text-white hover:bg-white/10"
            onClick={() => { setSettingsOpen((o) => !o); setGalaxyOpen(false); }}
          >
            <Settings className="h-4 w-4 mr-1" />
            Configurar
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="bg-black/60 border-white/20 text-white hover:bg-white/10"
          onClick={() => (window.location.href = `/station/${nick}`)}
        >
          <X className="h-4 w-4 mr-1" />
          Sair
        </Button>
      </div>

      {/* Galaxy explorer */}
      {galaxyOpen && !settingsOpen && (
        <div className="absolute inset-y-0 right-0 z-20 w-80 bg-slate-900/95 backdrop-blur-sm border-l border-white/10 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-indigo-400" />
              <h2 className="text-white font-semibold">Galáxia NASA</h2>
            </div>
            <Button size="icon" variant="ghost" onClick={() => setGalaxyOpen(false)} className="text-slate-400">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <StationExplorer />
        </div>
      )}

      {/* Zoom controls — canto inferior direito */}
      {!loading && (
        <div className="absolute bottom-5 right-5 z-10 flex flex-col items-center gap-1">
          {/* Zoom in */}
          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= zoomMax}
            className="w-9 h-9 rounded-xl bg-black/60 border border-white/20 text-white flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition-all backdrop-blur-sm"
            title="Zoom in (+)"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          {/* Indicador de zoom — clica para resetar */}
          <button
            onClick={handleZoomReset}
            className="w-9 h-9 rounded-xl bg-black/60 border border-white/20 text-white flex items-center justify-center hover:bg-white/10 transition-all backdrop-blur-sm"
            title="Resetar zoom (100%)"
          >
            <span className="text-[9px] font-bold leading-none tabular-nums">
              {zoomPct}%
            </span>
          </button>

          {/* Zoom out */}
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= zoomMin}
            className="w-9 h-9 rounded-xl bg-black/60 border border-white/20 text-white flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition-all backdrop-blur-sm"
            title="Zoom out (-)"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={() => {
              if (!document.fullscreenElement) document.documentElement.requestFullscreen();
              else document.exitFullscreen();
            }}
            className="w-9 h-9 rounded-xl bg-black/60 border border-white/20 text-white flex items-center justify-center hover:bg-white/10 transition-all backdrop-blur-sm mt-1"
            title="Tela cheia"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Settings panel */}
      {settingsOpen && (
        <WorldSettingsPanel
          stationId={stationId}
          worldConfig={worldConfig}
          avatarConfig={avatarConfig}
          nick={nick}
          userImage={userImage}
          onClose={() => setSettingsOpen(false)}
          onApply={handleApply}
        />
      )}
    </div>
  );
}
