"use client";

import { useState } from "react";
import {
  X, Settings, Rocket, Star, Globe, User, Palette, Check, AlertCircle,
  LayoutDashboard, Minus, Plus, Eye, Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUpdateWorld, useListStations, useWorldAssets } from "../../hooks/use-station";
import type {
  AvatarConfig, StationWorldConfig, WorldMapData, WorldElementsConfig,
  RoomConfig, GameView, HairStyle, BeardStyle, FaceAccessory, WorldGameAsset,
} from "../../types";
import { DEFAULT_ELEMENTS, DEFAULT_ROOMS, ROOM_META, DEFAULT_AVATAR_CONFIG } from "../../types";

interface Props {
  stationId: string;
  worldConfig: StationWorldConfig;
  avatarConfig?: AvatarConfig;
  nick: string;
  userImage?: string | null;
  onClose: () => void;
  onApply: (worldConfig: StationWorldConfig, avatarConfig: AvatarConfig) => void;
}

type Tab = "view" | "scenario" | "layout" | "avatar" | "galaxy";

const SCENARIOS = [
  { id: "station" as const, label: "Estação Espacial", emoji: "🏢", description: "Escritório moderno com área externa", preview: ["#5fa83c", "#d8d0c4"] },
  { id: "space"   as const, label: "Fundo Espacial",   emoji: "🌌", description: "Espaço profundo com asteroides",      preview: ["#0a0a1a", "#7c3aed"] },
  { id: "rocket"  as const, label: "Interior do Foguete", emoji: "🚀", description: "Dentro de uma nave espacial",       preview: ["#1a1a2e", "#ff6b35"] },
];

const GAME_VIEWS: { id: GameView; label: string; emoji: string; description: string; preview: string }[] = [
  {
    id: "aerial",
    label: "Visão Aérea",
    emoji: "🗺️",
    description: "Vista de cima do mapa, estilo Top-Down",
    preview: "grid",
  },
  {
    id: "sidescroll",
    label: "Plataforma Lateral",
    emoji: "🎮",
    description: "Vista de lado estilo Donkey Kong",
    preview: "side",
  },
];

const SUIT_COLORS   = ["#7c3aed","#2563eb","#16a34a","#dc2626","#ea580c","#0891b2","#4f46e5","#be185d","#ffffff","#111827"];
const HELMET_COLORS = ["#06b6d4","#f59e0b","#10b981","#f43f5e","#8b5cf6","#3b82f6","#ffffff","#e2e8f0"];
const SKIN_TONES    = ["#FFDBB4","#EDB98A","#D08B5B","#AE5D29","#694D3D","#292018"];
const HAIR_COLORS   = ["#2d1a0e","#8B4513","#FFD700","#CC0000","#1a1a1a","#808080","#ffffff","#4B0082"];

const HAIR_STYLES: { value: HairStyle; label: string; emoji: string }[] = [
  { value: "none",    label: "Careca",    emoji: "👤" },
  { value: "short",   label: "Curto",     emoji: "👱" },
  { value: "long",    label: "Longo",     emoji: "👩" },
  { value: "curly",   label: "Cacheado",  emoji: "🌀" },
  { value: "afro",    label: "Afro",      emoji: "✊" },
  { value: "ponytail",label: "Rabo",      emoji: "🎀" },
];

const BEARD_STYLES: { value: BeardStyle; label: string; emoji: string }[] = [
  { value: "none",    label: "Sem barba",  emoji: "😊" },
  { value: "stubble", label: "Cavanhaque", emoji: "😏" },
  { value: "short",   label: "Curta",      emoji: "🧔" },
  { value: "full",    label: "Cheia",      emoji: "🧔‍♂️" },
];

const FACE_ACCESSORIES: { value: FaceAccessory; label: string; emoji: string }[] = [
  { value: "none",       label: "Nenhum",    emoji: "😊" },
  { value: "glasses",    label: "Óculos",    emoji: "🤓" },
  { value: "sunglasses", label: "Sol",        emoji: "😎" },
];

