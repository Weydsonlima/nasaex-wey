"use client";

import { useEffect, useRef } from "react";
import { Mic, MicOff, Video as VideoIcon, Users, AlertCircle } from "lucide-react";
import type { SfuParticipant } from "../../hooks/use-sfu-room";

interface Props {
  /** Lista de participants vinda do `useSfuRoom`. */
  participants: Map<string, SfuParticipant>;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  /** Identidade do user local (pra destacar). */
  localIdentity: string;
  /** Role do user local. Speaker vê controles de publish. */
  role: "speaker" | "audience" | "moderator";
  onLeave?: () => void;
}

/**
 * UI do palco quando o avatar entra numa stage zone do WorldEvent.
 *
 * Layout:
 *  - Top: grid grande dos speakers (1-4 tiles).
 *  - Bottom strip: contagem da audiência + indicador "ao vivo".
 *
 * Audience só recebe — sem controles de mic/cam. Speaker tem indicadores
 * de mic + sair do palco (volta pro hall, desconecta SFU, reativa mesh).
 */
export function StageOverlay({
  participants,
  connected,
  connecting,
  error,
  localIdentity,
  role,
  onLeave,
}: Props) {
  const speakers: SfuParticipant[] = [];
  const audience: SfuParticipant[] = [];
  participants.forEach((p) => {
    if (p.isSpeaker || p.identity === localIdentity) speakers.push(p);
    else audience.push(p);
  });

  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex flex-col">
      {/* Speakers grid */}
      <div className="flex-1 flex items-center justify-center p-6 pointer-events-auto">
        {connecting && (
          <div className="text-center space-y-2 text-zinc-300">
            <div className="flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-sm">Conectando ao palco…</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {connected && (
          <div
            className={
              "grid gap-3 w-full max-w-5xl " +
              (speakers.length <= 1
                ? "grid-cols-1"
                : speakers.length <= 4
                  ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-2"
                  : "grid-cols-2 sm:grid-cols-3 md:grid-cols-3")
            }
          >
            {speakers.length === 0 && (
              <div className="col-span-full text-center text-zinc-400 text-sm py-12">
                Aguardando speakers subirem ao palco…
              </div>
            )}
            {speakers.map((p) => (
              <SpeakerTile
                key={p.identity}
                participant={p}
                isLocal={p.identity === localIdentity}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="px-6 py-3 bg-zinc-900/80 backdrop-blur border-t border-zinc-800 pointer-events-auto flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 text-zinc-300">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              {connected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              )}
              <span
                className={
                  "relative inline-flex rounded-full h-2 w-2 " +
                  (connected ? "bg-red-500" : "bg-zinc-600")
                }
              />
            </span>
            <span className="font-semibold uppercase tracking-wider">
              {connected ? "Ao vivo" : "Desconectado"}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span className="tabular-nums">
              {audience.length} na audiência · {speakers.length} no palco
            </span>
          </div>

          <div className="text-zinc-500">
            {role === "speaker" || role === "moderator"
              ? "Você está no palco"
              : "Você está na audiência"}
          </div>
        </div>

        {onLeave && (
          <button
            type="button"
            onClick={onLeave}
            className="text-zinc-300 hover:text-zinc-100 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-md transition-colors"
          >
            Sair do palco
          </button>
        )}
      </div>
    </div>
  );
}

function SpeakerTile({
  participant,
  isLocal,
}: {
  participant: SfuParticipant;
  isLocal: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (videoRef.current && participant.mediaStream) {
      videoRef.current.srcObject = participant.mediaStream;
      videoRef.current.play().catch(() => {});
    }
  }, [participant.mediaStream]);

  useEffect(() => {
    if (audioRef.current && participant.mediaStream && !isLocal) {
      audioRef.current.srcObject = participant.mediaStream;
      audioRef.current.play().catch(() => {});
    }
  }, [participant.mediaStream, isLocal]);

  const hasVideo = !!participant.videoTrack;
  const hasAudio = !!participant.audioTrack;

  return (
    <div className="relative rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700 aspect-video">
      {hasVideo ? (
        <video
          ref={videoRef}
          muted
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          style={isLocal ? { transform: "scaleX(-1)" } : {}}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-violet-700 flex items-center justify-center text-2xl font-bold text-white">
            {(participant.name ?? participant.identity).charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* Áudio invisível pra remotos */}
      {!isLocal && hasAudio && (
        <audio ref={audioRef} autoPlay playsInline className="hidden" />
      )}

      {/* Footer da tile */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5 flex items-center justify-between">
        <span className="text-white text-xs font-semibold truncate">
          {participant.name ?? participant.identity}
          {isLocal ? " (você)" : ""}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {hasVideo ? null : (
            <VideoIcon className="w-3 h-3 text-zinc-400 opacity-50" />
          )}
          <span
            className={
              "w-3 h-3 " + (hasAudio ? "text-emerald-400" : "text-rose-400")
            }
          >
            {hasAudio ? (
              <Mic className="w-3 h-3" />
            ) : (
              <MicOff className="w-3 h-3" />
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
