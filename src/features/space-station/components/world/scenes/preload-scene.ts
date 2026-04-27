import type Phaser from "phaser";

export class PreloadScene extends (globalThis.Phaser?.Scene ?? class {}) {
  constructor() {
    super({ key: "PreloadScene" });
  }

  create(this: Phaser.Scene) {
    this.scene.start("WorldScene");
  }
}
