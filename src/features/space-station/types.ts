export type StationType = "USER" | "ORG";
export type StationRank = "COMMANDER" | "CREW";
export type StationModule =
  | "FORM"
  | "CHAT"
  | "AGENDA"
  | "INTEGRATION"
  | "NBOX"
  | "FORGE"
  | "APPS"
  | "NOTIFICATIONS";
export type AmbientTheme = "space" | "nebula" | "asteroid" | "galaxy";

export type GameView = "aerial" | "sidescroll";

export type HairStyle = "none" | "short" | "long" | "curly" | "afro" | "ponytail";
export type BeardStyle = "none" | "stubble" | "short" | "full";
export type FaceAccessory = "none" | "glasses" | "sunglasses";

export interface AvatarConfig {
  suitColor: string;
  helmetColor: string;
  accessory: "none" | "flag" | "jetpack";
  skinTone: string;
  // novos campos de personalização visual
  useProfilePhoto: boolean;
  hairStyle: HairStyle;
  hairColor: string;
  beardStyle: BeardStyle;
  faceAccessory: FaceAccessory;
  /**
   * URL do spritesheet LPC gerado pelo Universal LPC Character Generator.
   * Quando definido, o Phaser usa este spritesheet animado ao invés do
   * compositor SVG/Canvas interno. Formato: PNG 64×64 por frame,
   * rows 8-11 = walk (S/W/N/E), 9 frames por linha.
   */
  lpcSpritesheetUrl?: string;
  /** Nome/rótulo do personagem LPC para exibição no painel */
  lpcCharacterName?: string;
  /** Overlays opcionais (WorkAdventure-style) aplicados sobre o spritesheet base. */
  wokaEyesUrl?:      string | null;
  wokaHairUrl?:      string | null;
  wokaClothesUrl?:   string | null;
  wokaHatUrl?:       string | null;
  wokaAccessoryUrl?: string | null;
  /** Multiplicador de escala visual do avatar (0.5 – 2.5, default 1). */
  avatarScale?: number;
}

export const AVATAR_SCALE_DEFAULT = 1;
export const AVATAR_SCALE_MIN     = 0.5;
export const AVATAR_SCALE_MAX     = 2.5;

export interface MeetingPoint {
  x: number;
  y: number;
  label: string;
}

export interface StationWorldConfig {
  id: string;
  stationId: string;
  planetColor: string;
  ambientTheme: AmbientTheme;
  avatarConfig: AvatarConfig | null;
  meetingPoints: MeetingPoint[] | null;
  npcConfig: unknown;
  mapData: unknown;
}

export interface StationPublicModule {
  id: string;
  stationId: string;
  module: StationModule;
  resourceId: string | null;
  isActive: boolean;
  config: Record<string, unknown> | null;
}

export interface PublicStation {
  id: string;
  nick: string;
  type: StationType;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  rank: StationRank;
  starsReceived: number;
  isPublic: boolean;
  worldConfig: StationWorldConfig | null;
  publicModules: StationPublicModule[];
  user: { id: string; name: string; image: string | null; nickname: string | null } | null;
  org: { id: string; name: string; slug: string; logo: string | null } | null;
  receivedStars: { id: string; amount: number; message: string | null; createdAt: string }[];
}

export interface OrgChartMember {
  id: string;
  role: string;
  cargo: string | null;
  user: {
    id: string;
    name: string;
    image: string | null;
    nickname: string | null;
    spaceStation: { nick: string; rank: StationRank; avatarUrl: string | null; isPublic: boolean } | null;
  };
}

export interface StationListItem {
  id: string;
  nick: string;
  type: StationType;
  bio: string | null;
  avatarUrl: string | null;
  rank: StationRank;
  starsReceived: number;
  worldConfig: { planetColor: string; ambientTheme: string } | null;
  user: { name: string; image: string | null } | null;
  org: { name: string; logo: string | null } | null;
}

export const MODULE_LABELS: Record<StationModule, string> = {
  FORM: "Formulários",
  CHAT: "Chat",
  AGENDA: "Agenda",
  INTEGRATION: "Integrações",
  NBOX: "N-Box",
  FORGE: "Forge",
  APPS: "Apps",
  NOTIFICATIONS: "Notificações",
};

export const MODULE_ICONS: Record<StationModule, string> = {
  FORM: "📋",
  CHAT: "💬",
  AGENDA: "📅",
  INTEGRATION: "🔗",
  NBOX: "📦",
  FORGE: "⚒️",
  APPS: "🚀",
  NOTIFICATIONS: "🔔",
};

export type RoomType = "copa" | "cozinha" | "atendimento" | "coworking" | "reuniao" | "recepcao";

export interface RoomConfig {
  type: RoomType;
  enabled: boolean;
}

export const ROOM_META: Record<RoomType, { label: string; emoji: string; description: string; defaultEnabled: boolean }> = {
  copa:        { label: "Copa",                emoji: "☕", description: "Sala de descanso e café",          defaultEnabled: true },
  cozinha:     { label: "Cozinha",             emoji: "🍳", description: "Cozinha equipada",                 defaultEnabled: false },
  atendimento: { label: "Área de Atendimento", emoji: "🎯", description: "Recepção de clientes e suporte",   defaultEnabled: false },
  coworking:   { label: "Coworking",           emoji: "💼", description: "Área aberta de trabalho",          defaultEnabled: true },
  reuniao:     { label: "Salas de Reunião",    emoji: "📊", description: "Salas com mesa e TV",              defaultEnabled: true },
  recepcao:    { label: "Recepção",            emoji: "🏢", description: "Área de entrada e espera",         defaultEnabled: false },
};

