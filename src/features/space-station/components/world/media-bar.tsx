"use client";

import {
  Mic, MicOff, Video, VideoOff, Share2, Star, LogIn,
  Map, Users, Smile, LayoutGrid, Settings,
} from "lucide-react";
import Image from "next/image";
import type { RemotePeer } from "../../hooks/use-webrtc";

interface Props {
  nick:        string;
  userName:    string;
  userImage?:  string | null;
  micOn:       boolean;
  camOn:       boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onOpenSettings: () => void;
  onEnterRoom:    () => void;
  peers:          Map<string, RemotePeer>;
  isOwner?:       boolean;
}

export function MediaBar({
  nick, userName, userImage,
  micOn, camOn,
  onToggleMic, onToggleCam,
  onOpenSettings, onEnterRoom,
  peers, isOwner,
}: Props) {
  const activePeers = peers.size;

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 pointer-events-none select-none">
      {/* ── Left group: emoji + grid ── */}
      <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-sm rounded-2xl px-2 py-1.5 pointer-events-auto">
        <IconBtn title="Reações" onClick={() => {}}>
          <Smile className="h-4 w-4" />
        </IconBtn>
        <IconBtn title="Participantes" onClick={() => {}}>
          <div className="relative">
            <LayoutGrid className="h-4 w-4" />
            {activePeers > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-indigo-500 text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                {activePeers}
              </span>
            )}
          </div>
        </IconBtn>
      </div>

      {/* ── Center group: mic + cam ── */}
      <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-sm rounded-2xl px-3 py-1.5 pointer-events-auto">
        {/* Mic toggle */}
        <button
          onClick={onToggleMic}
          title={micOn ? "Desativar microfone" : "Ativar microfone"}
          className={`
            relative w-10 h-10 rounded-xl flex items-center justify-center transition-all
            ${micOn
              ? "bg-slate-700 hover:bg-slate-600 text-white"
              : "bg-rose-500 hover:bg-rose-400 text-white"}
          `}
        >
          {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          {!micOn && (
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-rose-400 whitespace-nowrap font-medium">
              Mudo
            </span>
          )}
        </button>

        {/* Cam toggle */}
        <button
          onClick={onToggleCam}
          title={camOn ? "Desativar câmera" : "Ativar câmera"}
          className={`
            relative w-10 h-10 rounded-xl flex items-center justify-center transition-all
            ${camOn
              ? "bg-slate-700 hover:bg-slate-600 text-white"
              : "bg-rose-500 hover:bg-rose-400 text-white"}
          `}
        >
          {camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          {!camOn && (
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-rose-400 whitespace-nowrap font-medium">
              Sem vídeo
            </span>
          )}
        </button>

        {/* Settings chevron */}
        <button
          onClick={onOpenSettings}
          title="Configurações de câmera e microfone"
          className="text-slate-400 hover:text-white transition-colors px-0.5 -ml-1"
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ── Right group: star + share + enter + map + profile ── */}
      <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-sm rounded-2xl px-2 py-1.5 pointer-events-auto">
        <IconBtn title="Favoritos">
          <Star className="h-4 w-4" />
        </IconBtn>
        <IconBtn title="Compartilhar link">
          <Share2 className="h-4 w-4" />
        </IconBtn>

        {/* Enter meeting room */}
        <button
          onClick={onEnterRoom}
          title="Entrar na sala de reunião"
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 h-8 rounded-xl transition-all"
        >
          <LogIn className="h-3.5 w-3.5" />
          Entrar
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Map */}
        <IconBtn title="Mapa">
          <Map className="h-4 w-4" />
        </IconBtn>

        {/* Separator */}
        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* User profile chip */}
        <div className="flex items-center gap-2 pl-1 pr-2">
          <div className="relative w-7 h-7">
            {userImage ? (
              <Image
                src={userImage} alt={userName}
                fill className="rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs text-white font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 rounded-full border border-slate-900" />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-white text-xs font-semibold leading-tight max-w-[90px] truncate">{userName}</p>
            <p className="text-emerald-400 text-[9px] leading-tight">Online</p>
          </div>
          <Users className="h-3.5 w-3.5 text-slate-400 ml-0.5" />
        </div>
      </div>
    </div>
  );
}

function IconBtn({ children, title, onClick }: { children: React.ReactNode; title?: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-8 h-8 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all"
    >
      {children}
    </button>
  );
}
