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
  /** Overlays LPC estilo WorkAdventure — aplicados sobre o spritesheet base.
   *  Cada URL aponta para um PNG de overlay (64×64 por frame).
   *  A composição visual ainda não está implementada; por enquanto os valores
   *  são persistidos para que a UI lembre da última escolha do usuário. */
  wokaEyesUrl?:      string | null;
  wokaHairUrl?:      string | null;
  wokaClothesUrl?:   string | null;
  wokaHatUrl?:       string | null;
  wokaAccessoryUrl?: string | null;
  /** Multiplicador do tamanho visual do personagem no mapa.
   *  1.0 = tamanho padrão. Range válido: 0.5 (metade) a 2.5 (2.5×).
   *  O body de colisão é escalado proporcionalmente. */
  avatarScale?:      number;
}

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

export type ScenarioType =
  | "station"
  | "space"
  | "rocket"
  | "lunar_base"
  | "mission_control"
  | "lab"
  | "hangar"
  | "mars"
  | "observatory"
  | "bridge"
  | "tiled"
  | "custom";

/* ─── Tile Layer (Map Builder) ───────────────────────────────────────────── */

export type TileTextureKey =
  // Pisos
  | "floor_wood"
  | "floor_stone"
  | "floor_carpet"
  | "floor_concrete"
  | "floor_metal"
  | "floor_glass"
  | "floor_tile_white"
  | "floor_tile_dark"
  | "floor_checker"
  | "floor_parquet"
  | "floor_marble"
  | "floor_sand"
  | "floor_dirt"
  | "floor_brick"
  | "floor_hex"
  | "floor_lava"
  | "floor_ice"
  | "floor_tech"
  | "floor_snow"
  | "floor_grass"
  | "floor_plank"
  | "floor_cobble"
  // Paredes
  | "wall_brick"
  | "wall_concrete"
  | "wall_wood"
  | "wall_stone"
  | "wall_metal"
  | "wall_glass"
  | "wall_hedge"
  | "wall_tech"
  | "wall_cave"
  | "wall_sandstone"
  | "wall_ice"
  // Decoração
  | "deco_water"
  | "deco_grass"
  | "deco_flowers"
  | "deco_sand"
  | "deco_gravel"
  | "deco_bushes"
  | "deco_leaves"
  | "deco_snow"
  | "deco_rocks"
  | "deco_puddle"
  | "deco_lava"
  | "deco_stars"
  | "deco_cloud"
  | "deco_fire";

export type TileLayerName = "floor" | "wall" | "decoration";

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
  bgColor?: string;
}

/**
 * Tipos de área que podem ser desenhadas no mapa (estilo WorkAdventure).
 */
export type AreaType =
  | "silent"        // zona silenciosa (sem proximity chat)
  | "focus"         // reunião fechada, só quem estiver dentro se ouve
  | "entry"         // ponto de entrada (spawn do jogador)
  | "exit"          // portal de saída (teleporta para outra station)
  | "meeting"       // sala de reunião (abre Jitsi / vídeo)
  | "website"       // abre uma URL ao entrar
  | "play-audio"    // toca áudio ao entrar
  | "info"          // exibe mensagem informativa
  | "credits"       // exibe créditos / atribuição de licença CC BY-SA 3.0
  | "collision"     // bloqueia o movimento do jogador (paredes, mesas, etc.)
  | "custom";       // genérica (apenas visual / tag)

export interface MapArea {
  id:   string;
  name: string;
  type: AreaType;
  /** Retângulo no mundo Phaser (pixels) */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Cor do overlay (hex, ex: "#6366f1") — default depende do type */
  color?: string;
  /** Propriedades específicas por tipo */
  props?: {
    url?:        string;   // website / exit
    targetNick?: string;   // exit: nick da outra station
    audioUrl?:   string;   // play-audio
    message?:    string;   // info / credits extra note
    silent?:     boolean;  // silent area
    roomName?:   string;   // meeting
    showAssets?: boolean;  // credits: listar assets CC BY-SA
  };
}

