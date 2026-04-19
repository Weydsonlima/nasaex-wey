"use client";

import { useEffect, useRef, useState } from "react";
import { X, Globe, Settings } from "lucide-react";
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

      const config = buildGameConfig("phaser-container", 800, 600, [PreloadScene, worldSceneWithData]);
      game = new Phaser.Game(config);
      gameRef.current = game;
      setLoading(false);
    }

    initGame();

    const onGalaxy = () => setGalaxyOpen(true);
    window.addEventListener("space-station:open-galaxy", onGalaxy);

    return () => {
      window.removeEventListener("space-station:open-galaxy", onGalaxy);
      game?.destroy(true);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worldConfig, avatarConfig, stationId]);

  function handleApply(newWorldConfig: StationWorldConfig, newAvatarConfig: AvatarConfig) {
    setSettingsOpen(false);
    setWorldConfig(newWorldConfig);
    setAvatarConfig(newAvatarConfig);
  }

  return (
    <div className="relative w-full h-full min-h-screen bg-slate-950">
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
      <div id="phaser-container" ref={containerRef} className="w-full h-screen" />

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
