import type Phaser from "phaser";
import type { AvatarConfig, StationWorldConfig, WorldMapData, WorldElementsConfig, RoomConfig, RoomType } from "../../../types";
import { DEFAULT_ELEMENTS, DEFAULT_ROOMS, ROOM_META } from "../../../types";
import { buildVisorSpritesheet } from "../../../utils/composite-visor";

const T = 32;
const MW = 80;
const MH = 50;
const WORLD_W = MW * T;
const WORLD_H = MH * T;
const OFFICE_ROWS = 30;
const OFFICE_H = OFFICE_ROWS * T;

// Room column config
const ROOM_COL_X = 62 * T;   // right rooms start here
const ROOM_W     = 18 * T;   // room width
const ROOM_H     = 8 * T;    // room height
const ROOM_GAP   = 2 * T;    // corridor between rooms
const DOOR_W     = 2 * T;    // door width (on left wall)
const WALL_T     = T;        // wall thickness

const C = {
  WALL:          0x5a4e3e,
  WALL_INT:      0x9a8e80,
  WALL_DOOR:     0xd4c4b0,   // door opening (floor color)
  FLOOR:         0xd8d0c4,
  FLOOR_LINE:    0xc8beb0,
  CORRIDOR:      0xe8e0d4,
  DESK_TOP:      0xc4a882,
  DESK_EDGE:     0x9e8060,
  MONITOR:       0x1a2535,
  MONITOR_GLOW:  0x2a6aff,
  DESK_SPACE:    0x1a2a3a,
  DESK_SPACE_GL: 0x00d4ff,
  CHAIR_OFFICE:  0x6a7e8a,
  CHAIR_SEAT:    0x8a9ba8,
  CHAIR_ROCKET:  0x1a1a2e,
  CHAIR_RPAD:    0x2a3a5e,
  // Room floors
  ROOM_COPA:     0xd4c4a0,
  ROOM_COZINHA:  0xccd4c0,
  ROOM_ATEND:    0xc4d0d8,
  ROOM_COWRK:    0xddd5c8,
  ROOM_REUNIAO:  0xc8d4d8,
  ROOM_RECEPCAO: 0xd0c8d8,
  // Outdoor
  GRASS:         0x5fa83c,
  GRASS_DARK:    0x4a8a2c,
  GRASS_LIGHT:   0x79c94e,
  TREE_TOP:      0x27a653,
  TREE_SHADOW:   0x156632,
  TRUNK:         0x7a5530,
  WATER:         0x3a8fd4,
  WATER_DARK:    0x2a70b0,
  WATER_LIGHT:   0x70c0f0,
  PATH:          0xc8b890,
  FLOWER_R:      0xe85050,
  FLOWER_Y:      0xf0c030,
  FLOWER_W:      0xf0f0f0,
  // Space scenario
  SPACE_BG:      0x020210,
  NEBULA1:       0x3a1060,
  NEBULA2:       0x0a1850,
  ASTEROID:      0x4a3e30,
  ASTEROID_LIT:  0x6a5e50,
  PLATFORM:      0x1a2a3a,
  PLATFORM_GLOW: 0x00d4ff,
  // Rocket scenario
  ROCKET_HULL:   0x1a1a2e,
  ROCKET_PANEL:  0x12122a,
  ROCKET_ACCENT: 0xff6b35,
  ROCKET_GLOW:   0xff8c42,
  ROCKET_GLASS:  0x4a8aaa,
  ROCKET_METAL:  0x2a3a5e,
  ROCKET_CON:    0x0a1520,
  LED_G:         0x00ff88,
  LED_R:         0xff3344,
  LED_B:         0x0088ff,
};

const ROOM_FLOOR_COLOR: Record<RoomType, number> = {
  copa:        C.ROOM_COPA,
  cozinha:     C.ROOM_COZINHA,
  atendimento: C.ROOM_ATEND,
  coworking:   C.ROOM_COWRK,
  reuniao:     C.ROOM_REUNIAO,
  recepcao:    C.ROOM_RECEPCAO,
};

interface RemotePlayer { gfx: Phaser.GameObjects.Graphics; nameText: Phaser.GameObjects.Text }

/* ─── LPC spritesheet constants ────────────────────────────────────────── */
// Standard Universal LPC format: 64×64 px per frame
// Row  8 = walk south (down),   Row  9 = walk west (left)
// Row 10 = walk north (up),     Row 11 = walk east (right)
// 9 frames per row: col 0 = idle, cols 1-8 = walk cycle
const LPC_FRAME      = 64;
const LPC_WALK_ROWS  = { down: 8, left: 9, up: 10, right: 11 } as const;
const LPC_WALK_FRAMES = 9;
// Player display scale for LPC sprites (64px → 32px logical)
const LPC_SCALE      = 0.5;

export class WorldScene extends (globalThis.Phaser?.Scene ?? class {}) {
  private player!: Phaser.Physics.Arcade.Image;
  /** Animated LPC sprite — used instead of `player` when lpcSpritesheetUrl is set */
  private lpcSprite: Phaser.Physics.Arcade.Sprite | null = null;
  private playerLabel!: Phaser.GameObjects.Text;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private remotePlayers: Map<string, RemotePlayer> = new Map();
  private worldConfig?: StationWorldConfig;
  private avatarConfig?: AvatarConfig;
  private pusherChannel?: { bind: (event: string, cb: (data: unknown) => void) => void };
  private animFrame = 0;
  private animTimer = 0;
  private facingDir: "down" | "up" | "left" | "right" = "down";

  // ─── Proximity detection (for WebRTC) ────────────────────────
  private readonly PROXIMITY_RADIUS = T * 6;   // ~192px — ~6 tiles
  private nearbyPeers: Set<string> = new Set(); // currently in range

  // ─── Zoom ─────────────────────────────────────────────────────
  private currentZoom = 1.6;
  private readonly ZOOM_MIN = 0.4;
  private readonly ZOOM_MAX = 3.5;
  private readonly ZOOM_STEP = 0.15;
  // Pinch-to-zoom
  private pinchDist: number | null = null;

  constructor() { super({ key: "WorldScene" }); }

  init(this: Phaser.Scene & WorldScene, data: {
    worldConfig: StationWorldConfig;
    avatarConfig?: AvatarConfig;
    channel?: WorldScene["pusherChannel"];
    userImage?: string | null;
  }) {
    this.worldConfig = data.worldConfig;
    // Store userImage in avatarConfig for texture generation
    this.avatarConfig = data.avatarConfig
      ? { ...data.avatarConfig, _photoUrl: data.userImage ?? undefined } as AvatarConfig
      : data.avatarConfig;
    this.pusherChannel = data.channel;
  }

  create(this: Phaser.Scene & WorldScene) {
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);

