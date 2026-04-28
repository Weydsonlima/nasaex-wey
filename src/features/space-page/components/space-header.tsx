"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Star, UserPlus } from "lucide-react";

interface SpaceHeaderProps {
  name: string;
  slug: string | null;
  nick: string;
  logo: string | null;
  bannerUrl: string | null;
  bio: string | null;
  website: string | null;
  isSpacehomePublic: boolean;
  isViewerAdmin?: boolean;
  isViewerMember?: boolean;
  followersCount?: number;
  starsReceived?: number;
}

export function SpaceHeader({
  name,
  nick,
  logo,
  bannerUrl,
  bio,
  website,
  isSpacehomePublic,
  isViewerAdmin,
  followersCount,
  starsReceived,
}: SpaceHeaderProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 shadow-xl">
      {/* Banner */}
      <div className="relative h-48 w-full md:h-60">
        {bannerUrl ? (
          <Image
            src={bannerUrl}
            alt={`Banner de ${name}`}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-orange-500/20 via-purple-500/10 to-blue-500/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
      </div>

      {/* Identidade */}
      <div className="relative -mt-16 px-6 pb-6 md:px-10">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-end md:gap-6">
          <div className="relative h-28 w-28 overflow-hidden rounded-2xl border-4 border-slate-950 bg-slate-900 shadow-lg md:h-32 md:w-32">
            {logo ? (
              <Image
                src={logo}
                alt={name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-orange-400">
                {name[0]}
              </div>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-white md:text-3xl">
                {name}
              </h1>
              <Badge variant="outline" className="text-xs text-white/70">
                @{nick}
              </Badge>
              {isSpacehomePublic ? (
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                  Pública
                </Badge>
              ) : (
                <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                  Privada
                </Badge>
              )}
            </div>

            {bio && (
              <p className="max-w-3xl text-sm text-white/80 md:text-base">
                {bio}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-white/60">
              {typeof followersCount === "number" && (
                <span>{followersCount} seguidores</span>
              )}
              {typeof starsReceived === "number" && (
                <span className="flex items-center gap-1">
                  <Star className="size-3 fill-yellow-400 text-yellow-400" />
                  {starsReceived} STARs
                </span>
              )}
              {website && (
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-orange-300 hover:text-orange-200"
                >
                  <ExternalLink className="size-3" />
                  Website
                </a>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
            >
              <UserPlus className="mr-1 size-4" />
              Seguir
            </Button>
            <Button
              size="sm"
              className="bg-yellow-500 text-slate-950 hover:bg-yellow-400"
            >
              <Star className="mr-1 size-4 fill-current" />
              Enviar STAR
            </Button>
            {isViewerAdmin && (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="border-orange-500 text-orange-400 hover:bg-orange-500/10"
              >
                <Link href={`/space/${nick}/edit`}>Editar</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
