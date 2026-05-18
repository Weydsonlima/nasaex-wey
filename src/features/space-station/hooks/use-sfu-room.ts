"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { connectRoom, publishLocalTracks } from "@/lib/livekit/client";
import type {
  Room,
  RemoteParticipant,
  RemoteTrackPublication,
} from "@/lib/livekit/client";

/**
 * `useSfuRoom` — hook que gerencia conexão com uma sala LiveKit (SFU).
 *
 * Usado nas zones "stage" do WorldEvent (auditório, palco). Quando o avatar
 * entra numa stage zone, o orchestrator (useWorld) chama `connect(token, room, url)`.
 * Quando sai, chama `disconnect()`.
 *
 * Modelo de dados expõe `participants` análogo a `peers` do `useWebRTC`
 * (mesh) — pra UI poder reusar `<VideoTile>` com o mesmo formato.
 *
 * Notas:
 *  - Publish é OPT-IN: chame `publishLocal(stream)` só quando o user for
 *    speaker. Audience só recebe (subscribeOnly).
 *  - Token traz a role nas grants do JWT — LiveKit faz o gating server-side.
 *  - Reconexão automática: LiveKit lida internamente (config padrão).
 */

export interface SfuParticipant {
  identity: string;          // userId
  name: string | null;
  isLocal: boolean;
  audioTrack: MediaStreamTrack | null;
  videoTrack: MediaStreamTrack | null;
  /** Combinado: MediaStream com audio+video pra <video srcObject>. */
  mediaStream: MediaStream | null;
  isSpeaker: boolean;        // alguém com canPublish=true
}

export interface UseSfuRoomState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  participants: Map<string, SfuParticipant>;
  localPublishing: boolean;
}

export function useSfuRoom() {
  const roomRef = useRef<Room | null>(null);
  const [state, setState] = useState<UseSfuRoomState>({
    connected: false,
    connecting: false,
    error: null,
    participants: new Map(),
    localPublishing: false,
  });

  /**
   * Conecta numa sala SFU.
   * - `token`: JWT mintado pelo backend via `lib/livekit/server.ts:mintLiveKitToken`.
   * - `url`: WS do LiveKit (opcional; default = NEXT_PUBLIC_LIVEKIT_URL).
   */
  const connect = useCallback(async (token: string, url?: string) => {
    if (roomRef.current) {
      console.warn("[useSfuRoom] already connected — ignorando connect()");
      return;
    }
    setState((s) => ({ ...s, connecting: true, error: null }));
    try {
      const room = await connectRoom({ token, url });
      roomRef.current = room;

      // Snapshot inicial dos participants
      rebuildParticipants(room);

      // Listeners
      const onChanged = () => rebuildParticipants(room);
      room.on("participantConnected", onChanged);
      room.on("participantDisconnected", onChanged);
      room.on("trackSubscribed", onChanged);
      room.on("trackUnsubscribed", onChanged);
      room.on("trackPublished", onChanged);
      room.on("trackUnpublished", onChanged);
      room.on("disconnected", () => {
        setState((s) => ({ ...s, connected: false, participants: new Map() }));
      });

      setState((s) => ({ ...s, connected: true, connecting: false }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[useSfuRoom] connect failed:", msg);
      setState((s) => ({
        ...s,
        connecting: false,
        error: `Falha ao conectar SFU: ${msg}`,
      }));
    }
  }, []);

  /** Publica audio+video do MediaStream local. Só pra speakers. */
  const publishLocal = useCallback(async (stream: MediaStream | null) => {
    const room = roomRef.current;
    if (!room || !stream) return;
    try {
      await publishLocalTracks(room, stream);
      setState((s) => ({ ...s, localPublishing: true }));
      rebuildParticipants(room);
    } catch (err) {
      console.error("[useSfuRoom] publishLocal failed:", err);
    }
  }, []);

  /** Desconecta da sala + limpa estado. Não toca o stream local (caller decide). */
  const disconnect = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    try {
      await room.disconnect();
    } finally {
      roomRef.current = null;
      setState({
        connected: false,
        connecting: false,
        error: null,
        participants: new Map(),
        localPublishing: false,
      });
    }
  }, []);

  // Cleanup ao unmount
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect().catch(() => {});
        roomRef.current = null;
      }
    };
  }, []);

  /**
   * Rebuild de `participants` Map a partir do snapshot da Room.
   * Mais simples que diff event-by-event e como tudo é referência pra
   * MediaStreamTrack, não causa re-render desnecessário no `<video>`.
   */
  function rebuildParticipants(room: Room) {
    const next = new Map<string, SfuParticipant>();
    // local
    next.set(room.localParticipant.identity, {
      identity: room.localParticipant.identity,
      name: room.localParticipant.name ?? null,
      isLocal: true,
      audioTrack: getFirstTrack(room.localParticipant, "audio"),
      videoTrack: getFirstTrack(room.localParticipant, "video"),
      mediaStream: buildStream(room.localParticipant),
      isSpeaker: room.localParticipant.permissions?.canPublish ?? false,
    });
    // remotes
    room.remoteParticipants.forEach((rp: RemoteParticipant) => {
      next.set(rp.identity, {
        identity: rp.identity,
        name: rp.name ?? null,
        isLocal: false,
        audioTrack: getFirstTrack(rp, "audio"),
        videoTrack: getFirstTrack(rp, "video"),
        mediaStream: buildStream(rp),
        isSpeaker: rp.permissions?.canPublish ?? false,
      });
    });
    setState((s) => ({ ...s, participants: next }));
  }

  return {
    ...state,
    connect,
    disconnect,
    publishLocal,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getFirstTrack(
  p: { trackPublications: Map<string, RemoteTrackPublication | unknown> },
  kind: "audio" | "video",
): MediaStreamTrack | null {
  for (const pub of p.trackPublications.values()) {
    // Type guard mínimo (LiveKit types variam entre Local/Remote)
    const track = (pub as { track?: { kind?: string; mediaStreamTrack?: MediaStreamTrack } })
      .track;
    if (track?.kind === kind && track.mediaStreamTrack) {
      return track.mediaStreamTrack;
    }
  }
  return null;
}

function buildStream(p: {
  trackPublications: Map<string, RemoteTrackPublication | unknown>;
}): MediaStream | null {
  const tracks: MediaStreamTrack[] = [];
  for (const pub of p.trackPublications.values()) {
    const track = (pub as { track?: { mediaStreamTrack?: MediaStreamTrack } })
      .track;
    if (track?.mediaStreamTrack) tracks.push(track.mediaStreamTrack);
  }
  if (tracks.length === 0) return null;
  return new MediaStream(tracks);
}