export interface MapRoomConfig {
  /** Nome interno da sala */
  name?:      string;
  /** Cor base do piso (hex) */
  floorColor?: string;
  /** Mostrar grade no editor */
  showGrid?:  boolean;
  /** Snap-to-grid no editor (0 = off) */
  gridSize?:  number;
  /** Bloquear edição por outros colaboradores */
  locked?:    boolean;
  /** Música ambiente (URL) */
  bgMusicUrl?: string;
  /** Descrição exibida aos visitantes */
  description?: string;
}

/**
 * Objeto colocado no mapa através do Map Editor (estilo WorkAdventure).
 * Cada objeto é renderizado como uma imagem livre sobre o cenário.
 */
export interface PlacedMapObject {
  /** ID único (uuid ou timestamp+random) */
  id: string;
  /** URL da imagem (do /public ou /uploads) */
  url: string;
  /** Nome curto, exibido na UI de edição */
  name: string;
  /** Categoria (ex: "Generic", "Kitchen"…) */
  category?: string;
  /** Posição no mapa Phaser (pixels) */
  x: number;
  y: number;
  /** Rotação em graus (0–360) */
  rotation?: number;
  /** Escala (1 = 100%) */
  scale?: number;
  /** Z-index (depth no Phaser). Se omitido: 5 */
  depth?: number;
  /** true = pode colidir com o player */
  solid?: boolean;
}

export interface WorldMapData {
  scenario: ScenarioType;
  gameView: GameView;
  elements: WorldElementsConfig;
  rooms: RoomConfig[];
  meetingRoomCount: number;
  selectedAssets?: SelectedWorldAssets;
  /** Objetos personalizados colocados via Map Editor */
  placedObjects?: PlacedMapObject[];
  /** Áreas desenhadas no mapa (triggers, zonas, portais) */
  areas?: MapArea[];
  /** Configuração da sala (nome, grade, música) */
  roomConfig?: MapRoomConfig;
  /** URL do arquivo .tmj exportado pelo Tiled (usado quando scenario === "tiled") */
  tiledMapUrl?: string;
  /** URL base para resolver tilesets com caminhos relativos no .tmj */
  tiledBaseUrl?: string;
  /** Camada de tiles pintados pelo usuário no Map Builder (scenario === "custom") */
  tileLayer?: TileLayer;
}

export const AREA_TYPE_META: Record<AreaType, { label: string; emoji: string; color: string; description: string }> = {
  silent:       { label: "Silenciosa",  emoji: "🤫", color: "#6366f1", description: "Sem chat de proximidade" },
  focus:        { label: "Foco",        emoji: "🎯", color: "#c084fc", description: "Reunião fechada" },
  entry:        { label: "Entrada",     emoji: "📍", color: "#10b981", description: "Ponto de spawn" },
  exit:         { label: "Saída",       emoji: "🚪", color: "#f59e0b", description: "Teleporte para outra sala" },
  meeting:      { label: "Reunião",     emoji: "📹", color: "#3b82f6", description: "Sala de reunião com vídeo" },
  website:      { label: "Website",     emoji: "🔗", color: "#06b6d4", description: "Abre URL ao entrar" },
  "play-audio": { label: "Áudio",       emoji: "🎵", color: "#ec4899", description: "Toca áudio ao entrar" },
  info:         { label: "Info",        emoji: "ℹ️", color: "#8b5cf6", description: "Mensagem informativa" },
  credits:      { label: "Créditos",   emoji: "©",  color: "#f97316", description: "Créditos e licenças CC BY-SA 3.0" },
  collision:    { label: "Colisão",    emoji: "🚧", color: "#ef4444", description: "Bloqueia o jogador (paredes, mesas)" },
  custom:       { label: "Personalizada", emoji: "🏷️", color: "#94a3b8", description: "Área genérica" },
};

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
  avatarScale: 1,
};

export const AVATAR_SCALE_MIN = 0.5;
export const AVATAR_SCALE_MAX = 2.5;
export const AVATAR_SCALE_DEFAULT = 1;

export type WorldAssetType = "furniture" | "chair" | "desk" | "computer" | "game_view";

export interface WorldGameAsset {
  id: string;
  type: WorldAssetType;
  name: string;
  imageUrl: string;
  previewUrl: string | null;
  config: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
