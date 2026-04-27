"use client";

import { useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, VideoOff } from "lucide-react";
import Image from "next/image";
import type { RemotePeer } from "../../hooks/use-webrtc";

interface Props {
  localStream:  MediaStream | null;
  localMicOn:   boolean;
  localCamOn:   boolean;
  localName:    string;
  localImage?:  string | null;
  peers:        Map<string, RemotePeer>;
}

export function VideoOverlay({ localStream, localMicOn, localCamOn, localName, localImage, peers }: Props) {
  const hasAnyVideo = localCamOn || peers.size > 0;
  if (!hasAnyVideo) return null;

  const tiles = [
    // local tile first
    {
      key:    "local",
      name:   localName,
      image:  localImage ?? null,
      stream: localCamOn ? localStream : null,
      micOn:  localMicOn,
      camOn:  localCamOn,
      isLocal: true,
    },
    // remote peers
    ...Array.from(peers.values()).map(p => ({
      key:     p.userId,
      name:    p.name,
      image:   p.image,
      stream:  p.stream,
      micOn:   p.micOn,
      camOn:   p.camOn,
      isLocal: false,
    })),
  ];

  // Grid layout: 1 tile → 1 col, 2-4 → 2 cols, 5+ → 3 cols
  const cols = tiles.length === 1 ? 1 : tiles.length <= 4 ? 2 : 3;
  const tileW = tiles.length === 1 ? 240 : 180;

  return (
    <div
      className="absolute bottom-20 right-5 z-20 flex flex-wrap gap-2 justify-end"
      style={{ maxWidth: cols * (tileW + 8) }}
    >
      {tiles.map(({ key, ...tile }) => (
        <VideoTile key={key} {...tile} width={tileW} />
      ))}
    </div>
  );
}

interface TileProps {
  name:    string;
  image:   string | null;
  stream:  MediaStream | null;
  micOn:   boolean;
  camOn:   boolean;
  isLocal: boolean;
  width:   number;
}

function VideoTile({ name, image, stream, micOn, camOn, isLocal, width }: TileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Callback ref garante que srcObject é setado assim que o elemento existe no DOM
  const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
    (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
    if (!el) return;
    if (stream && camOn) {
      el.srcObject = stream;
      el.play().catch(() => {});
    }
  }, [stream, camOn]); // eslint-disable-line react-hooks/exhaustive-deps

  // Atualiza srcObject quando stream/camOn muda (para o elemento já montado)
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (stream && camOn) {
      if (el.srcObject !== stream) {
        el.srcObject = stream;
        el.play().catch(() => {});
      }
    } else {
      el.srcObject = null;
    }
  }, [stream, camOn]);

  const height = Math.round(width * 0.5625); // 16:9

  return (
    <div
      className="relative rounded-xl overflow-hidden bg-slate-800 border border-white/10 shadow-xl flex-shrink-0"
      style={{ width, height }}
    >
      {/* Video or avatar fallback */}
      {camOn && stream ? (
        <video
          ref={setVideoRef}
          muted={isLocal}
          autoPlay playsInline
          className="w-full h-full object-cover"
          style={isLocal ? { transform: "scaleX(-1)" } : {}}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-slate-800">
          {image ? (
            <div className="relative w-14 h-14 rounded-full overflow-hidden">
              <Image src={image} alt={name} fill className="object-cover" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full bg-indigo-700 flex items-center justify-center text-2xl font-bold text-white">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          {!camOn && (
            <div className="absolute bottom-6 flex items-center gap-1 bg-black/50 rounded px-2 py-0.5">
              <VideoOff className="h-3 w-3 text-slate-300" />
              <span className="text-[10px] text-slate-300">Sem vídeo</span>
            </div>
          )}
        </div>
      )}

      {/* Name bar */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
        <span className="text-white text-[10px] font-semibold truncate max-w-[80%]">
          {isLocal ? `${name} (você)` : name}
        </span>
        <span className={`flex-shrink-0 ${micOn ? "text-emerald-400" : "text-rose-400"}`}>
          {micOn ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
        </span>
      </div>

      {/* Connecting indicator */}
      {!isLocal && !stream && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