export function WorldSettingsPanel({ stationId, worldConfig, avatarConfig, nick, userImage, onClose, onApply }: Props) {
  const [tab, setTab] = useState<Tab>("view");
  const raw = (worldConfig.mapData as WorldMapData | null);

  const [gameView,        setGameView]         = useState<GameView>(raw?.gameView ?? "aerial");
  const [scenario,        setScenario]         = useState<WorldMapData["scenario"]>(raw?.scenario ?? "station");
  const [rooms,           setRooms]            = useState<RoomConfig[]>(raw?.rooms ?? DEFAULT_ROOMS);
  const [meetingRoomCount,setMeetingRoomCount] = useState<number>(raw?.meetingRoomCount ?? 2);
  const [elements,        setElements]         = useState<WorldElementsConfig>({ ...DEFAULT_ELEMENTS, ...(raw?.elements ?? {}) });
  const [avatar,          setAvatar]           = useState<AvatarConfig>({
    ...DEFAULT_AVATAR_CONFIG,
    ...avatarConfig,
  });

  const { mutate: updateWorld, isPending } = useUpdateWorld();
  const { data: stationsData } = useListStations({ type: "ORG" });
  const { data: chairAssetsData }    = useWorldAssets("chair");
  const { data: deskAssetsData }     = useWorldAssets("desk");
  const { data: computerAssetsData } = useWorldAssets("computer");
  const { data: furnitureAssetsData } = useWorldAssets("furniture");

  const chairAssets    = (chairAssetsData?.assets    ?? []) as WorldGameAsset[];
  const deskAssets     = (deskAssetsData?.assets     ?? []) as WorldGameAsset[];
  const computerAssets = (computerAssetsData?.assets ?? []) as WorldGameAsset[];
  const furnitureAssets = (furnitureAssetsData?.assets ?? []) as WorldGameAsset[];

  const [selectedChair,    setSelectedChair]    = useState<string | null>(raw?.selectedAssets?.chair    ?? null);
  const [selectedDesk,     setSelectedDesk]     = useState<string | null>(raw?.selectedAssets?.desk     ?? null);
  const [selectedComputer, setSelectedComputer] = useState<string | null>(raw?.selectedAssets?.computer ?? null);
  const [selectedFurniture,setSelectedFurniture]= useState<string | null>(raw?.selectedAssets?.furniture?? null);
  const [saveError, setSaveError] = useState<string | null>(null);

  function toggleRoom(type: RoomConfig["type"]) {
    setRooms((prev) => prev.map((r) => r.type === type ? { ...r, enabled: !r.enabled } : r));
  }

  function handleSave() {
    setSaveError(null);
    const newMapData: WorldMapData = {
      gameView, scenario, elements, rooms, meetingRoomCount,
      selectedAssets: {
        chair:     selectedChair    ?? undefined,
        desk:      selectedDesk     ?? undefined,
        computer:  selectedComputer ?? undefined,
        furniture: selectedFurniture ?? undefined,
      },
    };
    updateWorld(
      { stationId, avatarConfig: avatar, mapData: newMapData },
      {
        onSuccess: () => onApply({ ...worldConfig, mapData: newMapData }, avatar),
        onError: (err) => {
          const msg = (err as { message?: string })?.message ?? "Erro ao salvar configurações";
          setSaveError(msg);
        },
      },
    );
  }

  const tabs: { id: Tab; label: string; Icon: React.ElementType }[] = [
    { id: "view",     label: "Visão",    Icon: Eye },
    { id: "scenario", label: "Cenário",  Icon: Star },
    { id: "layout",   label: "Layout",   Icon: LayoutDashboard },
    { id: "avatar",   label: "Avatar",   Icon: User },
    { id: "galaxy",   label: "Galáxia",  Icon: Globe },
  ];

  // Avatar preview composto
  const avatarEmoji = (() => {
    if (avatar.faceAccessory === "glasses") return "🤓";
    if (avatar.faceAccessory === "sunglasses") return "😎";
    if (avatar.hairStyle === "afro") return "👨‍🦱";
    if (avatar.hairStyle === "long") return "👩";
    return "👨‍🚀";
  })();

  return (
    <div className="absolute inset-y-0 right-0 z-30 w-96 flex flex-col bg-slate-950/98 backdrop-blur-md border-l border-white/10 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-indigo-400" />
          <h2 className="text-white font-semibold text-sm">Configurar Mundo</h2>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 overflow-x-auto">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 min-w-fit flex flex-col items-center gap-1 py-3 px-2 text-xs font-medium transition-colors whitespace-nowrap ${
              tab === id ? "text-indigo-400 border-b-2 border-indigo-400" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* ── Visão do Jogo ── */}
        {tab === "view" && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">Escolha como o mundo é visualizado</p>
            {GAME_VIEWS.map((v) => (
              <button
                key={v.id}
                onClick={() => setGameView(v.id)}
                className={`w-full text-left rounded-xl border p-4 transition-all ${
                  gameView === v.id ? "border-indigo-500 bg-indigo-500/10" : "border-white/10 hover:border-white/20 hover:bg-white/5"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Preview visual */}
                  <div className="w-20 h-14 rounded-lg flex-shrink-0 overflow-hidden border border-white/10 relative bg-slate-800">
                    {v.preview === "grid" ? (
                      // Vista aérea — grade de tiles
                      <div className="w-full h-full grid grid-cols-4 grid-rows-3 gap-px p-1">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div
                            key={i}
                            className="rounded-sm"
                            style={{
                              backgroundColor: [
                                "#5fa83c","#d8d0c4","#d8d0c4","#5fa83c",
                                "#d8d0c4","#4b3e2e","#4b3e2e","#d8d0c4",
                                "#5fa83c","#d8d0c4","#d8d0c4","#5fa83c",
                              ][i],
                            }}
                          />
                        ))}
                        <div className="absolute bottom-1 right-1 text-white text-xs">🏢</div>
                      </div>
                    ) : (
                      // Vista lateral — plataformas
                      <div className="w-full h-full relative">
                        <div className="absolute bottom-0 left-0 right-0 h-3 bg-slate-600 rounded" />
                        <div className="absolute bottom-3 left-2 w-5 h-3 bg-slate-500 rounded-sm" />
                        <div className="absolute bottom-3 left-10 w-7 h-3 bg-slate-500 rounded-sm" />
                        <div className="absolute bottom-6 left-6 w-5 h-3 bg-slate-500 rounded-sm" />
                        <div className="absolute bottom-3 left-4 text-sm">🧑‍🚀</div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white flex items-center gap-1.5">
                        <span>{v.emoji}</span>{v.label}
                      </span>
                      {gameView === v.id && <Check className="h-4 w-4 text-indigo-400 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{v.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Cenário ── */}
        {tab === "scenario" && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">Escolha o ambiente visual do seu mundo</p>
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => setScenario(s.id)}
                className={`w-full text-left rounded-xl border p-4 transition-all ${
                  scenario === s.id ? "border-indigo-500 bg-indigo-500/10" : "border-white/10 hover:border-white/20 hover:bg-white/5"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-xl"
                    style={{ background: `linear-gradient(135deg, ${s.preview[0]}, ${s.preview[1]})` }}>
                    {s.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">{s.label}</span>
                      {scenario === s.id && <Check className="h-4 w-4 text-indigo-400 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{s.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Layout ── */}
        {tab === "layout" && (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Ambientes</p>
              <p className="text-xs text-slate-600 mb-3">Escolha quais espaços terão no escritório</p>
              <div className="space-y-2">
                {rooms.map((room) => {
                  const meta = ROOM_META[room.type];
                  return (
                    <button
                      key={room.type}
                      onClick={() => toggleRoom(room.type)}
                      className="w-full flex items-center justify-between px-3 py-3 rounded-xl border border-white/10 hover:border-white/20 transition-all"
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-lg w-7 text-center">{meta.emoji}</span>
                        <span className="text-left">
                          <span className="block text-sm text-white">{meta.label}</span>
                          <span className="block text-xs text-slate-500">{meta.description}</span>
                        </span>
                      </span>
                      <div className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${room.enabled ? "bg-indigo-500" : "bg-slate-700"}`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${room.enabled ? "translate-x-4" : "translate-x-0.5"}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {rooms.find((r) => r.type === "reuniao")?.enabled && (
              <div>
                <p className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">Quantidade de Salas de Reunião</p>
                <div className="flex items-center gap-4 bg-white/5 rounded-xl p-3">
                  <button
                    onClick={() => setMeetingRoomCount((n) => Math.max(1, n - 1))}
                    className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-2xl font-bold text-white">{meetingRoomCount}</span>
                    <p className="text-xs text-slate-400">{meetingRoomCount === 1 ? "sala" : "salas"}</p>
                  </div>
                  <button
                    onClick={() => setMeetingRoomCount((n) => Math.min(8, n + 1))}
                    className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Estilo de Mesas</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: "standard", label: "Padrão",      emoji: "🖥️" },
                  { value: "space",    label: "Espacial",    emoji: "🛸" },
                  { value: "minimal",  label: "Minimalista", emoji: "📐" },
                ] as { value: WorldElementsConfig["deskType"]; label: string; emoji: string }[]).map((d) => (
                  <button key={d.value}
                    onClick={() => setElements((e) => ({ ...e, deskType: d.value }))}
                    className={`rounded-lg border py-2.5 text-xs flex flex-col items-center gap-1 transition-all ${
                      elements.deskType === d.value ? "border-indigo-500 bg-indigo-500/10 text-white" : "border-white/10 text-slate-400 hover:border-white/20"
                    }`}
                  >
                    <span className="text-base">{d.emoji}</span>{d.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Tipo de Cadeira</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: "office", label: "Escritório", emoji: "🪑" },
                  { value: "rocket", label: "Foguete",    emoji: "🚀" },
                ] as { value: WorldElementsConfig["chairType"]; label: string; emoji: string }[]).map((c) => (
                  <button key={c.value}
                    onClick={() => setElements((e) => ({ ...e, chairType: c.value }))}
                    className={`rounded-lg border py-2.5 text-xs flex items-center justify-center gap-2 transition-all ${
                      elements.chairType === c.value ? "border-indigo-500 bg-indigo-500/10 text-white" : "border-white/10 text-slate-400 hover:border-white/20"
                    }`}
                  >
                    <span>{c.emoji}</span>{c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Decoração</p>
              <div className="space-y-2">
                {([
                  { key: "showPlants",   label: "Plantas",             emoji: "🌿" },
                  { key: "showCabinets", label: "Armários",            emoji: "🗄️" },
                  { key: "showGrass",    label: "Área Externa (grama)", emoji: "🌱" },
                  { key: "showTrees",    label: "Árvores",             emoji: "🌳" },
                  { key: "showFlowers",  label: "Flores",              emoji: "🌸" },
                ] as { key: keyof WorldElementsConfig; label: string; emoji: string }[]).map(({ key, label, emoji }) => (
                  <button key={key}
                    onClick={() => setElements((e) => ({ ...e, [key]: !e[key] }))}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-white/10 hover:border-white/20 transition-all"
                  >
                    <span className="flex items-center gap-2 text-sm text-slate-300">
                      <span>{emoji}</span>{label}
                    </span>
                    <div className={`w-9 h-5 rounded-full transition-colors relative ${elements[key] ? "bg-indigo-500" : "bg-slate-700"}`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${elements[key] ? "translate-x-4" : "translate-x-0.5"}`} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Assets do admin ── */}
            {[
              { label: "Modelos de Cadeiras",    assets: chairAssets,    selected: selectedChair,    setSelected: setSelectedChair    },
              { label: "Modelos de Mesas",       assets: deskAssets,     selected: selectedDesk,     setSelected: setSelectedDesk     },
              { label: "Modelos de Computadores",assets: computerAssets, selected: selectedComputer, setSelected: setSelectedComputer },
              { label: "Mobiliário Extra",       assets: furnitureAssets,selected: selectedFurniture,setSelected: setSelectedFurniture },
            ].map(({ label, assets, selected, setSelected }) =>
              assets.length > 0 ? (
                <div key={label}>
                  <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">{label}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {assets.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setSelected(selected === a.id ? null : a.id)}
                        className={`rounded-xl border overflow-hidden flex flex-col items-center transition-all ${
                          selected === a.id ? "border-indigo-500 bg-indigo-500/10" : "border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="w-full h-14 bg-slate-800 flex items-center justify-center overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={a.previewUrl ?? a.imageUrl} alt={a.name} className="w-full h-full object-contain p-1" />
                        </div>
                        <span className="text-xs text-slate-300 px-1 py-1.5 text-center leading-tight truncate w-full">{a.name}</span>
                        {selected === a.id && <Check className="h-3 w-3 text-indigo-400 mb-1" />}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null
            )}
          </div>
        )}

        {/* ── Avatar ── */}
        {tab === "avatar" && (
          <div className="space-y-5">
            {/* Preview do astronauta */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                {/* Corpo do traje */}
                <div className="w-24 h-28 rounded-2xl flex flex-col items-center justify-end pb-2 shadow-lg"
                  style={{ background: `linear-gradient(180deg, ${avatar.suitColor}cc, ${avatar.suitColor})` }}>
                  {/* Área do rosto (capacete na mão = rosto visível) */}
                  <div className="absolute top-1 w-16 h-16 rounded-full flex items-center justify-center overflow-hidden border-2"
                    style={{ borderColor: avatar.helmetColor, backgroundColor: avatar.skinTone }}>
                    {avatar.useProfilePhoto && userImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={userImage} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">{avatarEmoji}</span>
                    )}
                  </div>
                  {/* Capacete na mão */}
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-lg" title="Capacete na mão">⛑️</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400">Astronauta com capacete na mão</p>
            </div>

            {/* Usar foto do perfil */}
            <div>
              <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Foto do Perfil</p>
              <button
                onClick={() => setAvatar((a) => ({ ...a, useProfilePhoto: !a.useProfilePhoto }))}
                className="w-full flex items-center justify-between px-3 py-3 rounded-xl border border-white/10 hover:border-white/20 transition-all"
              >
                <span className="flex items-center gap-3">
                  <Camera className="h-4 w-4 text-slate-400" />
                  <span className="text-left">
                    <span className="block text-sm text-white">Usar foto do perfil</span>
                    <span className="block text-xs text-slate-500">Exibir sua foto no rosto do astronauta</span>
                  </span>
                </span>
                <div className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${avatar.useProfilePhoto ? "bg-indigo-500" : "bg-slate-700"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${avatar.useProfilePhoto ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
              </button>
            </div>

            {/* Cabelo */}
            {!avatar.useProfilePhoto && (
              <div>
                <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Estilo do Cabelo</p>
                <div className="grid grid-cols-3 gap-2">
                  {HAIR_STYLES.map((h) => (
                    <button key={h.value}
                      onClick={() => setAvatar((a) => ({ ...a, hairStyle: h.value }))}
                      className={`rounded-lg border py-2 text-xs flex flex-col items-center gap-1 transition-all ${
                        avatar.hairStyle === h.value ? "border-indigo-500 bg-indigo-500/10 text-white" : "border-white/10 text-slate-400 hover:border-white/20"
                      }`}
                    >
                      <span className="text-base">{h.emoji}</span>{h.label}
                    </button>
                  ))}
                </div>
                {avatar.hairStyle !== "none" && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-slate-500 mb-2">Cor do Cabelo</p>
                    <div className="flex flex-wrap gap-2">
                      {HAIR_COLORS.map((color) => (
                        <button key={color} onClick={() => setAvatar((a) => ({ ...a, hairColor: color }))}
                          className="w-7 h-7 rounded-full border-2 transition-all"
                          style={{ backgroundColor: color, borderColor: avatar.hairColor === color ? "#818cf8" : "transparent" }}
                        />
                      ))}
                      <input type="color" value={avatar.hairColor}
                        onChange={(e) => setAvatar((a) => ({ ...a, hairColor: e.target.value }))}
                        className="w-7 h-7 rounded-full cursor-pointer border border-white/20 bg-transparent" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Barba */}
            {!avatar.useProfilePhoto && (
              <div>
                <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Barba</p>
                <div className="grid grid-cols-4 gap-2">
                  {BEARD_STYLES.map((b) => (
                    <button key={b.value}
                      onClick={() => setAvatar((a) => ({ ...a, beardStyle: b.value }))}
                      className={`rounded-lg border py-2 text-xs flex flex-col items-center gap-1 transition-all ${
                        avatar.beardStyle === b.value ? "border-indigo-500 bg-indigo-500/10 text-white" : "border-white/10 text-slate-400 hover:border-white/20"
                      }`}
                    >
                      <span className="text-base">{b.emoji}</span>{b.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tom de pele */}
            <div>
              <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Tom de Pele</p>
              <div className="flex flex-wrap gap-2">
                {SKIN_TONES.map((color) => (
                  <button key={color} onClick={() => setAvatar((a) => ({ ...a, skinTone: color }))}
                    className="w-8 h-8 rounded-full border-2 transition-all"
                    style={{ backgroundColor: color, borderColor: avatar.skinTone === color ? "#818cf8" : "transparent" }}
                  />
                ))}
              </div>
            </div>

            {/* Acessório do rosto */}
            <div>
              <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Acessório do Rosto</p>
              <div className="grid grid-cols-3 gap-2">
                {FACE_ACCESSORIES.map((acc) => (
                  <button key={acc.value}
                    onClick={() => setAvatar((a) => ({ ...a, faceAccessory: acc.value }))}
                    className={`rounded-lg border py-2.5 text-xs flex flex-col items-center gap-1 transition-all ${
                      avatar.faceAccessory === acc.value ? "border-indigo-500 bg-indigo-500/10 text-white" : "border-white/10 text-slate-400 hover:border-white/20"
                    }`}
                  >
                    <span className="text-base">{acc.emoji}</span>{acc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cor do Traje */}
            <div>
              <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Cor do Traje</p>
              <div className="flex flex-wrap gap-2">
                {SUIT_COLORS.map((color) => (
                  <button key={color} onClick={() => setAvatar((a) => ({ ...a, suitColor: color }))}
                    className="w-8 h-8 rounded-full border-2 transition-all"
                    style={{ backgroundColor: color, borderColor: avatar.suitColor === color ? "#818cf8" : "transparent",
                      boxShadow: avatar.suitColor === color ? "0 0 0 2px #818cf888" : "none" }}
                  />
                ))}
                <input type="color" value={avatar.suitColor}
                  onChange={(e) => setAvatar((a) => ({ ...a, suitColor: e.target.value }))}
                  className="w-8 h-8 rounded-full cursor-pointer border border-white/20 bg-transparent" />
              </div>
            </div>

            {/* Cor do Capacete */}
            <div>
              <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Cor do Capacete</p>
              <div className="flex flex-wrap gap-2">
                {HELMET_COLORS.map((color) => (
                  <button key={color} onClick={() => setAvatar((a) => ({ ...a, helmetColor: color }))}
                    className="w-8 h-8 rounded-full border-2 transition-all"
                    style={{ backgroundColor: color, borderColor: avatar.helmetColor === color ? "#818cf8" : "transparent",
                      boxShadow: avatar.helmetColor === color ? "0 0 0 2px #818cf888" : "none" }}
                  />
                ))}
                <input type="color" value={avatar.helmetColor}
                  onChange={(e) => setAvatar((a) => ({ ...a, helmetColor: e.target.value }))}
                  className="w-8 h-8 rounded-full cursor-pointer border border-white/20 bg-transparent" />
              </div>
            </div>

            {/* Acessório no corpo */}
            <div>
              <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Acessório no Traje</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: "none",    label: "Nenhum",   emoji: "👤" },
                  { value: "flag",    label: "Bandeira", emoji: "🚩" },
                  { value: "jetpack", label: "Jetpack",  emoji: "🛸" },
                ] as { value: AvatarConfig["accessory"]; label: string; emoji: string }[]).map((acc) => (
                  <button key={acc.value} onClick={() => setAvatar((a) => ({ ...a, accessory: acc.value }))}
                    className={`rounded-lg border py-2.5 text-xs flex flex-col items-center gap-1 transition-all ${
                      avatar.accessory === acc.value ? "border-indigo-500 bg-indigo-500/10 text-white" : "border-white/10 text-slate-400 hover:border-white/20"
                    }`}
                  >
                    <span className="text-base">{acc.emoji}</span>{acc.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Galáxia ── */}
        {tab === "galaxy" && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">Explore outras empresas no universo NASA</p>
            {(stationsData?.stations ?? []).filter((s: { nick: string }) => s.nick !== nick).map((s: {
              id: string; nick: string; avatarUrl?: string | null;
              org?: { name: string; logo?: string | null } | null;
              user?: { name: string; image?: string | null } | null;
              starsReceived: number;
            }) => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/10 hover:border-white/20 transition-all">
                <div className="w-10 h-10 rounded-full bg-indigo-900 flex items-center justify-center text-lg flex-shrink-0 overflow-hidden">
                  {(s.avatarUrl ?? s.org?.logo ?? s.user?.image) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.avatarUrl ?? s.org?.logo ?? s.user?.image ?? ""} alt="" className="w-full h-full object-cover" />
                  ) : "🚀"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">@{s.nick}</p>
                  <p className="text-xs text-slate-400 truncate">{s.org?.name ?? s.user?.name}</p>
                  <p className="text-xs text-amber-400">⭐ {s.starsReceived} STARs</p>
                </div>
                <Button size="sm" variant="outline"
                  className="border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10 text-xs flex-shrink-0"
                  onClick={() => window.open(`/station/${s.nick}/world`, "_blank")}
                >
                  <Rocket className="h-3 w-3 mr-1" />Visitar
                </Button>
              </div>
            ))}
            {!(stationsData?.stations?.length) && (
              <div className="text-center py-8 text-slate-500 text-sm">
                <Globe className="h-8 w-8 mx-auto mb-2 opacity-30" />
                Nenhuma estação encontrada
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {tab !== "galaxy" && (
        <div className="px-5 py-4 border-t border-white/10 space-y-3">
          {saveError && (
            <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>{saveError}</span>
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} className="flex-1 text-slate-400 hover:text-white">Cancelar</Button>
            <Button onClick={handleSave} disabled={isPending} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
              {isPending ? "Salvando..." : "Aplicar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
