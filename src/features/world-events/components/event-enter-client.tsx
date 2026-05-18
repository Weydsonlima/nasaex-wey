"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { client } from "@/lib/orpc";
import { authClient } from "@/lib/auth-client";
import { Loader2, AlertTriangle, Sparkles, Video } from "lucide-react";
import { useSfuRoom } from "@/features/space-station/hooks/use-sfu-room";
import { StageOverlay } from "@/features/space-station/components/world/stage-overlay";

// SpaceGame é dynamic-imported pra evitar SSR do Phaser (window-only).
const SpaceGame = dynamic(
  () =>
    import("@/features/space-station/components/world/space-game").then(
      (m) => m.SpaceGame,
    ),
  { ssr: false },
);

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

  return <EventLiveView slug={slug} data={data} sfu={sfu} onStage={onStage} setOnStage={setOnStage} />;
}

/**
 * Tela "ao vivo" — mostra o mapa Phaser do WorldEvent + StageOverlay sobreposto
 * quando o avatar entra numa stage zone.
 */
function EventLiveView({
  slug,
  data,
  sfu,
  onStage,
  setOnStage,
}: {
  slug: string;
  data: RedeemData;
  sfu: ReturnType<typeof useSfuRoom>;
  onStage: boolean;
  setOnStage: (v: boolean) => void;
}) {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? "guest";
  const userName = session?.user?.name ?? "Visitante";
  const userImage = session?.user?.image ?? null;

  // Constrói um StationWorldConfig a partir do mapData do evento — o SpaceGame
  // espera esse shape. O resto dos campos é default.
  const worldConfig = {
    id: data.eventId,
    stationId: data.eventId, // usado como key de identidade
    planetColor: "#4B0082",
    ambientTheme: "space" as const,
    avatarConfig: null,
    meetingPoints: null,
    npcConfig: null,
    mapData: data.mapData,
  } as unknown as Parameters<typeof SpaceGame>[0]["worldConfig"];

  // Zones já vêm tipadas do redeem. Cast leve pra evitar dependência circular.
  const zones = Array.isArray(data.zones)
    ? (data.zones as unknown as NonNullable<Parameters<typeof SpaceGame>[0]["worldEventZones"]>)
    : [];

  // Botão manual de "subir ao palco" — fallback quando o user não consegue
  // navegar com avatar (mobile sem teclado, etc).
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

      {/* Conteúdo: mapa Phaser + palco quando ativo */}
      <main className="relative flex-1 flex flex-col">
        <div className="flex-1 relative">
          <SpaceGame
            worldConfig={worldConfig}
            stationId={data.eventId}
            nick={data.slug}
            userId={userId}
            userName={userName}
            userImage={userImage}
            worldEventZones={zones}
          />

          {/* Stage overlay sobreposto quando dentro de stage zone */}
          {onStage && (
            <StageOverlay
              participants={sfu.participants}
              connected={sfu.connected}
              connecting={sfu.connecting}
              error={sfu.error}
              localIdentity={userId}
              role={data.role}
              onLeave={leaveStage}
            />
          )}
        </div>

        {/* Fallback: botão manual pro palco (se o user preferir não andar). */}
        {!onStage && data.sfuStageToken && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
            <button
              onClick={tryEnterStage}
              className="inline-flex items-center gap-2 bg-violet-600/95 hover:bg-violet-700 text-white text-xs px-4 py-2 rounded-full shadow-lg transition-colors"
              title="Conectar direto ao palco sem andar com o avatar"
            >
              <Video className="w-3.5 h-3.5" />
              Entrar no palco
            </button>
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