    // Create blank texture for invisible physics bodies
    if (!this.textures.exists("__blank__")) {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 0.01);
      g.fillRect(0, 0, 4, 4);
      g.generateTexture("__blank__", 4, 4);
      g.destroy();
    }

    this.walls = this.physics.add.staticGroup();

    const raw = this.worldConfig?.mapData as WorldMapData | null;
    const scenario        = raw?.scenario         ?? "station";
    const elements: WorldElementsConfig = { ...DEFAULT_ELEMENTS, ...(raw?.elements ?? {}) };
    const rooms: RoomConfig[] = raw?.rooms ?? DEFAULT_ROOMS;
    const meetingCount    = raw?.meetingRoomCount  ?? 2;

    if (scenario === "station") this.drawStation(elements, rooms, meetingCount);
    else if (scenario === "space")  this.drawSpace();
    else if (scenario === "rocket") this.drawRocket();

    const lpcUrl = (this.avatarConfig as (AvatarConfig & { lpcSpritesheetUrl?: string }) | undefined)?.lpcSpritesheetUrl;

    this.generatePlayerTextures();

    const startX = WORLD_W / 4;
    const startY = OFFICE_H / 2;

    if (lpcUrl) {
      // ── LPC mode: animated sprite ──────────────────────────────
      this.loadLpcSpritesheet(lpcUrl, startX, startY);
    } else {
      // ── SVG/Canvas mode: static image ─────────────────────────
      this.player = this.physics.add.image(startX, startY, "__player_idle__");
      this.player.setCollideWorldBounds(true).setDepth(20);
      (this.player.body as Phaser.Physics.Arcade.Body).setSize(18, 30).setOffset(7, 22);
      this.physics.add.collider(this.player, this.walls);
    }

    this.playerLabel = this.add.text(startX, startY - 32, "Você", {
      fontSize: "10px", color: "#c4b5fd",
      backgroundColor: "#00000099", padding: { x: 3, y: 1 },
    }).setOrigin(0.5).setDepth(21);

    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    // Camera follows lpcSprite if available, otherwise the static image player
    const cameraTarget = (this.lpcSprite ?? this.player) as Phaser.GameObjects.GameObject;
    this.cameras.main.startFollow(cameraTarget as Phaser.GameObjects.Image, true, 0.1, 0.1);
    this.cameras.main.setZoom(this.currentZoom);

    // ── Mouse wheel zoom ──────────────────────────────────────────
    this.input.on("wheel",
      (_ptr: unknown, _gos: unknown, _dx: number, dy: number) => {
        this.applyZoom(dy > 0 ? -this.ZOOM_STEP : this.ZOOM_STEP);
      },
    );

    // ── Touch pinch-to-zoom ───────────────────────────────────────
    this.input.on("pointermove", (ptr: Phaser.Input.Pointer) => {
      if (this.input.pointer1.isDown && this.input.pointer2.isDown) {
        const p1 = this.input.pointer1;
        const p2 = this.input.pointer2;
        const dist = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
        if (this.pinchDist !== null) {
          const delta = dist - this.pinchDist;
          this.applyZoom(delta * 0.005);
        }
        this.pinchDist = dist;
      } else {
        this.pinchDist = null;
      }
      void ptr;
    });

    // ── Keyboard zoom  +  /  - ────────────────────────────────────
    this.input.keyboard!.on("keydown-PLUS",  () => this.applyZoom(this.ZOOM_STEP));
    this.input.keyboard!.on("keydown-MINUS", () => this.applyZoom(-this.ZOOM_STEP));
    this.input.keyboard!.on("keydown-NUMPAD_ADD",      () => this.applyZoom(this.ZOOM_STEP));
    this.input.keyboard!.on("keydown-NUMPAD_SUBTRACT", () => this.applyZoom(-this.ZOOM_STEP));

    // ── External events from React buttons ───────────────────────
    const onZoomIn  = () => this.applyZoom(this.ZOOM_STEP);
    const onZoomOut = () => this.applyZoom(-this.ZOOM_STEP);
    const onZoomReset = () => this.setZoom(1.6);
    window.addEventListener("space-station:zoom-in",    onZoomIn);
    window.addEventListener("space-station:zoom-out",   onZoomOut);
    window.addEventListener("space-station:zoom-reset", onZoomReset);
    this.events.once("shutdown", () => {
      window.removeEventListener("space-station:zoom-in",    onZoomIn);
      window.removeEventListener("space-station:zoom-out",   onZoomOut);
      window.removeEventListener("space-station:zoom-reset", onZoomReset);
    });

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up:    this.input.keyboard!.addKey("W"),
      down:  this.input.keyboard!.addKey("S"),
      left:  this.input.keyboard!.addKey("A"),
      right: this.input.keyboard!.addKey("D"),
    };

    this.createGalaxyPortal();

    if (this.pusherChannel) {
      this.pusherChannel.bind("user:joined", (d) => this.onRemoteJoin(d as { userId: string; x: number; y: number; name: string }));
      this.pusherChannel.bind("user:moved",  (d) => this.onRemoteMove(d as { userId: string; x: number; y: number }));
      this.pusherChannel.bind("user:left",   (d) => this.onRemoteLeave(d as { userId: string }));
    }
  }

  // ─── Station scenario ─────────────────────────────────────────

  private drawStation(this: Phaser.Scene & WorldScene, el: WorldElementsConfig, rooms: RoomConfig[], meetingCount: number) {
    // Outdoor area first (drawn below office)
    this.drawOutdoor(el);

    const g = this.add.graphics().setDepth(1);

    // Office exterior walls (top)
    this.fillRect(g, C.WALL, 0, 0, WORLD_W, WALL_T * 2);
    this.addWall(0, 0, WORLD_W, WALL_T * 2);

    // Office floor
    this.fillRect(g, C.FLOOR, 0, WALL_T * 2, WORLD_W, OFFICE_H - WALL_T * 4);

    // Subtle floor grid
    g.lineStyle(1, C.FLOOR_LINE, 0.3);
    for (let x = 0; x <= WORLD_W; x += T) { g.moveTo(x, WALL_T * 2); g.lineTo(x, OFFICE_H - WALL_T * 2); }
    for (let y = WALL_T * 2; y <= OFFICE_H - WALL_T * 2; y += T) { g.moveTo(0, y); g.lineTo(WORLD_W, y); }
    g.strokePath();

    // Left wall
    this.fillRect(g, C.WALL, 0, WALL_T * 2, WALL_T * 2, OFFICE_H - WALL_T * 4);
    this.addWall(0, WALL_T * 2, WALL_T * 2, OFFICE_H - WALL_T * 4);

    // Right wall
    this.fillRect(g, C.WALL, WORLD_W - WALL_T * 2, WALL_T * 2, WALL_T * 2, OFFICE_H - WALL_T * 4);
    this.addWall(WORLD_W - WALL_T * 2, WALL_T * 2, WALL_T * 2, OFFICE_H - WALL_T * 4);

    // Bottom wall with door gap in center
    const doorW = WALL_T * 3;
    const doorX = WORLD_W / 2 - doorW / 2;
    this.fillRect(g, C.WALL, 0, OFFICE_H - WALL_T * 2, WORLD_W, WALL_T * 2);
    this.fillRect(g, C.FLOOR, doorX, OFFICE_H - WALL_T * 2, doorW, WALL_T * 2); // door gap
    this.addWall(0, OFFICE_H - WALL_T * 2, doorX, WALL_T * 2);
    this.addWall(doorX + doorW, OFFICE_H - WALL_T * 2, WORLD_W - (doorX + doorW), WALL_T * 2);

    // Windows on top wall
    const wg = this.add.graphics().setDepth(3);
    for (let wx = T * 4; wx < WORLD_W - T * 3; wx += T * 8) {
      this.fillRect(wg, 0x9a8e80, wx, T * 0.5, T * 5, T * 1.2);
      this.fillRect(wg, 0xa8d8f0, wx + 4, T * 0.6, T * 5 - 8, T);
    }

    // Corridor divider between coworking and rooms
    const divX = ROOM_COL_X - WALL_T;
    this.fillRect(g, C.WALL_INT, divX, WALL_T * 2, WALL_T, OFFICE_H - WALL_T * 4);
    this.addWall(divX, WALL_T * 2, WALL_T, OFFICE_H - WALL_T * 4);

    // Coworking area (left of room column)
    const cowrkRoom = rooms.find((r) => r.type === "coworking");
    if (cowrkRoom?.enabled) {
      this.drawCoworking(g, WALL_T * 2, WALL_T * 2, divX - WALL_T * 2, OFFICE_H - WALL_T * 4, el);
    }

    // Rooms on right column
    this.drawRoomColumn(rooms, meetingCount, el);

    // Plants + cabinets in coworking
    if (el.showPlants) {
      const pg = this.add.graphics().setDepth(6);
      [
        [WALL_T * 3, WALL_T * 3], [WALL_T * 3, WALL_T * 10],
        [divX - T * 3, WALL_T * 3], [divX - T * 3, WALL_T * 10],
      ].forEach(([px, py]) => this.drawPlant(pg, px, py));
    }

    if (el.showCabinets) {
      const cg = this.add.graphics().setDepth(5);
      for (let cy = WALL_T * 3; cy < OFFICE_H - T * 6; cy += T * 4) {
        this.fillRect(cg, 0xb0a090, WALL_T * 2, cy, WALL_T * 1.5, T * 2);
        cg.lineStyle(1, 0x8a7a6a, 0.5);
        cg.strokeRect(WALL_T * 2, cy + 2, WALL_T * 1.5 - 4, T * 2 - 4);
      }
    }
  }

  private drawCoworking(this: Phaser.Scene & WorldScene, g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, el: WorldElementsConfig) {
    const cols = Math.floor(w / (T * 5));
    const rows = Math.floor(h / (T * 4));
    const dg = this.add.graphics().setDepth(5);
    const startX = x + T * 3;
    const startY = y + T * 2;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const dx = startX + col * T * 5;
        const dy = startY + row * T * 4;
        if (dx + T * 4 > x + w - T) continue;
        this.drawDesk(dg, dx, dy, T * 4, T * 2, el.deskType, el.chairType);
      }
    }

    // Lounge rug
    const rg = this.add.graphics().setDepth(2);
    this.fillRect(rg, 0x8a6a94, x + T * 2, y + h - T * 7, T * 12, T * 5, 0.2);
    // Lounge chairs
    for (let i = 0; i < 3; i++) {
      this.fillRect(rg, 0x6a7e8a, x + T * 3 + i * T * 4, y + h - T * 6, T * 3, T * 2);
      this.fillRect(rg, 0x8a9ba8, x + T * 3 + i * T * 4 + 4, y + h - T * 6 + 4, T * 3 - 8, T * 2 - 8, 0.7);
    }
  }

  private drawRoomColumn(this: Phaser.Scene & WorldScene, rooms: RoomConfig[], meetingCount: number, el: WorldElementsConfig) {
    const enabledRooms: RoomType[] = [];

    for (const r of rooms) {
      if (!r.enabled) continue;
      if (r.type === "coworking") continue; // handled separately
      if (r.type === "reuniao") {
        for (let i = 0; i < meetingCount; i++) enabledRooms.push("reuniao");
      } else {
        enabledRooms.push(r.type);
      }
    }

    let roomY = WALL_T * 2;
    const rg = this.add.graphics().setDepth(3);

    for (const type of enabledRooms) {
      if (roomY + ROOM_H > OFFICE_H - WALL_T * 2) break; // no space
      this.drawRoom(rg, type, ROOM_COL_X, roomY, ROOM_W, ROOM_H, el);
      roomY += ROOM_H + ROOM_GAP;
    }
  }

  // ─── Room drawing with door + physics ────────────────────────

  private drawRoom(this: Phaser.Scene & WorldScene, g: Phaser.GameObjects.Graphics, type: RoomType, rx: number, ry: number, rw: number, rh: number, el: WorldElementsConfig) {
    const floorColor = ROOM_FLOOR_COLOR[type];

    // Floor
    this.fillRect(g, floorColor, rx, ry, rw, rh);

    // Walls (visual)
    this.fillRect(g, C.WALL_INT, rx,               ry,               rw, WALL_T); // top
    this.fillRect(g, C.WALL_INT, rx,               ry + rh - WALL_T, rw, WALL_T); // bottom
    this.fillRect(g, C.WALL_INT, rx,               ry,               WALL_T, rh); // left
    this.fillRect(g, C.WALL_INT, rx + rw - WALL_T, ry,               WALL_T, rh); // right

    // Door on left wall — centered vertically
    const doorStart = ry + (rh - DOOR_W) / 2;
    // Paint floor color over left wall for the door gap
    this.fillRect(g, floorColor, rx, doorStart, WALL_T, DOOR_W);
    // Arrow indicator on floor near door
    g.fillStyle(0xffffff, 0.15);
    g.fillTriangle(rx + WALL_T + 4, doorStart + DOOR_W / 2, rx + WALL_T + 20, doorStart + 4, rx + WALL_T + 20, doorStart + DOOR_W - 4);

    // Room label
    this.add.text(rx + rw / 2, ry + 12, `${ROOM_META[type].emoji} ${ROOM_META[type].label}`, {
      fontSize: "9px", color: "#334455", backgroundColor: "#ffffff44", padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(8);

    // Physics walls
    this.addWall(rx,               ry,               rw, WALL_T); // top
    this.addWall(rx,               ry + rh - WALL_T, rw, WALL_T); // bottom
    this.addWall(rx + rw - WALL_T, ry + WALL_T,      WALL_T, rh - WALL_T * 2); // right

    // Left wall with door gap
    const topH = doorStart - ry - WALL_T;
    if (topH > 0) this.addWall(rx, ry + WALL_T, WALL_T, topH);
    const botStart = doorStart + DOOR_W;
    const botH = (ry + rh - WALL_T) - botStart;
    if (botH > 0) this.addWall(rx, botStart, WALL_T, botH);

    // Room interior
    const ig = this.add.graphics().setDepth(5);
    const ix = rx + WALL_T + 4, iy = ry + WALL_T + 4;
    const iw = rw - WALL_T * 2 - 8, ih = rh - WALL_T * 2 - 8;
    this.drawRoomInterior(ig, type, ix, iy, iw, ih, el);
  }

  private drawRoomInterior(g: Phaser.GameObjects.Graphics, type: RoomType, x: number, y: number, w: number, h: number, el: WorldElementsConfig) {
    switch (type) {
      case "copa":        this.drawCopa(g, x, y, w, h);        break;
      case "cozinha":     this.drawCozinha(g, x, y, w, h);     break;
      case "atendimento": this.drawAtendimento(g, x, y, w, h); break;
      case "reuniao":     this.drawReuniao(g, x, y, w, h, el); break;
      case "recepcao":    this.drawRecepcao(g, x, y, w, h);    break;
      case "coworking":   break;
    }
  }

  private drawCopa(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number) {
    // Counter along top wall
    this.fillRect(g, 0xc0a060, x, y, w, T * 1.5);
    this.fillRect(g, 0x8a6a30, x, y, w, 6);
    // Coffee machine
    this.fillRect(g, 0x333333, x + 8, y + 6, 24, 24);
    this.fillRect(g, 0x222222, x + 12, y + 10, 16, 10);
    this.fillRect(g, 0xc0392b, x + 32, y + 10, 8, 8); // red button
    // Microwave
    this.fillRect(g, 0x555555, x + w - 50, y + 4, 40, 30);
    this.fillRect(g, 0x000000, x + w - 48, y + 6, 28, 20);
    this.fillRect(g, 0xffffff, x + w - 48, y + 6, 28, 20, 0.1);

    // Round tables with chairs
    const tables: [number, number][] = [[x + w * 0.3, y + h * 0.6], [x + w * 0.7, y + h * 0.6]];
    for (const [tx, ty] of tables) {
      this.circle(g, 0xa08060, tx, ty, 20);
      g.lineStyle(2, 0x8a6040, 0.8); g.strokeCircle(tx, ty, 20);
      for (const [cx, cy] of [[-26, 0], [26, 0], [0, -26], [0, 26]]) {
        this.fillRect(g, 0x6a7e8a, tx + cx - 7, ty + cy - 7, 14, 14);
        this.fillRect(g, 0x8a9ba8, tx + cx - 5, ty + cy - 5, 10, 10, 0.7);
      }
    }
  }

  private drawCozinha(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number) {
    // Counter along left & top
    this.fillRect(g, 0xb8a080, x, y, w * 0.35, h);      // left counter
    this.fillRect(g, 0xb8a080, x, y, w, T * 1.5);         // top counter
    this.fillRect(g, 0x8a6a40, x, y, 4, h);
    // Sink
    this.fillRect(g, 0xaaaaaa, x + 10, y + T * 0.6, 40, 30);
    this.fillRect(g, 0x888888, x + 12, y + T * 0.6 + 2, 36, 26);
    this.circle(g, 0x444444, x + 30, y + T * 0.4, 4);
    // Stove
    this.fillRect(g, 0x333333, x + 60, y + T * 0.3, 50, 50);
    for (const [bx, by] of [[8, 8], [28, 8], [8, 28], [28, 28]]) {
      this.circle(g, 0x222222, x + 60 + bx + 6, y + T * 0.3 + by + 6, 10);
      this.circle(g, 0x555555, x + 60 + bx + 6, y + T * 0.3 + by + 6, 6);
    }
    // Table
    const tx = x + w * 0.6, ty = y + h * 0.6;
    this.fillRect(g, 0xa08060, tx - 30, ty - 20, 60, 40);
    for (const [cx, cy] of [[-38, 0], [32, 0]]) {
      this.fillRect(g, 0x6a7e8a, tx + cx, ty - 8, 14, 16);
    }
  }

  private drawAtendimento(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number) {
    // Reception desk (L-shaped)
    this.fillRect(g, 0xc4a882, x, y + h * 0.3, w * 0.6, T * 1.5); // horizontal
    this.fillRect(g, 0xc4a882, x, y + h * 0.3, T * 1.5, h * 0.5); // vertical part
    this.fillRect(g, 0x9e8060, x, y + h * 0.3 + T * 1.5 - 4, w * 0.6, 4); // edge
    // Monitor on desk
    this.fillRect(g, 0x1a2535, x + T * 2, y + h * 0.3 + 4, 22, 16);
    this.fillRect(g, 0x2a6aff, x + T * 2 + 2, y + h * 0.3 + 6, 18, 12, 0.5);
    // Waiting chairs
    for (let i = 0; i < 3; i++) {
      this.fillRect(g, 0x6a7e8a, x + w * 0.65 + i * (T + 4), y + h * 0.5, T, T * 1.2);
      this.fillRect(g, 0x8a9ba8, x + w * 0.65 + i * (T + 4) + 4, y + h * 0.5 + 4, T - 8, T * 0.8, 0.7);
    }
    // Sign
    this.fillRect(g, 0x7c3aed, x + w * 0.65, y + h * 0.15, w * 0.25, T);
    this.add.text(x + w * 0.65 + w * 0.125, y + h * 0.15 + T / 2, "ATENDIMENTO", {
      fontSize: "7px", color: "#ffffff", fontFamily: "monospace",
    }).setOrigin(0.5).setDepth(6);
  }

  private drawReuniao(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, el: WorldElementsConfig) {
    // Meeting table (oval-ish)
    const tx = x + w / 2, ty = y + h / 2;
    const tw = Math.min(w - T * 2, 160), th = T * 1.5;
    this.fillRect(g, 0x5d8a9a, tx - tw / 2, ty - th / 2, tw, th);
    g.lineStyle(2, 0x4a7080, 0.8); g.strokeRect(tx - tw / 2, ty - th / 2, tw, th);
    // Chairs
    const chairType = el.chairType;
    const cols = Math.floor(tw / 32);
    for (let i = 0; i < cols; i++) {
      const cx = tx - tw / 2 + 16 + i * 32;
      this.drawChair(g, cx - 8, ty - th / 2 - T + 2, 16, chairType);
      this.drawChair(g, cx - 8, ty + th / 2 + 2,     16, chairType);
    }
    // TV/whiteboard
    this.fillRect(g, 0x1a2535, tx - 40, y + 4, 80, T + 8);
    this.fillRect(g, 0x2a3aff, tx - 38, y + 6, 76, T + 4, 0.5);
    g.lineStyle(2, 0xffffff, 0.3); g.strokeRect(tx - 40, y + 4, 80, T + 8);
  }

  private drawRecepcao(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number) {
    // Reception desk
    this.fillRect(g, 0xc4a882, x + w * 0.1, y + h * 0.2, w * 0.8, T * 1.5);
    this.fillRect(g, 0x9e8060, x + w * 0.1, y + h * 0.2 + T * 1.5 - 4, w * 0.8, 4);
    // Logo area
    this.fillRect(g, 0x4f46e5, x + w / 2 - 24, y + 8, 48, 20);
    this.add.text(x + w / 2, y + 18, "NASA", {
      fontSize: "8px", color: "#ffffff", fontFamily: "monospace", fontStyle: "bold",
    }).setOrigin(0.5).setDepth(6);
    // Welcome chairs
    for (let i = 0; i < 4; i++) {
      this.fillRect(g, 0x7c3aed, x + w * 0.1 + i * (T + 4), y + h * 0.6, T, T);
      this.fillRect(g, 0x9a5cf6, x + w * 0.1 + i * (T + 4) + 3, y + h * 0.6 + 3, T - 6, T - 6, 0.7);
    }
    // Plant
    this.drawPlant(g, x + w - T * 2, y + h * 0.6);
    this.drawPlant(g, x + T,          y + h * 0.6);
  }

  // ─── Outdoor ─────────────────────────────────────────────────

  private drawOutdoor(this: Phaser.Scene & WorldScene, el: WorldElementsConfig) {
    if (!el.showGrass) return;
    const g = this.add.graphics().setDepth(0);
    const oy = OFFICE_H;

    this.fillRect(g, C.GRASS, 0, oy, WORLD_W, WORLD_H - oy);
    for (let i = 0; i < 60; i++) {
      const px = Math.floor(Math.random() * MW) * T;
      const py = oy + Math.floor(Math.random() * (MH - OFFICE_ROWS)) * T;
      this.fillRect(g, C.GRASS_DARK, px, py, T, T, 0.22);
    }
    // River
    const rv = WORLD_H - 6 * T;
    this.fillRect(g, C.WATER_DARK, 0, rv, WORLD_W, 6 * T);
    this.fillRect(g, C.WATER, 0, rv + 8, WORLD_W, 6 * T - 24);
    for (let x = 0; x < WORLD_W; x += 96) {
      this.fillRect(g, C.WATER_LIGHT, x + 16, rv + 24, 48, 5, 0.6);
    }
    this.fillRect(g, C.GRASS_DARK, 0, rv - 6, WORLD_W, 10);
    // Center path
    this.fillRect(g, C.PATH, WORLD_W / 2 - 48, oy, 96, 200);

    if (el.showTrees) {
      const tg = this.add.graphics().setDepth(5);
      const treePts: [number, number][] = [
        [2,31],[6,32],[11,31],[17,33],[23,31],[29,32],[35,31],[41,33],[47,31],[53,32],[59,31],[65,33],[71,31],[77,32],
        [3,35],[8,36],[14,34],[20,36],[26,35],[32,34],[38,36],[44,34],[50,36],[56,35],[62,34],[68,36],[74,34],[78,35],
        [4,39],[10,40],[16,38],[22,40],[28,39],[34,38],[40,40],[46,39],[52,38],[58,40],[64,39],[70,38],[76,40],
      ];
      for (const [tx, ty] of treePts) {
        const px = tx * T + T / 2, py = ty * T + T / 2;
        this.circle(tg, 0x000000, px + 4, py + 8, 14, 0.18);
        this.fillRect(tg, C.TRUNK, px - 4, py - 4, 8, 14);
        this.circle(tg, C.TREE_SHADOW, px, py - 12, 18);
        this.circle(tg, C.TREE_TOP, px, py - 16, 16);
        this.circle(tg, C.GRASS_LIGHT, px - 4, py - 20, 9, 0.45);
      }
    }

    if (el.showFlowers) {
      const fg = this.add.graphics().setDepth(4);
      const fc = [C.FLOWER_R, C.FLOWER_Y, C.FLOWER_W];
      for (let i = 0; i < 100; i++) {
        const fx = Math.random() * WORLD_W;
        const fy = oy + 16 + Math.random() * (WORLD_H - oy - 200);
        this.circle(fg, fc[Math.floor(Math.random() * 3)], fx, fy, 3);
      }
    }
  }

  // ─── Space + Rocket scenarios (unchanged) ─────────────────────

  private drawSpace(this: Phaser.Scene & WorldScene) {
    const g = this.add.graphics().setDepth(0);
    this.fillRect(g, C.SPACE_BG, 0, 0, WORLD_W, WORLD_H);
    const ng = this.add.graphics().setDepth(1);
    [[0.15,0.2,400,C.NEBULA1],[0.6,0.4,500,C.NEBULA2],[0.4,0.75,380,0x501020],[0.85,0.15,300,C.NEBULA1]].forEach(([rx,ry,r,col]) => {
      this.circle(ng, col as number, (rx as number)*WORLD_W, (ry as number)*WORLD_H, r as number, 0.18);
    });
    const sg = this.add.graphics().setDepth(2);
    for (let i = 0; i < 600; i++) this.circle(sg, 0xffffff, Math.random()*WORLD_W, Math.random()*WORLD_H, Math.random()*2+0.3, Math.random()*0.6+0.3);
    const ag = this.add.graphics().setDepth(3);
    [[0.12,0.1,80],[0.35,0.08,60],[0.65,0.12,90],[0.88,0.08,70],[0.08,0.3,100],[0.5,0.25,120],[0.82,0.3,85],[0.25,0.5,95],[0.72,0.48,110],[0.45,0.65,80],[0.15,0.7,75],[0.6,0.72,90],[0.88,0.65,65],[0.3,0.85,100],[0.7,0.88,88]].forEach(([rx,ry,r]) => {
      const ax=rx*WORLD_W, ay=ry*WORLD_H;
      this.circle(ag,C.ASTEROID,ax,ay,r as number);
      this.circle(ag,C.ASTEROID_LIT,ax-(r as number)*0.3,ay-(r as number)*0.3,(r as number)*0.6,0.5);
      this.addWall(ax - (r as number), ay - (r as number), (r as number)*2, (r as number)*2);
    });
    const pg = this.add.graphics().setDepth(4);
    [[0.4,0.35,240,80],[0.55,0.35,200,70],[0.47,0.5,180,70],[0.4,0.6,160,60],[0.58,0.58,220,65]].forEach(([rx,ry,w,h]) => {
      const mx=rx*WORLD_W-w/2, my=ry*WORLD_H-h/2;
      this.fillRect(pg,C.PLATFORM,mx,my,w as number,h as number);
      pg.lineStyle(2,C.PLATFORM_GLOW,0.6); pg.strokeRect(mx,my,w as number,h as number);
      this.addWall(mx, my, w as number, h as number);
    });
  }

  private drawRocket(this: Phaser.Scene & WorldScene) {
    const g = this.add.graphics().setDepth(0);
    this.fillRect(g, C.ROCKET_HULL, 0, 0, WORLD_W, WORLD_H);
    for (let y = 0; y < WORLD_H; y += T*4) {
      for (let x = 0; x < WORLD_W; x += T*6) {
        this.fillRect(g, C.ROCKET_PANEL, x, y, T*6-2, T*4-2);
        g.lineStyle(1, 0x2a3a5e, 0.4); g.strokeRect(x, y, T*6-2, T*4-2);
      }
    }
    const rg = this.add.graphics().setDepth(3);
    // Cockpit
    this.fillRect(rg, 0x0a1020, 0, T*2, WORLD_W, T*10);
    this.addWall(0, T*2, WORLD_W, T*1.5);
    this.addWall(0, T*11, WORLD_W, T*1.5);
    const winW=WORLD_W*0.7, winH=T*7, winX=(WORLD_W-winW)/2, winY=T*3;
    this.fillRect(rg, C.SPACE_BG, winX, winY, winW, winH);
    const sg = this.add.graphics().setDepth(4);
    for (let i=0;i<150;i++) this.circle(sg,0xffffff,winX+Math.random()*winW,winY+Math.random()*winH,Math.random()*1.5+0.3,Math.random()*0.7+0.3);
    this.circle(sg, 0x3060cc, winX+winW*0.75, winY+winH*0.35, 45, 0.7);
    rg.lineStyle(6,C.ROCKET_METAL,1); rg.strokeRect(winX,winY,winW,winH);
    // Engine room
    const engY = T*35;
    this.fillRect(rg, 0x0a0a18, 0, engY, WORLD_W, WORLD_H-engY);
    this.addWall(0, engY, WORLD_W, T*2);
    [1,2,3,4,5].forEach((e) => {
      const ex=(WORLD_W/(6))*e, ey=engY+T*5;
      this.circle(rg,C.ROCKET_METAL,ex,ey,48);
      this.circle(rg,0x1a1a3e,ex,ey,40);
      this.circle(rg,C.ROCKET_GLOW,ex,ey,22,0.6);
      this.circle(rg,0xffaa00,ex,ey,14,0.7);
    });
  }

  // ─── Player textures ──────────────────────────────────────────

  /**
   * Builds three animated astronaut textures on transparent HTML5 canvases.
   * Body is drawn with pixel-art shapes (legs animate per frame).
   * Profile photo (or skin tone) is composited into the face circle.
   */
  // ─── LPC Spritesheet loader ───────────────────────────────────
  /**
   * Loads a Universal LPC spritesheet from URL, registers Phaser animations
   * (walk_down / walk_up / walk_left / walk_right / idle_<dir>) and creates
   * the physics sprite that replaces the static canvas-based player.
   */
  private loadLpcSpritesheet(this: Phaser.Scene & WorldScene, url: string, startX: number, startY: number) {
    const KEY = "__lpc_sheet__";

    const setupSprite = () => {
      if (this.lpcSprite) return; // already done

      // Register animations if not yet done
      const dirs: Array<{ dir: "down"|"up"|"left"|"right"; row: number }> = [
        { dir: "down",  row: LPC_WALK_ROWS.down  },
        { dir: "up",    row: LPC_WALK_ROWS.up    },
        { dir: "left",  row: LPC_WALK_ROWS.left  },
        { dir: "right", row: LPC_WALK_ROWS.right },
      ];

      for (const { dir, row } of dirs) {
        const walkKey = `lpc_walk_${dir}`;
        const idleKey = `lpc_idle_${dir}`;

        if (!this.anims.exists(walkKey)) {
          // Walk: frames 1-8 on the given row
          this.anims.create({
            key: walkKey,
            frames: Array.from({ length: 8 }, (_, i) => ({
              key: KEY,
              frame: (row * LPC_WALK_FRAMES + 1 + i),
            })),
            frameRate: 10,
            repeat: -1,
          });
        }

        if (!this.anims.exists(idleKey)) {
          // Idle: frame 0 on the given row
          this.anims.create({
            key: idleKey,
            frames: [{ key: KEY, frame: row * LPC_WALK_FRAMES }],
            frameRate: 1,
            repeat: -1,
          });
        }
      }

      // Create physics sprite
      const sprite = this.physics.add.sprite(startX, startY, KEY)
        .setScale(LPC_SCALE)
        .setDepth(20)
        .setCollideWorldBounds(true);

      // Hitbox fits the visible character body (middle portion of 64×64 frame at 0.5 scale)
      const body = sprite.body as Phaser.Physics.Arcade.Body;
      body.setSize(24, 40).setOffset(20, 22);

      this.lpcSprite = sprite;
      this.physics.add.collider(this.lpcSprite, this.walls);

      // Camera — update target to lpcSprite
      this.cameras.main.startFollow(this.lpcSprite, true, 0.1, 0.1);

      // Start idle animation
      this.lpcSprite.anims.play("lpc_idle_down");
    };

    if (this.textures.exists(KEY)) {
      setupSprite();
      return;
    }

    // Resolve URL — "pixel_astronaut" is a built-in that uses profile photo compositing
    const PIXEL_ASTRONAUT_BASE = "/lpc_pixel_astronaut.png";
    const isPixelAstronaut = url === "pixel_astronaut";
    const profileUrl = (this.avatarConfig as AvatarConfig & { _photoUrl?: string })?._photoUrl;

    const loadFromUrl = (resolvedUrl: string) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (this.textures.exists(KEY)) { setupSprite(); return; }
        const cols = Math.floor(img.naturalWidth  / LPC_FRAME);
        const rows = Math.floor(img.naturalHeight / LPC_FRAME);
        const canvas = document.createElement("canvas");
        canvas.width  = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext("2d")!.drawImage(img, 0, 0);
        this.textures.addSpriteSheet(KEY, canvas, {
          frameWidth: LPC_FRAME, frameHeight: LPC_FRAME,
          startFrame: 0, endFrame: cols * rows - 1,
        });
        setupSprite();
        // Revoke blob URL when done
        if (resolvedUrl.startsWith("blob:")) URL.revokeObjectURL(resolvedUrl);
      };
      img.onerror = () => {
        console.warn("[WorldScene] Failed to load LPC spritesheet:", resolvedUrl);
        const canvas = document.createElement("canvas");
        canvas.width = LPC_FRAME; canvas.height = LPC_FRAME;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = (this.avatarConfig?.suitColor ?? "#7c3aed");
        ctx.fillRect(16, 20, 32, 40);
        ctx.fillStyle = (this.avatarConfig?.skinTone ?? "#FFDBB4");
        ctx.beginPath(); ctx.arc(32, 14, 12, 0, Math.PI * 2); ctx.fill();
        this.textures.addCanvas(KEY, canvas);
        setupSprite();
      };
      img.src = resolvedUrl;
    };

    if (isPixelAstronaut) {
      // Composite profile photo into visor, then load
      buildVisorSpritesheet(PIXEL_ASTRONAUT_BASE, profileUrl)
        .then(loadFromUrl)
        .catch(() => loadFromUrl(PIXEL_ASTRONAUT_BASE));
    } else {
      loadFromUrl(url);
    }
  }

  private generatePlayerTextures(this: Phaser.Scene & WorldScene) {
    const cfg       = this.avatarConfig;
    const suitHex   = cfg?.suitColor   ?? "#3b6fd4";
    const helmHex   = cfg?.helmetColor ?? "#06b6d4";
    const skinHex   = cfg?.skinTone    ?? "#FFDBB4";
    const hairHex   = cfg?.hairColor   ?? "#3B2A1E";
    const acc       = cfg?.accessory   ?? "none";
    const photoUrl  = cfg?.useProfilePhoto
      ? (cfg as AvatarConfig & { _photoUrl?: string })._photoUrl
      : undefined;

    // ── SVG-based texture generation ──────────────────────────────────────────
    // Each frame SVG has named <g id="..."> groups with a fill attribute.
    // We replace the fill color for each group to apply the avatar config.
    const colorMap: Record<string, string> = {
      "suit":      suitHex,
      "suit-arms": suitHex,
      "suit-legs": suitHex,
      "helmet":    helmHex,
      "visor":     "#1B2A4A",
      "face":      skinHex,
      "hair":      hairHex,
      "beard":     hairHex,
      "gloves":    "#1A2A3A",
      "boots":     "#1C2A36",
      "backpack":  "#2A3F60",
      "detail":    "#FFFFFF",
    };

    const recolorSvg = (svgText: string): string => {
      let out = svgText;
      for (const [id, color] of Object.entries(colorMap)) {
        // Replace: <g id="suit" fill="#...">  →  <g id="suit" fill="<newColor>">
        out = out.replace(
          new RegExp(`(<g id="${id}"[^>]*fill=")[^"]*(")`,"g"),
          `$1${color}$2`
        );
      }
      return out;
    };

    const FRAME_FILES: { key: string; file: string }[] = [
      { key: "__player_idle__",   file: "/astronaut-idle.svg"   },
      { key: "__player_walk_a__", file: "/astronaut-walk_a.svg" },
      { key: "__player_walk_b__", file: "/astronaut-walk_b.svg" },
    ];

    const W = 32, H = 54;
    const SVG_W = 320, SVG_H = 540;

    const loadSvgFrame = (frameKey: string, svgText: string, photo?: HTMLImageElement | null) => {
      const colored = recolorSvg(svgText);
      const blob    = new Blob([colored], { type: "image/svg+xml" });
      const url     = URL.createObjectURL(blob);

      const svgImg = new Image(SVG_W, SVG_H);
      svgImg.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext("2d")!;

        // Draw scaled SVG onto small canvas (crisp pixels)
        ctx.drawImage(svgImg, 0, 0, SVG_W, SVG_H, 0, 0, W, H);

        // Composite profile photo into face circle
        if (photo) {
          const HX = 16, HY = 11, HR = 9;
          ctx.save();
          ctx.beginPath();
          ctx.arc(HX, HY, HR, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(photo, HX - HR, HY - HR, HR * 2, HR * 2);
          ctx.restore();
        }

        URL.revokeObjectURL(url);
        if ((this as unknown as Phaser.Scene).textures?.exists(frameKey)) {
          (this as unknown as Phaser.Scene).textures.remove(frameKey);
        }
        (this as unknown as Phaser.Scene).textures.addCanvas(frameKey, canvas);

        // Refresh player sprite if already created
        const scene = this as unknown as Phaser.Scene & WorldScene;
        if (scene.player && scene.player.texture.key !== frameKey) {
          // player is live — force texture refresh on idle frame
          if (frameKey === "__player_idle__") {
            scene.player.setTexture("__player_idle__");
          }
        }
      };
      svgImg.onerror = () => {
        URL.revokeObjectURL(url);
        // Fall back to solid-color canvas
        const canvas = document.createElement("canvas");
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = suitHex;
        ctx.fillRect(0, 16, W, H - 16);
        ctx.fillStyle = skinHex;
        ctx.beginPath(); ctx.arc(W/2, 11, 9, 0, Math.PI*2); ctx.fill();
        if ((this as unknown as Phaser.Scene).textures?.exists(frameKey)) {
          (this as unknown as Phaser.Scene).textures.remove(frameKey);
        }
        (this as unknown as Phaser.Scene).textures.addCanvas(frameKey, canvas);
      };
      svgImg.src = url;
    };

    const loadAll = (photo?: HTMLImageElement | null) => {
      for (const { key, file } of FRAME_FILES) {
        fetch(file)
          .then(res => res.text())
          .then(text => loadSvgFrame(key, text, photo))
          .catch(() => {
            // file not found — build minimal fallback immediately
            const canvas = document.createElement("canvas");
            canvas.width = W; canvas.height = H;
            const ctx = canvas.getContext("2d")!;
            ctx.fillStyle = suitHex;
            ctx.fillRect(0, 16, W, H - 16);
            ctx.fillStyle = skinHex;
            ctx.beginPath(); ctx.arc(W/2, 11, 9, 0, Math.PI*2); ctx.fill();
            if ((this as unknown as Phaser.Scene).textures?.exists(key)) {
              (this as unknown as Phaser.Scene).textures.remove(key);
            }
            (this as unknown as Phaser.Scene).textures.addCanvas(key, canvas);
          });
      }
    };

    // Build placeholder textures synchronously so player sprite exists immediately
    for (const { key } of FRAME_FILES) {
      const canvas = document.createElement("canvas");
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = suitHex;
      ctx.fillRect(4, 16, W - 8, H - 20);
      ctx.fillStyle = skinHex;
      ctx.beginPath(); ctx.arc(W/2, 11, 9, 0, Math.PI*2); ctx.fill();
      if (!(this as unknown as Phaser.Scene).textures.exists(key)) {
        (this as unknown as Phaser.Scene).textures.addCanvas(key, canvas);
      }
    }

    // Then asynchronously load real SVG textures (with optional photo)
    if (photoUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload  = () => loadAll(img);
      img.onerror = () => loadAll(null);
      img.src = photoUrl;
    } else {
      loadAll(null);
    }

  }

  // ─── Galaxy portal ────────────────────────────────────────────

  private createGalaxyPortal(this: Phaser.Scene & WorldScene) {
    const px = WORLD_W - T*5, py = T*5;
    const portal = this.add.circle(px, py, 28, 0x7c3aed, 0.85).setDepth(15).setInteractive();
    this.add.circle(px, py, 36, 0x818cf8, 0.2).setDepth(14);
    this.add.text(px, py+42, "🌌 Galáxia", { fontSize: "9px", color: "#c4b5fd" }).setOrigin(0.5).setDepth(15);
    portal.on("pointerdown", () => window.dispatchEvent(new CustomEvent("space-station:open-galaxy")));
    this.tweens.add({ targets: portal, alpha: { from: 0.6, to: 1 }, duration: 1500, yoyo: true, repeat: -1 });
  }

  // ─── Helpers ─────────────────────────────────────────────────

  private addWall(x: number, y: number, w: number, h: number) {
    const img = this.walls.create(x + w / 2, y + h / 2, "__blank__") as Phaser.Physics.Arcade.Image;
    img.setSize(w, h).setVisible(false).refreshBody();
  }

  private drawDesk(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, type: string, chairType: string) {
    if (type === "space") {
      this.fillRect(g, C.DESK_SPACE, x, y, w, h);
      g.lineStyle(1, C.DESK_SPACE_GL, 0.5); g.strokeRect(x, y, w, h);
      this.fillRect(g, C.DESK_SPACE_GL, x+8, y+4, 18, 12, 0.5);
    } else if (type === "minimal") {
      this.fillRect(g, 0xe8e8e0, x, y, w, h);
      g.lineStyle(1, 0xccccbc, 0.8); g.strokeRect(x, y, w, h);
      this.fillRect(g, C.MONITOR, x+8, y+4, 16, 12);
    } else {
      this.fillRect(g, C.DESK_TOP, x, y, w, h);
      this.fillRect(g, C.DESK_EDGE, x, y+h-4, w, 4);
      this.fillRect(g, C.MONITOR, x+8, y+4, 18, 13);
      this.fillRect(g, C.MONITOR_GLOW, x+10, y+6, 14, 9, 0.5);
      if (w > 80) { this.fillRect(g, C.MONITOR, x+w-28, y+4, 18, 13); this.fillRect(g, C.MONITOR_GLOW, x+w-26, y+6, 14, 9, 0.5); }
    }
    this.drawChair(g, x + w/2 - 10, y + h + 2, 20, chairType);
  }

  private drawChair(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, type: string) {
    if (type === "rocket") {
      this.fillRect(g, C.CHAIR_ROCKET, x, y, w, 16);
      this.fillRect(g, C.CHAIR_RPAD, x+2, y+2, w-4, 12);
      this.fillRect(g, C.ROCKET_ACCENT, x+w/2-2, y+2, 4, 6, 0.5);
    } else {
      this.fillRect(g, C.CHAIR_OFFICE, x, y, w, 14);
      this.fillRect(g, C.CHAIR_SEAT, x+2, y+2, w-4, 10, 0.7);
    }
  }

  private drawPlant(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    this.fillRect(g, 0xb05a30, x, y+16, 16, 12);
    this.circle(g, 0x2d8a4e, x+8, y+12, 12);
    this.circle(g, 0x1a6635, x+4, y+8, 7, 0.5);
  }

  // ─── Remote players ───────────────────────────────────────────

  private onRemoteJoin(data: { userId: string; x: number; y: number; name: string }) {
    if (this.remotePlayers.has(data.userId)) return;
    const gfx = this.add.graphics().setDepth(19);
    gfx.fillStyle(0xe67e22,1); gfx.fillCircle(0,-10,11); gfx.fillRect(-9,2,18,20);
    gfx.setPosition(data.x, data.y);
    const nameText = this.add.text(data.x, data.y-32, data.name, {
      fontSize: "9px", color: "#fde68a", backgroundColor: "#00000080", padding: {x:2,y:1},
    }).setOrigin(0.5).setDepth(20);
    this.remotePlayers.set(data.userId, { gfx, nameText });
  }

  private onRemoteMove(data: { userId: string; x: number; y: number }) {
    const p = this.remotePlayers.get(data.userId);
    if (!p) return;
    p.gfx.setPosition(data.x, data.y);
    p.nameText.setPosition(data.x, data.y-32);
  }

  private onRemoteLeave(data: { userId: string }) {
    const p = this.remotePlayers.get(data.userId);
    if (!p) return;
    p.gfx.destroy(); p.nameText.destroy();
    this.remotePlayers.delete(data.userId);
    // Notify WebRTC hook to close peer connection
    if (this.nearbyPeers.has(data.userId)) {
      this.nearbyPeers.delete(data.userId);
      window.dispatchEvent(new CustomEvent("space-station:proximity-leave", {
        detail: { peerId: data.userId },
      }));
    }
  }

  // ─── Zoom helpers ─────────────────────────────────────────────

  private applyZoom(this: Phaser.Scene & WorldScene, delta: number) {
    this.setZoom(this.currentZoom + delta);
  }

  private setZoom(this: Phaser.Scene & WorldScene, value: number) {
    this.currentZoom = Phaser.Math.Clamp(value, this.ZOOM_MIN, this.ZOOM_MAX);
    this.cameras.main.setZoom(this.currentZoom);
    // Notify React of the current zoom level
    window.dispatchEvent(new CustomEvent("space-station:zoom-changed", {
      detail: { zoom: this.currentZoom, min: this.ZOOM_MIN, max: this.ZOOM_MAX },
    }));
  }

  // ─── Update ───────────────────────────────────────────────────

  update(this: Phaser.Scene & WorldScene) {
    const speed = 160;
    const up    = this.cursors.up.isDown    || this.wasd.up.isDown;
    const down  = this.cursors.down.isDown  || this.wasd.down.isDown;
    const left  = this.cursors.left.isDown  || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const moving = up || down || left || right;

    if (this.lpcSprite) {
      // ── LPC sprite movement ──────────────────────────────────────
      const body = this.lpcSprite.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0, 0);
      if (up)    { body.setVelocityY(-speed); this.facingDir = "up"; }
      if (down)  { body.setVelocityY(speed);  this.facingDir = "down"; }
      if (left)  { body.setVelocityX(-speed); this.facingDir = "left"; }
      if (right) { body.setVelocityX(speed);  this.facingDir = "right"; }

      const walkKey = `lpc_walk_${this.facingDir}`;
      const idleKey = `lpc_idle_${this.facingDir}`;
      const curKey  = this.lpcSprite.anims.currentAnim?.key ?? "";

      if (moving) {
        if (curKey !== walkKey) this.lpcSprite.anims.play(walkKey, true);
      } else {
        if (curKey !== idleKey) this.lpcSprite.anims.play(idleKey, true);
      }

      this.playerLabel.setPosition(this.lpcSprite.x, this.lpcSprite.y - 44);

      if (this.game.getFrame() % 6 === 0 && moving) {
        window.dispatchEvent(new CustomEvent("space-station:player-moved", {
          detail: { x: this.lpcSprite.x, y: this.lpcSprite.y },
        }));
      }
    } else {
      // ── Canvas/SVG sprite movement ───────────────────────────────
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0, 0);
      if (up)    { body.setVelocityY(-speed); this.facingDir = "up"; }
      if (down)  { body.setVelocityY(speed);  this.facingDir = "down"; }
      if (left)  { body.setVelocityX(-speed); this.facingDir = "left"; }
      if (right) { body.setVelocityX(speed);  this.facingDir = "right"; }

      if (moving) {
        this.animTimer++;
        if (this.animTimer % 10 === 0) {
          this.animFrame = (this.animFrame + 1) % 2;
          this.player.setTexture(this.animFrame === 0 ? "__player_walk_a__" : "__player_walk_b__");
          this.player.setFlipX(this.facingDir === "left");
        }
      } else {
        this.animFrame = 0; this.animTimer = 0;
        this.player.setTexture("__player_idle__");
      }

      this.playerLabel.setPosition(this.player.x, this.player.y - 36);

      if (this.game.getFrame() % 6 === 0 && moving) {
        window.dispatchEvent(new CustomEvent("space-station:player-moved", {
          detail: { x: this.player.x, y: this.player.y },
        }));
      }
    }

    // ── Proximity check (every 30 frames ~0.5s) ──────────────────
    if (this.game.getFrame() % 30 === 0) {
      this.checkProximity();
    }
  }

  private checkProximity(this: Phaser.Scene & WorldScene) {
    const active = this.lpcSprite ?? this.player;
    const px = active.x;
    const py = active.y;
    const r  = this.PROXIMITY_RADIUS;
    const nowNear = new Set<string>();

    this.remotePlayers.forEach((rp, userId) => {
      const dx = rp.gfx.x - px;
      const dy = rp.gfx.y - py;
      if (Math.sqrt(dx*dx + dy*dy) <= r) {
        nowNear.add(userId);
        if (!this.nearbyPeers.has(userId)) {
          // entered proximity
          window.dispatchEvent(new CustomEvent("space-station:proximity-enter", {
            detail: {
              peerId:    userId,
              peerName:  rp.nameText.text,
              peerImage: null,
            },
          }));
        }
      }
    });

    // Detect departures
    this.nearbyPeers.forEach(userId => {
      if (!nowNear.has(userId)) {
        window.dispatchEvent(new CustomEvent("space-station:proximity-leave", {
          detail: { peerId: userId },
        }));
      }
    });

    this.nearbyPeers = nowNear;
  }

  // ─── Drawing utils ────────────────────────────────────────────

  private fillRect(g: Phaser.GameObjects.Graphics, color: number, x: number, y: number, w: number, h: number, alpha = 1) {
    g.fillStyle(color, alpha); g.fillRect(x, y, w, h);
  }

  private circle(g: Phaser.GameObjects.Graphics, color: number, cx: number, cy: number, r: number, alpha = 1) {
    g.fillStyle(color, alpha); g.fillCircle(cx, cy, r);
  }
}
