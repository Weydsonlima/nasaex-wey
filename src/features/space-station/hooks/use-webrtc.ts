"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface RemotePeer {
  userId: string;
  name:   string;
  image:  string | null;
  stream: MediaStream | null;
  micOn:  boolean;
  camOn:  boolean;
  nick?:         string | null;
  spriteUrl?:    string | null;
  screenOn?:     boolean;
  screenStream?: MediaStream | null;
}

interface UseWebRTCOptions {
  stationId:  string;
  userId:     string;
  userName:   string;
  userImage?: string | null;
}

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export function useWebRTC({ stationId, userId, userName, userImage }: UseWebRTCOptions) {
  const [micOn, setMicOn]   = useState(false);
  const [camOn, setCamOn]   = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [localStream,  setLocalStream]  = useState<MediaStream | null>(null);
  const [peers, setPeers]   = useState<Map<string, RemotePeer>>(new Map());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [devices, setDevices] = useState<{ audio: MediaDeviceInfo[]; video: MediaDeviceInfo[] }>({
    audio: [], video: [],
  });
  const [selectedAudio, setSelectedAudio] = useState<string>("");
  const [selectedVideo, setSelectedVideo] = useState<string>("");

  // Refs — sobrevivem re-renders sem disparar effects
  const localStreamRef  = useRef<MediaStream | null>(null);
  const pcsRef          = useRef<Map<string, RTCPeerConnection>>(new Map());
  const channelRef      = useRef<import("pusher-js").PresenceChannel | null>(null);
  const micOnRef        = useRef(false);
  const camOnRef        = useRef(false);
  // Refs para device IDs — evita closures estale em toggleMic/toggleCam
  const selectedAudioRef = useRef("");
  const selectedVideoRef = useRef("");

  // Manter refs sincronizados com estado
  useEffect(() => { micOnRef.current = micOn; }, [micOn]);
  useEffect(() => { camOnRef.current = camOn; }, [camOn]);
  useEffect(() => { selectedAudioRef.current = selectedAudio; }, [selectedAudio]);
  useEffect(() => { selectedVideoRef.current = selectedVideo; }, [selectedVideo]);

  // ── Enumerate devices ────────────────────────────────────────────────────
  const refreshDevices = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      setDevices({
        audio: all.filter(d => d.kind === "audioinput"),
        video: all.filter(d => d.kind === "videoinput"),
      });
    } catch { /* permissão não concedida ainda */ }
  }, []);

  // ── Pusher presence channel ──────────────────────────────────────────────
  useEffect(() => {
    let ch: import("pusher-js").PresenceChannel | null = null;

    async function setup() {
      const { pusherClient } = await import("@/lib/pusher");
      ch = pusherClient.subscribe(`presence-world-${stationId}`) as import("pusher-js").PresenceChannel;
      channelRef.current = ch;

      ch.bind("client-rtc-offer", async (data: { sdp: RTCSessionDescriptionInit; from: string; fromName: string; fromImage: string | null }) => {
        if (data.from === userId) return;
        const pc = getOrCreatePC(data.from, data.fromName, data.fromImage, false);
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        ch?.trigger("client-rtc-answer", { sdp: answer, from: userId, to: data.from });
      });

      ch.bind("client-rtc-answer", async (data: { sdp: RTCSessionDescriptionInit; from: string; to: string }) => {
        if (data.to !== userId) return;
        const pc = pcsRef.current.get(data.from);
        if (pc && pc.signalingState !== "stable") {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        }
      });

      ch.bind("client-rtc-ice", async (data: { candidate: RTCIceCandidateInit; from: string; to: string }) => {
        if (data.to !== userId) return;
        const pc = pcsRef.current.get(data.from);
        if (pc) {
          try { await pc.addIceCandidate(new RTCIceCandidate(data.candidate)); } catch { /* stale */ }
        }
      });

      ch.bind("client-rtc-media", (data: { from: string; micOn: boolean; camOn: boolean }) => {
        if (data.from === userId) return;
        setPeers(prev => {
          const next = new Map(prev);
          const peer = next.get(data.from);
          if (peer) next.set(data.from, { ...peer, micOn: data.micOn, camOn: data.camOn });
          return next;
        });
      });

      const onProximityEnter = (e: Event) => {
        const { peerId, peerName, peerImage } = (e as CustomEvent).detail as {
          peerId: string; peerName: string; peerImage: string | null;
        };
        if (peerId === userId) return;
        if (!pcsRef.current.has(peerId)) createOffer(peerId, peerName, peerImage);
      };

      const onProximityLeave = (e: Event) => {
        const { peerId } = (e as CustomEvent).detail as { peerId: string };
        closePeer(peerId);
      };

      window.addEventListener("space-station:proximity-enter", onProximityEnter);
      window.addEventListener("space-station:proximity-leave", onProximityLeave);
    }

    setup();
    refreshDevices();

    return () => {
      ch?.unsubscribe();
      pcsRef.current.forEach(pc => pc.close());
      pcsRef.current.clear();
      localStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationId, userId]);

  // ── RTCPeerConnection ────────────────────────────────────────────────────
  function getOrCreatePC(peerId: string, peerName: string, peerImage: string | null, _isInitiator: boolean): RTCPeerConnection {
    if (pcsRef.current.has(peerId)) return pcsRef.current.get(peerId)!;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcsRef.current.set(peerId, pc);

    localStreamRef.current?.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current!));

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) channelRef.current?.trigger("client-rtc-ice", { candidate, from: userId, to: peerId });
    };

    pc.ontrack = ({ streams }) => {
      const stream = streams[0];
      if (!stream) return;
      setPeers(prev => {
        const next = new Map(prev);
        const existing = next.get(peerId);
        next.set(peerId, {
          userId: peerId, name: peerName, image: peerImage,
          stream, micOn: existing?.micOn ?? true, camOn: existing?.camOn ?? true,
        });
        return next;
      });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        pcsRef.current.delete(peerId);
        setPeers(prev => { const n = new Map(prev); n.delete(peerId); return n; });
      }
    };

    setPeers(prev => {
      if (prev.has(peerId)) return prev;
      const next = new Map(prev);
      next.set(peerId, { userId: peerId, name: peerName, image: peerImage, stream: null, micOn: true, camOn: true });
      return next;
    });

    return pc;
  }

  async function createOffer(peerId: string, peerName: string, peerImage: string | null) {
    const pc = getOrCreatePC(peerId, peerName, peerImage, true);
    const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
    await pc.setLocalDescription(offer);
    channelRef.current?.trigger("client-rtc-offer", {
      sdp: offer, from: userId, fromName: userName, fromImage: userImage ?? null,
    });
  }

  function closePeer(peerId: string) {
    pcsRef.current.get(peerId)?.close();
    pcsRef.current.delete(peerId);
    setPeers(prev => { const n = new Map(prev); n.delete(peerId); return n; });
  }

  // ── Acquire local stream ─────────────────────────────────────────────────
  // Usa refs de device para evitar closure estale
  const acquireStream = useCallback(async (audio: boolean, video: boolean) => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());

    if (!audio && !video) {
      localStreamRef.current = null;
      setLocalStream(null);
      pcsRef.current.forEach(pc => {
        pc.getSenders().forEach(s => { if (s.track) pc.removeTrack(s); });
      });
      return;
    }

    try {
      setCamError(null);
      const constraints: MediaStreamConstraints = {
        audio: audio
          ? (selectedAudioRef.current ? { deviceId: { exact: selectedAudioRef.current } } : true)
          : false,
        video: video
          ? (selectedVideoRef.current ? { deviceId: { exact: selectedVideoRef.current } } : { width: 640, height: 480, facingMode: "user" })
          : false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      await refreshDevices();

      pcsRef.current.forEach(pc => {
        stream.getTracks().forEach(track => {
          const sender = pc.getSenders().find(s => s.track?.kind === track.kind);
          if (sender) sender.replaceTrack(track);
          else pc.addTrack(track, stream);
        });
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[useWebRTC] getUserMedia error:", msg);

      // Reverte estado
      if (video)  { camOnRef.current = false;  setCamOn(false);  }
      if (audio)  { micOnRef.current = false;   setMicOn(false);  }

      if (msg.includes("Permission denied") || msg.includes("NotAllowedError")) {
        setCamError("Permissão negada. Permita o acesso à câmera/microfone nas configurações do navegador.");
      } else if (msg.includes("NotFoundError") || msg.includes("DevicesNotFoundError")) {
        setCamError("Nenhum dispositivo de câmera/microfone encontrado.");
      } else {
        setCamError(`Erro ao acessar câmera: ${msg}`);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshDevices]);

  function broadcastMediaState(m: boolean, c: boolean) {
    channelRef.current?.trigger("client-rtc-media", { from: userId, micOn: m, camOn: c });
  }

  // ── Toggle mic ───────────────────────────────────────────────────────────
  const toggleMic = useCallback(async () => {
    const next = !micOnRef.current;
    micOnRef.current = next;
    setMicOn(next);

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = next; });
    } else if (next) {
      await acquireStream(true, camOnRef.current);
    }
    broadcastMediaState(next, camOnRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acquireStream]);

  // ── Toggle camera ────────────────────────────────────────────────────────
  const toggleCam = useCallback(async () => {
    const next = !camOnRef.current;
    camOnRef.current = next;
    setCamOn(next);

    if (!next) {
      localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = false; t.stop(); });
      // Remove video sender dos peers
      pcsRef.current.forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === "video");
        if (sender?.track) { sender.track.stop(); pc.removeTrack(sender); }
      });
      if (!micOnRef.current) {
        localStreamRef.current = null;
        setLocalStream(null);
      }
    } else {
      await acquireStream(micOnRef.current, true);
    }
    broadcastMediaState(micOnRef.current, next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acquireStream]);

  return {
    micOn, camOn, camError,
    localStream,
    peers,
    toggleMic, toggleCam,
    settingsOpen, setSettingsOpen,
    devices, selectedAudio, setSelectedAudio, selectedVideo, setSelectedVideo,
    applyDeviceChange: useCallback(async () => {
      await acquireStream(micOnRef.current, camOnRef.current);
    }, [acquireStream]),
  };
}
