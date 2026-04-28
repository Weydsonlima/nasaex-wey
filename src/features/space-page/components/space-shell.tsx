"use client";

import { resolveLayout, type SpaceCardType } from "../utils/template-default";
import { SpaceHeader } from "./space-header";
import { CardProjects } from "./cards/card-projects";
import { CardCalendar } from "./cards/card-calendar";
import { CardSpaceStation } from "./cards/card-space-station";
import { CardRanking } from "./cards/card-ranking";
import { CardFollowers } from "./cards/card-followers";
import { CardReviews } from "./cards/card-reviews";
import { CardNews } from "./cards/card-news";
import { CardNBox } from "./cards/card-nbox";
import { CardForms } from "./cards/card-forms";
import { CardLinnker } from "./cards/card-linnker";
import { CardIntegrations } from "./cards/card-integrations";
import { CardStars } from "./cards/card-stars";
import { CardOrganogram } from "./cards/card-organogram";
import { SpaceCard } from "./space-card";
import { NasaFooterPublic } from "@/components/nasa-footer-public";

/**
 * Shell client-side da Spacehome. Recebe dados iniciais do SSR
 * (`initialSpace`) e monta as linhas/colunas conforme o template.
 */
interface SpaceShellProps {
  nick: string;
  initialSpace: {
    org: {
      id: string;
      name: string;
      slug: string | null;
      logo: string | null;
      bio: string | null;
      bannerUrl: string | null;
      website: string | null;
      isSpacehomePublic: boolean;
      spacehomeTemplate: string | null;
      nasaPageId: string | null;
    };
    station: {
      id: string;
      nick: string;
      starsReceived: number | null;
    } | null;
    counts: {
      followers: number;
      publishedPosts: number;
      approvedReviews: number;
      publicActions: number;
    };
    viewer: {
      userId: string | null;
      isMember: boolean;
      isAdmin: boolean;
    };
  };
}

export function SpaceShell({ nick, initialSpace }: SpaceShellProps) {
  const layout = resolveLayout(initialSpace.org.spacehomeTemplate);
  const { org, station, counts, viewer } = initialSpace;

  return (
    <div className="min-h-screen bg-slate-950 pb-20 text-white">
      <div className="mx-auto max-w-6xl space-y-5 px-4 pt-8 md:px-6">
        {layout.rows.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className={
              row.cards.length > 1
                ? "grid gap-5 md:grid-cols-2"
                : "grid gap-5"
            }
          >
            {row.cards.map((card) =>
              renderCard(card, {
                nick,
                org,
                station,
                counts,
                viewer,
              }),
            )}
          </div>
        ))}
      </div>
      <NasaFooterPublic />
    </div>
  );
}

function renderCard(
  card: SpaceCardType,
  ctx: {
    nick: string;
    org: SpaceShellProps["initialSpace"]["org"];
    station: SpaceShellProps["initialSpace"]["station"];
    counts: SpaceShellProps["initialSpace"]["counts"];
    viewer: SpaceShellProps["initialSpace"]["viewer"];
  },
) {
  switch (card) {
    case "header":
      return (
        <SpaceHeader
          key="header"
          name={ctx.org.name}
          slug={ctx.org.slug}
          nick={ctx.nick}
          logo={ctx.org.logo}
          bannerUrl={ctx.org.bannerUrl}
          bio={ctx.org.bio}
          website={ctx.org.website}
          isSpacehomePublic={ctx.org.isSpacehomePublic}
          isViewerAdmin={ctx.viewer.isAdmin}
          isViewerMember={ctx.viewer.isMember}
          followersCount={ctx.counts.followers}
          starsReceived={ctx.station?.starsReceived ?? 0}
        />
      );
    case "organogram":
      return <CardOrganogram key="organogram" nick={ctx.nick} />;
    case "projects":
      return <CardProjects key="projects" nick={ctx.nick} />;
    case "calendar":
      return <CardCalendar key="calendar" nick={ctx.nick} />;
    case "space-station":
      return (
        <CardSpaceStation
          key="space-station"
          nick={ctx.nick}
          isViewerAuthenticated={!!ctx.viewer.userId}
          isViewerMember={ctx.viewer.isMember}
        />
      );
    case "ranking":
      return <CardRanking key="ranking" nick={ctx.nick} />;
    case "followers":
      return <CardFollowers key="followers" nick={ctx.nick} />;
    case "reviews":
      return <CardReviews key="reviews" nick={ctx.nick} />;
    case "news":
      return <CardNews key="news" nick={ctx.nick} />;
    case "nbox":
      return <CardNBox key="nbox" nick={ctx.nick} />;
    case "forms":
      return <CardForms key="forms" nick={ctx.nick} />;
    case "linnker":
      return <CardLinnker key="linnker" nick={ctx.nick} />;
    case "integrations":
      return <CardIntegrations key="integrations" nick={ctx.nick} />;
    case "stars":
      return (
        <CardStars
          key="stars"
          starsReceived={ctx.station?.starsReceived ?? 0}
        />
      );
    case "footer":
      return null; // Footer is rendered outside the grid
    default:
      return (
        <SpaceCard
          key={card}
          title={friendlyTitle(card)}
          subtitle="Em breve"
          isEmpty
          empty="Este bloco estará disponível em breve."
        >
          <></>
        </SpaceCard>
      );
  }
}

function friendlyTitle(card: SpaceCardType): string {
  switch (card) {
    case "organogram":
      return "Organograma";
    case "connected-orgs":
      return "Empresas conectadas";
    case "ranking":
      return "Ranking de membros";
    case "followers":
      return "Seguidores";
    case "nbox":
      return "Arquivos públicos";
    case "forms":
      return "Formulários";
    case "chat":
      return "Atendimento";
    case "linnker":
      return "Linnker";
    case "reviews":
      return "Avaliações";
    case "news":
      return "News";
    case "social-banners":
      return "Redes sociais";
    case "integrations":
      return "Integrações ativas";
    case "stars":
      return "STARs recebidas";
    default:
      return card;
  }
}
