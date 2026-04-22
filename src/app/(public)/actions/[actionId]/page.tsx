import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import prisma from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CalendarIcon, UsersIcon, ExternalLinkIcon } from "lucide-react";

interface Props {
  params: Promise<{ actionId: string }>;
}

const FALLBACK_IMAGE = "/logo.png";

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    ""
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { actionId } = await params;

  const action = await prisma.action.findUnique({
    where: { id: actionId },
    select: {
      title: true,
      coverImage: true,
      dueDate: true,
      workspace: {
        select: {
          name: true,
          organization: { select: { name: true } },
        },
      },
    },
  });

  if (!action) return { title: "Ação não encontrada" };

  const baseUrl = getBaseUrl();
  const rawImage = action.coverImage ?? FALLBACK_IMAGE;
  const image = rawImage.startsWith("http")
    ? rawImage
    : `${baseUrl}${rawImage}`;

  const title = `${action.title} — ${action.workspace.name}`;
  const description = action.dueDate
    ? `Entrega em ${format(action.dueDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} · ${action.workspace.organization.name}`
    : `${action.workspace.organization.name}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function PublicActionPage({ params }: Props) {
  const { actionId } = await params;

  const action = await prisma.action.findUnique({
    where: { id: actionId },
    select: {
      id: true,
      title: true,
      coverImage: true,
      dueDate: true,
      workspaceId: true,
      workspace: {
        select: {
          name: true,
          organization: { select: { name: true, logo: true } },
        },
      },
      participants: {
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
        },
      },
    },
  });

  if (!action) notFound();

  const coverSrc = action.coverImage ?? FALLBACK_IMAGE;
  const redirectUrl = `/workspaces/${action.workspaceId}?actionId=${action.id}`;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <div className="bg-background rounded-2xl shadow-sm overflow-hidden border">
          <div className="relative aspect-[16/9] w-full bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverSrc}
              alt={action.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-6 md:p-8 space-y-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {action.workspace.organization.name} · {action.workspace.name}
              </p>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                {action.title}
              </h1>
            </div>

            {action.dueDate && (
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="size-4 text-muted-foreground" />
                <span>
                  Entrega em{" "}
                  <strong>
                    {format(action.dueDate, "dd 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                  </strong>
                </span>
              </div>
            )}

            {action.participants.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UsersIcon className="size-4" />
                  <span>
                    Participantes ({action.participants.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {action.participants.map((p) => (
                    <div
                      key={p.user.id}
                      className="flex items-center gap-2 bg-muted/50 rounded-full pl-1 pr-3 py-1"
                    >
                      <Avatar className="size-7">
                        <AvatarImage src={p.user.image ?? undefined} />
                        <AvatarFallback>
                          {p.user.name?.charAt(0).toUpperCase() ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{p.user.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <Button asChild className="w-full sm:w-auto">
                <Link href={redirectUrl}>
                  <ExternalLinkIcon className="size-4" />
                  Abrir no N.A.S.A
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
