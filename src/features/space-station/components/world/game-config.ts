import type { Types } from "phaser";

export function buildGameConfig(
  parent: string,
  width: number,
  height: number,
  scenes: Types.Scene[],
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
      mode: globalThis.Phaser?.Scale?.FIT ?? 3,
      autoCenter: globalThis.Phaser?.Scale?.CENTER_BOTH ?? 1,
    },
  };
}
