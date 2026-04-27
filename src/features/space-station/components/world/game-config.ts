import type { Types } from "phaser";

type PhaserScene = Types.Scenes.SettingsConfig | (new (...args: unknown[]) => unknown);

export function buildGameConfig(
  parent: string,
  width: number,
  height: number,
  scenes: PhaserScene[],
): Types.Core.GameConfig {
  return {
    type: globalThis.Phaser?.AUTO ?? 0,
    width,
    height,
    parent,
    backgroundColor: "#0a0a1a",
    physics: {
      default: "arcade",
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    scene: scenes,
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: globalThis.Phaser?.Scale?.RESIZE ?? 4,
      autoCenter: globalThis.Phaser?.Scale?.NO_CENTER ?? 0,
      width,
      height,
      parent,
    },
  };
}
