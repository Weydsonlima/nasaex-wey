"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { client } from "@/lib/orpc";
import {
  Loader2,
  AlertTriangle,
  Sparkles,
  Mic,
  MicOff,
  Video,
  VideoOff,
} from "lucide-react";
import { useSfuRoom } from "@/features/space-station/hooks/use-sfu-room";
import { StageOverlay } from "@/features/space-station/components/world/stage-overlay";

interface Props {
  slug: string;
  token: string | null;
}

interface RedeemData {
  eventId: string;
  slug: string;
  title: string;
  mapData: unknown;
  zones: unknown;
  presenceChannel: string;
  sfuStageToken: string | null;
  sfuStageRoom: string | null;
  sfuWsUrl: string | null;
  role: "speaker" | "audience" | "moderator";
}

/**
 * Cliente da página `/eventos/[slug]/enter`.
 *
 * Pipeline:
 *   1. Resgata o ticket via `worldEvents.redeemTicket` (retorna mapData,
 *      zones, sfuStageToken, role).
 *   2. Escuta `space-station:zone-enter/leave` (dispatched pelo
 *      `WorldScene.checkWorldEventZones`).
 *   3. Quando entra em `kind=stage` → conecta `useSfuRoom` com o token.
 *      Quando sai → desconecta SFU.
 *   4. Quando entra em `kind=portal` → emite "vai pra outro evento".
 *
 * O renderizador Phaser do WorldEvent (com chamada a
 * `worldScene.setWorldEventZones(zones)`) ainda é integração final que
 * fica pra PR seguinte — por agora exibimos o palco SFU isoladamente
 * quando o user manualmente clica "Subir ao palco".
 */
export function EventEnterClient({ slug, token }: Props) {
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "ready"; data: RedeemData }
    | { kind: "error"; message: string }
  >({ kind: "loading" });

  // ── SFU room (palco) ──────────────────────────────────────────────────
  const sfu = useSfuRoom();
  const [onStage, setOnStage] = useState(false);

  // ── Redeem do ticket ──────────────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      setState({
        kind: "error",
        message:
          "Token de acesso ausente. Volte pra página do evento e clique em 'Entrar'.",
      });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = (await client.worldEvents.redeemTicket({
          accessToken: token,
        })) as RedeemData;
        if (!cancelled) setState({ kind: "ready", data });
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Erro ao validar ingresso.";
        setState({ kind: "error", message: msg });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // ── Zone enter/leave → SFU connect/disconnect ─────────────────────────
  useEffect(() => {
    if (state.kind !== "ready") return;
    const { data } = state;

    const onZoneEnter = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        kind: string;
        sfuRoomId?: string;
      };
      if (detail.kind === "stage" && data.sfuStageToken && data.sfuWsUrl) {
        void sfu.connect(data.sfuStageToken, data.sfuWsUrl);
        setOnStage(true);
      }
    };
    const onZoneLeave = (e: Event) => {
      const detail = (e as CustomEvent).detail as { kind: string };
      if (detail.kind === "stage") {
        void sfu.disconnect();
        setOnStage(false);
      }
    };
    window.addEventListener("space-station:zone-enter", onZoneEnter);
    window.addEventListener("space-station:zone-leave", onZoneLeave);
    return () => {
      window.removeEventListener("space-station:zone-enter", onZoneEnter);
      window.removeEventListener("space-station:zone-leave", onZoneLeave);
    };
  }, [state, sfu]);

  // ── Render ────────────────────────────────────────────────────────────
  if (state.kind === "loading") {
    return (
      <CenterShell>
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
        <p className="text-sm text-zinc-400">Validando seu ingresso…</p>
      </CenterShell>
    );
  }
  if (state.kind === "error") {
    return (
      <CenterShell>
        <AlertTriangle className="w-8 h-8 text-amber-400" />
        <h2 className="text-base font-semibold">Não foi possível entrar</h2>
        <p className="text-sm text-zinc-400 max-w-md text-center">
          {state.message}
        </p>
        <Link
          href={`/eventos/${slug}`}
          className="text-sm text-violet-300 hover:underline"
        >
          ← Voltar pra página do evento
        </Link>
      </CenterShell>
    );
  }

  const { data } = state;

  // Botão manual de "subir ao palco" — útil enquanto o Phaser não está
  // integrado nessa página; permite testar SFU isoladamente.
  const tryEnterStage = () => {
    if (!data.sfuStageToken || !data.sfuWsUrl) return;
    void sfu.connect(data.sfuStageToken, data.sfuWsUrl);
    setOnStage(true);
  };
  const leaveStage = () => {
    void sfu.disconnect();
    setOnStage(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top bar */}
      <header className="border-b border-zinc-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span className="font-semibold">{data.title}</span>
          <span className="text-xs text-zinc-500">
            ·{" "}
            {data.role === "moderator"
              ? "Moderador"
              : data.role === "speaker"
                ? "Speaker"
                : "Audiência"}
          </span>
        </div>
        <Link
          href={`/eventos/${slug}`}
          className="text-xs text-zinc-400 hover:text-zinc-100"
        >
          Sair
        </Link>
      </header>

      {/* Conteúdo: mapa (placeholder) + palco quando ativo */}
      <main className="relative flex-1 flex flex-col">
        {/* Placeholder do mapa Phaser — integração final em PR seguinte */}
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950 relative">
          <div className="text-center space-y-3 max-w-md px-6">
            <div className="text-xs uppercase tracking-wider text-zinc-500">
              Mapa do evento (esqueleto)
            </div>
            <div className="text-sm text-zinc-400">
              O renderizador Phaser do WorldEvent (com zones e LOD) está
              wired no `WorldScene.setWorldEventZones()` — falta plugar
              o componente Phaser nessa página. Por agora, use o botão
              abaixo pra testar o palco SFU isoladamente.
            </div>
            <div className="text-[11px] text-zinc-600">
              {Array.isArray(data.zones)
                ? `${data.zones.length} zonas configuradas`
                : "0 zonas"}{" "}
              · Canal: {data.presenceChannel}
            </div>
          </div>

          {/* Stage overlay (visível quando conectado ao SFU) */}
          {onStage && (
            <StageOverlay
              participants={sfu.participants}
              connected={sfu.connected}
              connecting={sfu.connecting}
              error={sfu.error}
              localIdentity={"self"}
              role={data.role}
              onLeave={leaveStage}
            />
          )}
        </div>

        {/* Toolbar inferior — controles manuais MVP */}
        {!onStage && (
          <div className="border-t border-zinc-800 px-6 py-3 flex items-center justify-center gap-3 text-xs">
            <button
              onClick={tryEnterStage}
              disabled={!data.sfuStageToken}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-800 disabled:text-zinc-500 text-white px-4 py-2 rounded-md transition-colors"
            >
              <Video className="w-3.5 h-3.5" />
              Subir ao palco (SFU)
            </button>
            {!data.sfuStageToken && (
              <span className="text-zinc-500">
                LiveKit não configurado — defina `LIVEKIT_API_KEY/SECRET`.
              </span>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function CenterShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-zinc-950 text-zinc-100 px-6 py-12">
      {children}
    </div>
  );
}
