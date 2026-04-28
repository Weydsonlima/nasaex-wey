"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Github,
  Linkedin,
  Mail,
  FileText,
  ExternalLink,
  X,
} from "lucide-react";

/**
 * Dropdown inline no organograma — mostra skills/tools/links
 * respeitando os toggles granulares (§7.1). Se o usuário não tiver
 * ProfileCard público, mostra apenas nome/avatar.
 */
interface Props {
  userId: string;
  onClose?: () => void;
}

export function UserProfileDropdown({ userId, onClose }: Props) {
  const { data, isLoading } = useQuery(
    orpc.public.space.getUserProfileCard.queryOptions({ input: { userId } }),
  );

  if (isLoading) {
    return (
      <div className="mt-2 h-32 animate-pulse rounded-xl bg-white/5" />
    );
  }

  if (!data) {
    return (
      <div className="mt-2 rounded-xl border border-white/5 bg-white/5 p-4 text-xs text-white/60">
        Perfil não encontrado.
      </div>
    );
  }

  const { user, card, skills, tools } = data;

  return (
    <div className="relative mt-2 rounded-xl border border-orange-500/20 bg-slate-900 p-4 shadow-xl">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full text-white/60 hover:bg-white/10"
          aria-label="Fechar"
        >
          <X className="size-3" />
        </button>
      )}

      <div className="flex items-start gap-3">
        <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-white/10">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name ?? ""}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/60">
              {user.name?.[0] ?? "?"}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-semibold text-white">{user.name}</p>
          {card?.headline && (
            <p className="text-xs text-white/70">{card.headline}</p>
          )}
          {card?.bio && (
            <p className="text-xs text-white/60">{card.bio}</p>
          )}

          <div className="flex flex-wrap gap-2 pt-2 text-xs">
            {card?.linkedinUrl && (
              <a
                href={card.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-1 text-blue-300 hover:bg-blue-500/20"
              >
                <Linkedin className="size-3" />
                LinkedIn
              </a>
            )}
            {card?.githubUrl && (
              <a
                href={card.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-white/80 hover:bg-white/20"
              >
                <Github className="size-3" />
                GitHub
              </a>
            )}
            {card?.portfolioUrl && (
              <a
                href={card.portfolioUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-1 text-orange-300 hover:bg-orange-500/20"
              >
                <ExternalLink className="size-3" />
                Portfólio
              </a>
            )}
            {card?.cvUrl && (
              <a
                href={card.cvUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-green-300 hover:bg-green-500/20"
              >
                <FileText className="size-3" />
                CV
              </a>
            )}
            {card?.email && (
              <a
                href={`mailto:${card.email}`}
                className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-white/80 hover:bg-white/20"
              >
                <Mail className="size-3" />
                {card.email}
              </a>
            )}
          </div>
        </div>
      </div>

      {skills.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-[10px] uppercase tracking-wide text-white/50">
            Skills
          </p>
          <div className="flex flex-wrap gap-1">
            {skills.map((s) => (
              <Badge
                key={s.skill.id}
                variant="outline"
                className="text-[10px] text-white/70"
              >
                {s.skill.name} · {s.level}/5
              </Badge>
            ))}
          </div>
        </div>
      )}

      {tools.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-[10px] uppercase tracking-wide text-white/50">
            Ferramentas
          </p>
          <div className="flex flex-wrap gap-1">
            {tools.map((t) => (
              <Badge
                key={t.tool.id}
                variant="outline"
                className="text-[10px] text-white/70"
              >
                {t.tool.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {!card && (
        <p className="mt-3 text-xs text-white/50">
          Este usuário ainda não publicou o perfil.
        </p>
      )}

      <div className="mt-4 flex justify-end">
        <Button
          asChild
          size="sm"
          variant="outline"
          className="border-white/20 text-white/80 hover:bg-white/10"
        >
          <a href={`/profile/${userId}`} target="_blank" rel="noreferrer">
            Ver perfil completo
          </a>
        </Button>
      </div>
    </div>
  );
}