export const DEFAULT_ROOMS: RoomConfig[] = (Object.keys(ROOM_META) as RoomType[]).map((type) => ({
  type,
  enabled: ROOM_META[type].defaultEnabled,
}));

export interface WorldElementsConfig {
  deskType: "standard" | "space" | "minimal";
  showMeetingRooms: boolean;
  showCafeteria: boolean;
  showPlants: boolean;
  showCabinets: boolean;
  chairType: "office" | "rocket";
  showGrass: boolean;
  showTrees: boolean;
  showFlowers: boolean;
}

export interface SelectedWorldAssets {
  chair?:     string;
  desk?:      string;
  computer?:  string;
  furniture?: string;
}

export interface WorldMapData {
  scenario: "space" | "station" | "rocket" | "custom";
  gameView: GameView;
  elements: WorldElementsConfig;
  rooms: RoomConfig[];
  meetingRoomCount: number;
  selectedAssets?: SelectedWorldAssets;
  placedObjects?: PlacedMapObject[];
  areas?: MapArea[];
  roomConfig?: MapRoomConfig;
  tileLayer?: TileLayer;
}

/* ─── Map Editor (tiles + areas + objects) ─────────────────────── */

export interface PlacedMapObject {
  id:        string;
  url:       string;
  name:      string;
  x:         number;
  y:         number;
  scale?:    number;
  rotation?: number;
  depth?:    number;
  solid?:    boolean;
}

export type AreaType =
  | "silent" | "exit" | "website" | "play-audio" | "meeting"
  | "info" | "credits" | "focus" | "spawn";

export interface MapArea {
  id:    string;
  name:  string;
  type:  AreaType;
  x:     number;
  y:     number;
  w:     number;
  h:     number;
  color?: string;
  props?: {
    targetNick?: string;
    url?:        string;
    audioUrl?:   string;
    roomName?:   string;
    message?:    string;
  };
}

export const AREA_TYPE_META: Record<AreaType, { label: string; emoji: string; color: string; description: string }> = {
  silent:       { label: "Silenciosa",  emoji: "🤫", color: "#64748b", description: "Áudio desabilitado" },
  exit:         { label: "Saída",        emoji: "🚪", color: "#a855f7", description: "Teleporta para outra station" },
  website:      { label: "Website",     emoji: "🌐", color: "#06b6d4", description: "Abre uma URL" },
  "play-audio": { label: "Áudio",        emoji: "🔊", color: "#10b981", description: "Reproduz áudio ao entrar" },
  meeting:      { label: "Reunião",     emoji: "📊", color: "#f59e0b", description: "Sala de reunião" },
  info:         { label: "Info",         emoji: "ℹ️", color: "#3b82f6", description: "Exibe mensagem" },
  credits:      { label: "Créditos",    emoji: "©️", color: "#f97316", description: "Créditos e atribuições" },
  focus:        { label: "Foco",         emoji: "🎯", color: "#ef4444", description: "Área de destaque" },
  spawn:        { label: "Spawn",        emoji: "✨", color: "#22c55e", description: "Ponto de início" },
};

export interface MapRoomConfig {
  name?:        string;
  description?: string;
  floorColor?:  string;
  showGrid?:    boolean;
  gridSize?:    number;
  bgMusicUrl?:  string;
  locked?:      boolean;
}

export type TileLayerName = "floor" | "wall" | "decoration";

export type TileTextureKey = string;

export interface TileCell {
  texture: TileTextureKey;
  layer:   TileLayerName;
  color?:  string;
}

export interface TileLayer {
  gridW:    number;
  gridH:    number;
  tileSize: number;
  cells:    Record<string, TileCell>;
}

export const DEFAULT_ELEMENTS: WorldElementsConfig = {
  deskType: "standard",
  showMeetingRooms: true,
  showCafeteria: true,
  showPlants: true,
  showCabinets: true,
  chairType: "office",
  showGrass: true,
  showTrees: true,
  showFlowers: true,
};

export const AMBIENT_THEMES: { value: AmbientTheme; label: string; description: string }[] = [
  { value: "space", label: "Espaço Profundo", description: "Fundo estrelado clássico com nebulosas sutis" },
  { value: "nebula", label: "Nebulosa", description: "Cores vibrantes de nuvens interestelares" },
  { value: "asteroid", label: "Cinturão de Asteroides", description: "Ambiente rochoso e industrial" },
  { value: "galaxy", label: "Via Láctea", description: "Galáxia espiral iluminada" },
];

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  suitColor: "#7c3aed",
  helmetColor: "#06b6d4",
  accessory: "none",
  skinTone: "#FFDBB4",
  useProfilePhoto: true,
  hairStyle: "short",
  hairColor: "#2d1a0e",
  beardStyle: "none",
  faceAccessory: "none",
};

export type WorldAssetType = "furniture" | "chair" | "desk" | "computer" | "game_view";

export interface WorldGameAsset {
  id: string;
  type: string;
  name: string;
  imageUrl: string;
  previewUrl: string | null;
  config: unknown;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
